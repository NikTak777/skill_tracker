import React, { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";

import { getAccessToken, getMe, getTasks, login, register } from "./api.js";
import Navbar from "./components/Navbar.jsx";
import TaskCard from "./components/TaskCard.jsx";
import EmployeeTasks from "./pages/EmployeeTasks.jsx";
import ManagerPanel from "./pages/ManagerPanel.jsx";
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

function PrivateRoute({ authChecked, children, role, session }) {
  if (!authChecked) {
    return <p className="empty-state">Проверяем авторизацию...</p>;
  }

  if (!session.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role && session.role !== role) {
    return <Navigate to="/dashboard" replace />;
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
              <EmployeeTasks session={session} />
            </PrivateRoute>
          )}
        />
        <Route
          path="/manager"
          element={(
            <PrivateRoute authChecked={authChecked} role="manager" session={session}>
              <ManagerPanel session={session} />
            </PrivateRoute>
          )}
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </main>
  );
}
