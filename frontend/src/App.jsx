import React from "react";

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


export default function App() {
  return (
    <main className="page">
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
          <strong>{Math.round(tasks.reduce((sum, task) => sum + task.progress, 0) / tasks.length)}%</strong>
        </article>
        <article>
          <span>Навыков в работе</span>
          <strong>{new Set(tasks.map((task) => task.skill)).size}</strong>
        </article>
      </section>

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
    </main>
  );
}
