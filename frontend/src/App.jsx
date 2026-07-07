import React, { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";

import { getAccessToken, getMe, getTasks, login, register } from "./api.js";
import Navbar from "./components/Navbar.jsx";
import TaskCard from "./components/TaskCard.jsx";
import "./styles.css";

const ROLE_LABELS = {
  manager: "Руководитель",
  employee: "Сотрудник",
};

function normalizeRole(role) {
  return String(role || "").toLowerCase();
}

function getTaskList(data) {
  if (Array.isArray(data)) {
    return data;
  }

  return data?.results || data?.tasks || [];
}

function getTaskProgress(task) {
  if (typeof task.progress === "number") {
    return task.progress;
  }

  if (Array.isArray(task.progress_entries) && task.progress_entries.length > 0) {
    return task.progress_entries[0].percent;
  }

  return 0;
}

function getPersonName(person) {
  if (!person) {
    return "";
  }

  if (typeof person === "string") {
    return person;
  }

  const fullName = [person.first_name, person.last_name].filter(Boolean).join(" ");
  return fullName || person.username || "";
}

function DashboardPage({ onNavigate, session }) {
  const [dashboardTasks, setDashboardTasks] = useState([]);
  const [loadStatus, setLoadStatus] = useState("loading");

  useEffect(() => {
    async function loadTasks() {
      try {
        const data = await getTasks();
        const taskList = getTaskList(data);
        setDashboardTasks(taskList);
        setLoadStatus("success");
      } catch {
        setDashboardTasks([]);
        setLoadStatus("error");
      }
    }

    loadTasks();
  }, []);

  const averageProgress = dashboardTasks.length === 0
    ? 0
    : Math.round(
        dashboardTasks.reduce((sum, task) => sum + getTaskProgress(task), 0) / dashboardTasks.length,
      );
  const skillsCount = new Set(
    dashboardTasks.map((task) => (typeof task.skill === "string" ? task.skill : task.skill?.name)).filter(Boolean),
  ).size;

  return (
    <>
      <section className="hero">
        <p className="label">SkillTracker</p>
        <h1>Витрина задач развития</h1>
        <p>
          Dashboard загружает задачи из backend API для текущего пользователя.
        </p>
        <p className="form-message">
          {loadStatus === "loading" && "Загружаем задачи..."}
          {loadStatus === "success" && "Задачи загружены из /api/tasks/."}
          {loadStatus === "error" && "Не удалось загрузить задачи. Проверьте backend и авторизацию."}
        </p>
      </section>

      <section className="summary" aria-label="Сводка задач">
        <article>
          <span>Всего задач</span>
          <strong>{dashboardTasks.length}</strong>
        </article>
        <article>
          <span>Средний прогресс</span>
          <strong>{averageProgress}%</strong>
        </article>
        <article>
          <span>Навыков в работе</span>
          <strong>{skillsCount}</strong>
        </article>
      </section>

      <section className="role-panel">
        <div>
          <p className="label">Главная после входа</p>
          <h2>
            {session.role === "manager"
              ? "Панель руководителя"
              : "Панель сотрудника"}
          </h2>
          <p>
            {session.role === "manager"
              ? "Вы можете перейти к управлению задачами команды."
              : "Вы можете перейти к списку своих задач развития."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate(session.role === "manager" ? "/manager" : "/employee")}
        >
          {session.role === "manager" ? "Открыть панель управления" : "Открыть мои задачи"}
        </button>
      </section>

      <TaskGrid tasks={dashboardTasks} />
    </>
  );
}


function AuthPage({ initialMode = "login", onAuthSuccess }) {
  const [mode, setMode] = useState(initialMode);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "employee",
  });
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isLogin = mode === "login";

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  function updateField(event) {
    const { name, value } = event.target;
    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  }

  function getErrorMessage(error) {
    const responseData = error.response?.data;

    if (!responseData) {
      return "Backend недоступен. Проверьте, что сервер запущен.";
    }

    if (typeof responseData === "string") {
      return responseData;
    }

    if (responseData.detail) {
      return responseData.detail;
    }

    if (responseData.username) {
      return `Username: ${Array.isArray(responseData.username) ? responseData.username.join(" ") : responseData.username}`;
    }

    if (responseData.password) {
      return `Password: ${Array.isArray(responseData.password) ? responseData.password.join(" ") : responseData.password}`;
    }

    if (responseData.email) {
      return `Email: ${Array.isArray(responseData.email) ? responseData.email.join(" ") : responseData.email}`;
    }

    return "Запрос завершился ошибкой. Проверьте введенные данные.";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");
    setStatusMessage("");
    setIsSubmitting(true);

    try {
      if (isLogin) {
        await login({
          username: formData.username,
          password: formData.password,
        });
        let role = "employee";
        let username = formData.username;

        try {
          const profile = await getMe();
          role = profile.role || role;
          username = profile.username || username;
        } catch {
          // Если /auth/me/ еще не готов, оставляем базовую роль для статуса.
        }

        setStatusMessage("Вход выполнен. Переходим на Dashboard.");
        onAuthSuccess({ role, username });
        return;
      }

      const user = await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });
      await login({
        username: formData.username,
        password: formData.password,
      });

      let profile = user;
      try {
        profile = await getMe();
      } catch {
        // Если /auth/me/ временно недоступен, используем ответ регистрации.
      }

      setStatusMessage("Регистрация выполнена. Переходим на Dashboard.");
      onAuthSuccess({
        role: profile.role || formData.role,
        username: profile.username || formData.username,
      });
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="auth-layout">
      <div className="hero auth-hero">
        <p className="label">Доступ</p>
        <h1>{isLogin ? "Вход в SkillTracker" : "Регистрация пользователя"}</h1>
        <p>
          Форма отправляет данные в backend API и показывает ошибки авторизации или регистрации.
        </p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-switcher" aria-label="Выбор формы">
          <button
            className={isLogin ? "active" : ""}
            type="button"
            onClick={() => setMode("login")}
          >
            Вход
          </button>
          <button
            className={!isLogin ? "active" : ""}
            type="button"
            onClick={() => setMode("register")}
          >
            Регистрация
          </button>
        </div>

        <p className="label">{isLogin ? "Уже есть аккаунт" : "Новый аккаунт"}</p>
        <h2>{isLogin ? "Введите данные" : "Заполните профиль"}</h2>

        <label>
          Username
          <input
            name="username"
            type="text"
            placeholder="employee"
            value={formData.username}
            onChange={updateField}
            required
          />
        </label>

        {!isLogin && (
          <label>
            Email
            <input
              name="email"
              type="email"
              placeholder="employee@example.com"
              value={formData.email}
              onChange={updateField}
              required
            />
          </label>
        )}

        {!isLogin && (
          <label>
            Роль
            <select name="role" value={formData.role} onChange={updateField}>
              <option value="employee">Сотрудник</option>
              <option value="manager">Руководитель</option>
            </select>
          </label>
        )}

        <label>
          Пароль
          <input
            name="password"
            type="password"
            placeholder="Введите пароль"
            value={formData.password}
            onChange={updateField}
            required
          />
        </label>

        {errorMessage && <p className="form-message form-message--error">{errorMessage}</p>}
        {statusMessage && <p className="form-message">{statusMessage}</p>}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Отправка..." : isLogin ? "Войти" : "Создать аккаунт"}
        </button>
      </form>
    </section>
  );
}


