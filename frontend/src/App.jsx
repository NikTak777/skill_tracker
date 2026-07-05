import React, { useEffect, useMemo, useState } from "react";

import { login as loginRequest, register as registerRequest } from "./api.js";
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


function ShowcasePage() {
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
    name: "",
    username: "",
    email: "",
    role: "employee",
    password: "",
    passwordConfirm: "",
  });
  const [message, setMessage] = useState("");
  const isLogin = mode === "login";

  function updateField(event) {
    const { name, value } = event.target;
    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("Отправляем данные...");

    try {
      if (isLogin) {
        await loginRequest({
          username: formData.username,
          password: formData.password,
        });
        setMessage("Вход выполнен. Токен сохранен в localStorage.");
        onAuthSuccess();
        return;
      }

      await registerRequest({
        name: formData.name,
        username: formData.username,
        email: formData.email,
        role: formData.role,
        password: formData.password,
        password_confirm: formData.passwordConfirm,
      });
      setMessage("Регистрация отправлена. Теперь можно войти.");
      setMode("login");
    } catch {
      setMessage("Запрос не выполнен. Возможно, backend endpoint пока не готов.");
    }
  }

  return (
    <section className="auth-layout">
      <div className="hero auth-hero">
        <p className="label">Доступ</p>
        <h1>{isLogin ? "Вход в SkillTracker" : "Регистрация пользователя"}</h1>
        <p>
          Статический прототип формы. Сейчас поля не отправляются на сервер и нужны только для
          демонстрации будущего сценария авторизации.
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

        {!isLogin && (
          <label>
            Имя
            <input
              name="name"
              type="text"
              placeholder="Анна Петрова"
              value={formData.name}
              onChange={updateField}
            />
          </label>
        )}

        <label>
          Логин
          <input
            name="username"
            type="text"
            placeholder="employee"
            value={formData.username}
            onChange={updateField}
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
            />
          </label>
        )}

        {isLogin && (
          <label>
            Email
            <input
              name="email"
              type="email"
              placeholder="employee@example.com"
              value={formData.email}
              onChange={updateField}
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
          />
        </label>

        {!isLogin && (
          <label>
            Повтор пароля
            <input
              name="passwordConfirm"
              type="password"
              placeholder="Повторите пароль"
              value={formData.passwordConfirm}
              onChange={updateField}
            />
          </label>
        )}

        {message && <p className="form-message">{message}</p>}

        <button type="submit">{isLogin ? "Войти" : "Создать аккаунт"}</button>
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

  useEffect(() => {
    function handleUnauthorized() {
      setActivePage("auth");
    }

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, []);

  return (
    <main className="page">
      <nav className="top-nav" aria-label="Разделы приложения">
        <button
          className={activePage === "showcase" ? "active" : ""}
          type="button"
          onClick={() => setActivePage("showcase")}
        >
          Витрина
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
      </nav>

      {activePage === "showcase" && <ShowcasePage />}
      {activePage === "auth" && <AuthPage onAuthSuccess={() => setActivePage("showcase")} />}
      {activePage === "employee" && <EmployeeTasksPage />}
      {activePage === "manager" && <ManagerPage />}
    </main>
  );
}
