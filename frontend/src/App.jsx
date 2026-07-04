import React, { useMemo, useState } from "react";

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
          className={activePage === "employee" ? "active" : ""}
          type="button"
          onClick={() => setActivePage("employee")}
        >
          Сотрудник
        </button>
      </nav>

      {activePage === "showcase" ? <ShowcasePage /> : <EmployeeTasksPage />}
    </main>
  );
}