function ManagerPage({ session }) {
  const [managerProfile, setManagerProfile] = useState({
    username: session.username,
    email: "",
    role: session.role,
  });
  const [managerTasks, setManagerTasks] = useState([]);
  const [loadStatus, setLoadStatus] = useState("loading");

  useEffect(() => {
    async function loadManagerData() {
      setLoadStatus("loading");

      try {
        const [profile, taskData] = await Promise.all([getMe(), getTasks()]);
        setManagerProfile({
          username: profile.username || session.username,
          email: profile.email || "",
          role: normalizeRole(profile.role || session.role),
        });
        setManagerTasks(getTaskList(taskData));
        setLoadStatus("success");
      } catch {
        setManagerTasks([]);
        setLoadStatus("error");
      }
    }

    loadManagerData();
  }, [session.role, session.username]);

  const teamRows = managerTasks.reduce((rows, task) => {
    const employeeName = getPersonName(task.employee) || "Не назначен";
    const current = rows.get(employeeName) || {
      name: employeeName,
      taskCount: 0,
      progressSum: 0,
    };

    current.taskCount += 1;
    current.progressSum += getTaskProgress(task);
    rows.set(employeeName, current);

    return rows;
  }, new Map());
  const teamMembers = Array.from(teamRows.values()).map((employee) => ({
    ...employee,
    progress: employee.taskCount === 0 ? 0 : Math.round(employee.progressSum / employee.taskCount),
  }));
  const teamProgress = managerTasks.length === 0
    ? 0
    : Math.round(managerTasks.reduce((sum, task) => sum + getTaskProgress(task), 0) / managerTasks.length);
  const tasksInProgress = managerTasks.filter((task) => task.status === "in_progress").length;

  return (
    <>
      <section className="hero manager-hero">
        <p className="label">Кабинет руководителя</p>
        <h1>Команда и задачи развития</h1>
        <p>
          Страница загружает профиль руководителя и задачи команды из backend API.
        </p>
        <p className="form-message">
          {loadStatus === "loading" && "Загружаем данные руководителя..."}
          {loadStatus === "success" && "Данные загружены из /api/auth/me/ и /api/tasks/."}
          {loadStatus === "error" && "Не удалось загрузить данные. Проверьте backend и авторизацию."}
        </p>
      </section>

      <section className="summary" aria-label="Сводка руководителя">
        <article>
          <span>Сотрудников</span>
          <strong>{teamMembers.length}</strong>
        </article>
        <article>
          <span>Средний прогресс</span>
          <strong>{teamProgress}%</strong>
        </article>
        <article>
          <span>В работе</span>
          <strong>{tasksInProgress}</strong>
        </article>
      </section>

      <section className="manager-layout">
        <aside className="employee-panel">
          <p className="label">Профиль</p>
          <h2>{managerProfile.username || "Руководитель"}</h2>
          <dl>
            <div>
              <dt>Роль</dt>
              <dd>{ROLE_LABELS[managerProfile.role] || managerProfile.role || "Не указана"}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{managerProfile.email || "Не указан"}</dd>
            </div>
            <div>
              <dt>Задач команды</dt>
              <dd>{managerTasks.length}</dd>
            </div>
          </dl>
        </aside>

        <section className="manager-board" aria-label="Сотрудники и задачи">
          <div className="section-heading">
            <p className="label">Команда</p>
            <h2>Прогресс сотрудников</h2>
          </div>
          <div className="employee-list">
            {teamMembers.length === 0 && <p className="empty-state">Сотрудников с задачами пока нет.</p>}
            {teamMembers.map((employee) => (
              <article className="employee-row" key={employee.name}>
                <div>
                  <h3>{employee.name}</h3>
                  <p>Данные рассчитаны по задачам из backend</p>
                </div>
                <div className="employee-row__stats">
                  <span>{employee.taskCount} задач</span>
                  <span>{employee.progress}%</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>

      <section className="manager-tasks">
        <div className="section-heading">
          <p className="label">Контроль</p>
          <h2>Все задачи команды</h2>
        </div>
        <TaskGrid tasks={managerTasks} />
      </section>
    </>
  );
}


function EmployeeTasksPage({ session }) {
  const [employeeProfile, setEmployeeProfile] = useState({
    username: session.username,
    email: "",
    role: session.role,
  });
  const [employeeTasks, setEmployeeTasks] = useState([]);
  const [loadStatus, setLoadStatus] = useState("loading");

  useEffect(() => {
    async function loadEmployeeData() {
      setLoadStatus("loading");

      try {
        const [profile, taskData] = await Promise.all([getMe(), getTasks()]);
        setEmployeeProfile({
          username: profile.username || session.username,
          email: profile.email || "",
          role: normalizeRole(profile.role || session.role),
        });
        setEmployeeTasks(getTaskList(taskData));
        setLoadStatus("success");
      } catch {
        setEmployeeTasks([]);
        setLoadStatus("error");
      }
    }

    loadEmployeeData();
  }, [session.role, session.username]);

  const completedProgress = employeeTasks.length === 0
    ? 0
    : Math.round(
        employeeTasks.reduce((sum, task) => sum + getTaskProgress(task), 0) / employeeTasks.length,
      );

  return (
    <>
      <section className="hero employee-hero">
        <p className="label">Кабинет сотрудника</p>
        <h1>Мои задачи развития</h1>
        <p>
          Страница загружает профиль сотрудника и его задачи из backend API.
        </p>
        <p className="form-message">
          {loadStatus === "loading" && "Загружаем данные сотрудника..."}
          {loadStatus === "success" && "Данные загружены из /api/auth/me/ и /api/tasks/."}
          {loadStatus === "error" && "Не удалось загрузить данные. Проверьте backend и авторизацию."}
        </p>
      </section>

      <section className="employee-layout">
        <aside className="employee-panel">
          <p className="label">Профиль</p>
          <h2>{employeeProfile.username || "Сотрудник"}</h2>
          <dl>
            <div>
              <dt>Роль</dt>
              <dd>{ROLE_LABELS[employeeProfile.role] || employeeProfile.role || "Не указана"}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{employeeProfile.email || "Не указан"}</dd>
            </div>
            <div>
              <dt>Активных задач</dt>
              <dd>{employeeTasks.length}</dd>
            </div>
            <div>
              <dt>Средний прогресс</dt>
              <dd>{completedProgress}%</dd>
            </div>
          </dl>
        </aside>

        <section className="employee-content" aria-label="Задачи сотрудника">
          <div className="section-heading">
            <p className="label">План на неделю</p>
            <h2>Назначенные задачи</h2>
          </div>
          <TaskGrid tasks={employeeTasks} />
        </section>
      </section>
    </>
  );
}


function TaskGrid({ tasks: taskList }) {
  if (taskList.length === 0) {
    return <p className="empty-state">Задач пока нет.</p>;
  }

  return (
    <section className="task-grid" aria-label="Список задач">
      {taskList.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </section>
  );
}

function PrivateRoute({ authChecked, children, session }) {
  if (!authChecked) {
    return <p className="empty-state">Проверяем авторизацию...</p>;
  }

  if (!session.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}


export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [authChecked, setAuthChecked] = useState(false);
  const [session, setSession] = useState(() => ({
    isAuthenticated: Boolean(getAccessToken()),
    role: localStorage.getItem("skilltracker_user_role") || "",
    username: localStorage.getItem("skilltracker_username") || "",
  }));

  useEffect(() => {
    async function loadCurrentUser() {
      const token = getAccessToken();

      if (!token) {
        setSession({
          isAuthenticated: false,
          role: "",
          username: "",
        });
        setAuthChecked(true);
        return;
      }

      try {
        const profile = await getMe();
        const role = normalizeRole(profile.role);
        const username = profile.username || "";

        localStorage.setItem("skilltracker_user_role", role);
        localStorage.setItem("skilltracker_username", username);
        setSession({
          isAuthenticated: true,
          role,
          username,
        });
      } catch {
        localStorage.removeItem("skilltracker_user_role");
        localStorage.removeItem("skilltracker_username");
        setSession({
          isAuthenticated: false,
          role: "",
          username: "",
        });
      } finally {
        setAuthChecked(true);
      }
    }

    loadCurrentUser();
  }, []);

  useEffect(() => {
    function handleUnauthorized() {
      setSession({
        isAuthenticated: false,
        role: "",
        username: "",
      });
      localStorage.removeItem("skilltracker_user_role");
      localStorage.removeItem("skilltracker_username");
      navigate("/login", { replace: true });
    }

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, [navigate]);

  function handleAuthSuccess({ role, username }) {
    const normalizedRole = normalizeRole(role);

    localStorage.setItem("skilltracker_user_role", normalizedRole);
    localStorage.setItem("skilltracker_username", username);
    setSession({
      isAuthenticated: true,
      role: normalizedRole,
      username,
    });
    setAuthChecked(true);
    navigate("/dashboard", { replace: true });
  }

  function handleLogout() {
    setSession({
      isAuthenticated: false,
      role: "",
      username: "",
    });
    navigate("/login", { replace: true });
  }

  return (
    <main className="page">
      <Navbar
        activePath={location.pathname}
        onLogout={handleLogout}
        onNavigate={navigate}
        session={session}
      />

      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<AuthPage initialMode="login" onAuthSuccess={handleAuthSuccess} />} />
        <Route path="/register" element={<AuthPage initialMode="register" onAuthSuccess={handleAuthSuccess} />} />
        <Route
          path="/dashboard"
          element={(
            <PrivateRoute authChecked={authChecked} session={session}>
              <DashboardPage onNavigate={navigate} session={session} />
            </PrivateRoute>
          )}
        />
        <Route
          path="/employee"
          element={(
            <PrivateRoute authChecked={authChecked} session={session}>
              <EmployeeTasksPage session={session} />
            </PrivateRoute>
          )}
        />
        <Route
          path="/manager"
          element={(
            <PrivateRoute authChecked={authChecked} session={session}>
              <ManagerPage session={session} />
            </PrivateRoute>
          )}
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </main>
  );
}
