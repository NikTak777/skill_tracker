import { useEffect, useState } from "react";

import { createTask, getMe, getSkills, getTasks } from "../api.js";
import TaskCard from "../components/TaskCard.jsx";


const ROLE_LABELS = {
  manager: "Руководитель",
  employee: "Сотрудник",
};

const INITIAL_FORM = {
  title: "",
  description: "",
  skill: "",
  employee: "",
  due_date: "",
};

function getList(data) {
  if (Array.isArray(data)) {
    return data;
  }

  return data?.results || data?.tasks || data?.skills || [];
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

function getApiErrorMessage(error) {
  const data = error.response?.data;

  if (!data) {
    return "Backend недоступен. Проверьте, что сервер запущен.";
  }

  if (typeof data === "string") {
    return data;
  }

  if (data.detail) {
    return data.detail;
  }

  if (data.errors) {
    return "Ошибка валидации: проверьте title, skill ID, employee ID и due date.";
  }

  const fieldErrors = Object.entries(data)
    .map(([field, value]) => `${field}: ${Array.isArray(value) ? value.join(" ") : value}`)
    .join(" ");

  return fieldErrors || "Запрос завершился ошибкой. Проверьте данные формы.";
}

export default function ManagerPanel({ session }) {
  const [managerProfile, setManagerProfile] = useState({
    username: session.username,
    email: "",
    role: session.role,
  });
  const [skills, setSkills] = useState([]);
  const [managerTasks, setManagerTasks] = useState([]);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [loadStatus, setLoadStatus] = useState("loading");
  const [formStatus, setFormStatus] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadManagerData() {
    setLoadStatus("loading");

    try {
      const [profile, taskData, skillData] = await Promise.all([getMe(), getTasks(), getSkills()]);

      setManagerProfile({
        username: profile.username || session.username,
        email: profile.email || "",
        role: String(profile.role || session.role || "").toLowerCase(),
      });
      setManagerTasks(getList(taskData));
      setSkills(getList(skillData));
      setLoadStatus("success");
    } catch {
      setManagerTasks([]);
      setSkills([]);
      setLoadStatus("error");
    }
  }

  useEffect(() => {
    loadManagerData();
  }, [session.role, session.username]);

  function updateField(event) {
    const { name, value } = event.target;
    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormStatus("");
    setFormError("");
    setIsSubmitting(true);

    try {
      await createTask({
        title: formData.title,
        description: formData.description,
        skill: Number(formData.skill),
        employee: Number(formData.employee),
        due_date: formData.due_date || null,
      });

      setFormData(INITIAL_FORM);
      setFormStatus("Задача создана. Список задач обновлен.");
      await loadManagerData();
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

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
        <h1>Создание задач и контроль сотрудников</h1>
        <p>
          Руководитель создает задачи развития, назначает сотрудника по ID и контролирует список
          своих задач из backend API.
        </p>
        <p className="form-message">
          {loadStatus === "loading" && "Загружаем данные руководителя..."}
          {loadStatus === "success" && "Данные загружены из /api/auth/me/, /api/tasks/ и /api/skills/."}
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
        <form className="manager-form" onSubmit={handleSubmit}>
          <p className="label">Новая задача</p>
          <h2>Поставить задачу</h2>

          <label>
            Название
            <input
              name="title"
              type="text"
              value={formData.title}
              onChange={updateField}
              required
            />
          </label>

          <label>
            Описание
            <textarea
              name="description"
              value={formData.description}
              onChange={updateField}
            />
          </label>

          <label>
            Навык
            <select name="skill" value={formData.skill} onChange={updateField} required>
              <option value="">Выберите навык</option>
              {skills.map((skill) => (
                <option key={skill.id} value={skill.id}>
                  {skill.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            ID сотрудника
            <input
              min="1"
              name="employee"
              placeholder="Например: 2"
              type="number"
              value={formData.employee}
              onChange={updateField}
              required
            />
          </label>

          <label>
            Срок
            <input
              name="due_date"
              type="date"
              value={formData.due_date}
              onChange={updateField}
            />
          </label>

          {formError && <p className="form-message form-message--error">{formError}</p>}
          {formStatus && <p className="form-message">{formStatus}</p>}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Создаем..." : "Создать задачу"}
          </button>
        </form>

        <section className="manager-board" aria-label="Профиль и сотрудники">
          <div className="section-heading">
            <p className="label">Профиль</p>
            <h2>{managerProfile.username || "Руководитель"}</h2>
          </div>

          <dl className="profile-list">
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

          <div className="section-heading manager-team-heading">
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
          <h2>Все задачи руководителя</h2>
        </div>
        <section className="task-grid" aria-label="Список задач руководителя">
          {managerTasks.length === 0 && <p className="empty-state">Задач пока нет.</p>}
          {managerTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </section>
      </section>
    </>
  );
}
