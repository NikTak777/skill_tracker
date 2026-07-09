import React, { useEffect, useMemo, useState } from "react";

import { getAccessToken, getMe, login, register } from "./api.js";
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

const ROLE_LABELS = {
  manager: "Руководитель",
  employee: "Сотрудник",
};


function DashboardPage() {
  const averageProgress = Math.round(
    tasks.reduce((sum, task) => sum + task.progress, 0) / tasks.length,
  );
  const skillsCount = new Set(tasks.map((task) => task.skill)).size;

  return (
    <>
      <section className="hero">
        <p className="label">SkillTracker</p>
        <h1>Витрина задач развития</h1>
        <p>
          Одна frontend-страница для демонстрации задач сотрудников. Данные пока статические
        </p>
      </section>

      <section className="summary" aria-label="Сводка задач">
        <article>
          <span>Всего задач</span>
          <strong>{tasks.length}</strong>
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

      <TaskGrid tasks={tasks} />
    </>
  );
}


function AuthPage({ onAuthSuccess }) {
  const [mode, setMode] = useState("login");
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

        try {
          const profile = await getMe();
          role = profile.role || role;
        } catch {
          // Если /auth/me/ еще не готов, оставляем базовую роль для статуса.
        }

        setStatusMessage("Вход выполнен. Переходим на Dashboard.");
        onAuthSuccess(role);
        return;
      }

      const user = await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });
      setStatusMessage("Регистрация выполнена. Переходим на Dashboard.");
      onAuthSuccess(user.role || formData.role);
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


function TaskGrid({ tasks }) {
  if (tasks.length === 0) {
    return <p className="empty-state">Задач пока нет.</p>;
  }

  return (
    <section className="task-grid" aria-label="Список задач">
      {tasks.map((task) => (
        <article className="task-card" key={task.id}>
          <div className="task-card__top">
            <span>{task.skill}</span>
            <span>{task.status}</span>
          </div>
          <h2>{task.title}</h2>
          <p>{task.description}</p>
          <div className="progress" aria-label={`Прогресс ${task.progress}%`}>
            <span style={{ width: `${task.progress}%` }} />
          </div>
          <div className="task-card__meta">
            <span>Ответственный: {task.owner}</span>
            <span>Срок: {task.deadline}</span>
          </div>
        </article>
      ))}
    </section>
  );
}


export default function App() {
  const [activePage, setActivePage] = useState("showcase");
  const [session, setSession] = useState(() => ({
    isAuthenticated: Boolean(getAccessToken()),
    role: localStorage.getItem("skilltracker_user_role") || "",
  }));

  useEffect(() => {
    function handleUnauthorized() {
      setSession({
        isAuthenticated: false,
        role: "",
      });
      localStorage.removeItem("skilltracker_user_role");
      setActivePage("auth");
    }

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, []);

  function handleAuthSuccess(role) {
    localStorage.setItem("skilltracker_user_role", role);
    setSession({
      isAuthenticated: true,
      role,
    });
    setActivePage("showcase");
  }

  return (
    <main className="page">
      <nav className="top-nav" aria-label="Разделы приложения">
        <div className="nav-actions">
          <button
            className={activePage === "showcase" ? "active" : ""}
            type="button"
            onClick={() => setActivePage("showcase")}
          >
            Dashboard
          </button>
          <button
            className={activePage === "auth" ? "active" : ""}
            type="button"
            onClick={() => setActivePage("auth")}
          >
            Вход
          </button>
          <button
            className={activePage === "employee" ? "active" : ""}
            type="button"
            onClick={() => setActivePage("employee")}
          >
            Сотрудник
          </button>
          <button
            className={activePage === "manager" ? "active" : ""}
            type="button"
            onClick={() => setActivePage("manager")}
          >
            Руководитель
          </button>
        </div>

        <div className={`session-badge ${session.isAuthenticated ? "active" : ""}`}>
          <span className="session-icon" aria-hidden="true">
            {session.isAuthenticated ? "✓" : "?"}
          </span>
          <div>
            <strong>{session.isAuthenticated ? "В системе" : "Не в системе"}</strong>
            <span>{session.isAuthenticated ? ROLE_LABELS[session.role] || session.role : "Гость"}</span>
          </div>
        </div>
      </nav>

      {activePage === "showcase" && <DashboardPage />}
      {activePage === "auth" && <AuthPage onAuthSuccess={handleAuthSuccess} />}
      {activePage === "employee" && <EmployeeTasksPage />}
      {activePage === "manager" && <ManagerPage />}
    </main>
  );
}
