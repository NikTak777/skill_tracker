import React, { useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";

import { getAccessToken, getMe, getTasks, login, register } from "./api.js";
import Navbar from "./components/Navbar.jsx";
import TaskCard from "./components/TaskCard.jsx";
import "./styles.css";


const tasks = [
  {
    id: 1,
    title: "Задача 1",
    owner: "Анна Петрова",
    skill: "Умение 1",
    status: "В работе",
    progress: 65,
    deadline: "05.07.2026",
    description: "комент 1",
  },
  {
    id: 2,
    title: "Задача 2",
    owner: "Иван Соколов",
    skill: "умение 2",
    status: "Запланировано",
    progress: 20,
    deadline: "08.07.2026",
    description: "комент2 ",
  },
  {
    id: 3,
    title: "Задача 3",
    owner: "Мария Иванова",
    skill: "умение 3",
    status: "Проверка",
    progress: 80,
    deadline: "10.07.2026",
    description: "комент 3",
  },
];

const employees = [
  {
    id: 1,
    name: "Анна Петрова",
    role: "Frontend trainee",
  },
  {
    id: 2,
    name: "Иван Соколов",
    role: "DevOps trainee",
  },
  {
    id: 3,
    name: "Мария Иванова",
    role: "Backend trainee",
  },
];

function normalizeRole(role) {
  return String(role || "").toLowerCase();
}

function DashboardPage({ onNavigate, session }) {
  const [dashboardTasks, setDashboardTasks] = useState(tasks);
  const [loadStatus, setLoadStatus] = useState("loading");

  useEffect(() => {
    async function loadTasks() {
      try {
        const data = await getTasks();
        const taskList = Array.isArray(data) ? data : data.results || data.tasks || [];
        setDashboardTasks(taskList);
        setLoadStatus("success");
      } catch {
        setDashboardTasks(tasks);
        setLoadStatus("fallback");
      }
    }

    loadTasks();
  }, []);

  const averageProgress = dashboardTasks.length === 0
    ? 0
    : Math.round(
        dashboardTasks.reduce((sum, task) => sum + (task.progress || 0), 0) / dashboardTasks.length,
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
          Dashboard загружает задачи из backend API. Если API недоступно, показываются демо-данные.
        </p>
        <p className="form-message">
          {loadStatus === "loading" && "Загружаем задачи..."}
          {loadStatus === "success" && "Задачи загружены из /api/tasks/."}
          {loadStatus === "fallback" && "Backend недоступен или нет доступа, показаны демо-данные."}
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


function ManagerPage() {
  const teamProgress = Math.round(
    tasks.reduce((sum, task) => sum + task.progress, 0) / tasks.length,
  );
  const tasksInProgress = tasks.filter((task) => task.status === "В работе").length;

  return (
    <>
      <section className="hero manager-hero">
        <p className="label">Кабинет руководителя</p>
        <h1>Команда и задачи развития</h1>
        <p>
          Страница помогает руководителю видеть прогресс сотрудников, назначенные задачи и
          прототип формы для постановки новой задачи.
        </p>
      </section>

      <section className="summary" aria-label="Сводка руководителя">
        <article>
          <span>Сотрудников</span>
          <strong>{employees.length}</strong>
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
        <form className="manager-form">
          <p className="label">Новая задача</p>
          <h2>Поставить задачу</h2>
          <label>
            Название
            <input type="text" placeholder="" />
          </label>
          <label>
            Сотрудник
            <select defaultValue="Анна Петрова">
              {employees.map((employee) => (
                <option key={employee.id} value={employee.name}>
                  {employee.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Навык
            <input type="text" placeholder="" />
          </label>
          <label>
            Описание
            <textarea placeholder="" />
          </label>
          <button type="button">Создать задачу</button>
        </form>

        <section className="manager-board" aria-label="Сотрудники и задачи">
          <div className="section-heading">
            <p className="label">Команда</p>
            <h2>Прогресс сотрудников</h2>
          </div>
          <div className="employee-list">
            {employees.map((employee) => {
              const employeeTasks = tasks.filter((task) => task.owner === employee.name);
              const progress = employeeTasks.length === 0
                ? 0
                : Math.round(
                    employeeTasks.reduce((sum, task) => sum + task.progress, 0) / employeeTasks.length,
                  );

              return (
                <article className="employee-row" key={employee.id}>
                  <div>
                    <h3>{employee.name}</h3>
                    <p>{employee.role}</p>
                  </div>
                  <div className="employee-row__stats">
                    <span>{employeeTasks.length} задач</span>
                    <span>{progress}%</span>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </section>

      <section className="manager-tasks">
        <div className="section-heading">
          <p className="label">Контроль</p>
          <h2>Все задачи команды</h2>
        </div>
        <TaskGrid tasks={tasks} />
      </section>
    </>
  );
}


function EmployeeTasksPage() {
  const employeeName = "Анна Петрова";
  const employeeTasks = useMemo(
    () => tasks.filter((task) => task.owner === employeeName),
    [],
  );
  const completedProgress = Math.round(
    employeeTasks.reduce((sum, task) => sum + task.progress, 0) / employeeTasks.length,
  );

  return (
    <>
      <section className="hero employee-hero">
        <p className="label">Кабинет сотрудника</p>
        <h1>Мои задачи развития</h1>
        <p>
          Страница показывает задачи конкретного сотрудника, их статусы, сроки и текущий прогресс.
        </p>
      </section>

      <section className="employee-layout">
        <aside className="employee-panel">
          <p className="label">Профиль</p>
          <h2>{employeeName}</h2>
          <dl>
            <div>
              <dt>Роль</dt>
              <dd>Frontend trainee</dd>
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
              <EmployeeTasksPage />
            </PrivateRoute>
          )}
        />
        <Route
          path="/manager"
          element={(
            <PrivateRoute authChecked={authChecked} session={session}>
              <ManagerPage />
            </PrivateRoute>
          )}
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </main>
  );
}
