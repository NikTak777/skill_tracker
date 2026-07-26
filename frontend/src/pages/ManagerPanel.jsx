import { useEffect, useState } from "react";

import {
  attachProgressToTasks,
  createSkill,
  createTask,
  getEmployees,
  getMe,
  getSkills,
  getTasks,
} from "../api.js";
import getApiErrorMessage from "../utils/getApiErrorMessage.js";
import { getTaskProgress } from "../utils/taskProgress.js";
import TaskCard from "../components/TaskCard.jsx";
import TaskDetailModal from "../components/TaskDetailModal.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import { useSession } from "../context/SessionContext.jsx";


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

const INITIAL_SKILL_FORM = {
  name: "",
  description: "",
};

function getList(data) {
  if (Array.isArray(data)) {
    return data;
  }

  return data?.results || data?.tasks || data?.skills || data?.employees || [];
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

function getEmployeeLabel(employee) {
  const name = getPersonName(employee) || employee.username;
  if (employee.email) {
    return `${name} (${employee.email})`;
  }

  return name;
}

export default function ManagerPanel() {
  const { session } = useSession();
  const [managerProfile, setManagerProfile] = useState({
    username: session.username,
    email: "",
    role: session.role,
  });
  const [skills, setSkills] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [managerTasks, setManagerTasks] = useState([]);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [skillFormData, setSkillFormData] = useState(INITIAL_SKILL_FORM);
  const [loadStatus, setLoadStatus] = useState("loading");
  const [formStatus, setFormStatus] = useState("");
  const [formError, setFormError] = useState("");
  const [skillFormStatus, setSkillFormStatus] = useState("");
  const [skillFormError, setSkillFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingSkill, setIsCreatingSkill] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  async function loadManagerData() {
    setLoadStatus("loading");

    try {
      const [profileResult, taskResult, skillResult, employeeResult] = await Promise.allSettled([
        getMe(),
        getTasks(),
        getSkills(),
        getEmployees(),
      ]);

      if (profileResult.status === "fulfilled") {
        const profile = profileResult.value;
        setManagerProfile({
          username: profile.username || session.username,
          email: profile.email || "",
          role: String(profile.role || session.role || "").toLowerCase(),
        });
      }

      const tasks = taskResult.status === "fulfilled" ? getList(taskResult.value) : [];
      const tasksWithProgress = await attachProgressToTasks(tasks);

      setManagerTasks(tasksWithProgress);
      setSkills(skillResult.status === "fulfilled" ? getList(skillResult.value) : []);
      setEmployees(employeeResult.status === "fulfilled" ? getList(employeeResult.value) : []);

      const hasCriticalError = [profileResult, taskResult, skillResult].some(
        (result) => result.status === "rejected",
      );

      setLoadStatus(hasCriticalError ? "error" : "success");
    } catch {
      setManagerTasks([]);
      setSkills([]);
      setEmployees([]);
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

  function updateSkillField(event) {
    const { name, value } = event.target;
    setSkillFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  }

  async function handleSkillSubmit(event) {
    event.preventDefault();
    setSkillFormStatus("");
    setSkillFormError("");
    setIsCreatingSkill(true);

    try {
      const createdSkill = await createSkill({
        name: skillFormData.name.trim(),
        description: skillFormData.description.trim(),
      });

      setSkillFormData(INITIAL_SKILL_FORM);
      setSkillFormStatus("Навык добавлен.");
      setFormData((currentData) => ({
        ...currentData,
        skill: String(createdSkill.id),
      }));
      await loadManagerData();
    } catch (error) {
      setSkillFormError(getApiErrorMessage(error, "Не удалось создать навык."));
    } finally {
      setIsCreatingSkill(false);
    }
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

  if (loadStatus === "loading") {
    return <LoadingSpinner label="Загружаем данные руководителя..." />;
  }

  return (
    <>
      <section className="hero manager-hero">
        <p className="label">Кабинет руководителя</p>
        <h1>Создание задач и контроль сотрудников</h1>
        <p>
          Руководитель создаёт задачи, выбирает сотрудника из списка, добавляет навыки
          и контролирует задачи команды через backend API.
        </p>
        <p className="form-message">
          {loadStatus === "success" && "Данные загружены из /api/auth/me/, /api/tasks/, /api/skills/ и /api/employees/."}
          {loadStatus === "error" && "Не удалось загрузить данные. Проверьте сервер и авторизацию."}
        </p>
      </section>

      <section className="summary" aria-label="Сводка руководителя">
        <article>
          <span>Сотрудников</span>
          <strong>{employees.length || teamMembers.length}</strong>
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
        <div className="manager-forms">
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
              Сотрудник
              <select name="employee" value={formData.employee} onChange={updateField} required>
                <option value="">Выберите сотрудника</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {getEmployeeLabel(employee)}
                  </option>
                ))}
              </select>
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

            {employees.length === 0 && (
              <p className="form-message form-message--error">
                Сотрудники не найдены. Зарегистрируйте пользователя с ролью employee.
              </p>
            )}

            {formError && <p className="form-message form-message--error">{formError}</p>}
            {formStatus && <p className="form-message">{formStatus}</p>}

            <button type="submit" disabled={isSubmitting || employees.length === 0}>
              {isSubmitting ? "Создаем..." : "Создать задачу"}
            </button>
          </form>

          <form className="manager-form manager-skill-form" onSubmit={handleSkillSubmit}>
            <p className="label">Справочник</p>
            <h2>Новый навык</h2>

            <label>
              Название
              <input
                name="name"
                type="text"
                value={skillFormData.name}
                onChange={updateSkillField}
                required
              />
            </label>

            <label>
              Описание
              <textarea
                name="description"
                value={skillFormData.description}
                onChange={updateSkillField}
              />
            </label>

            {skillFormError && <p className="form-message form-message--error">{skillFormError}</p>}
            {skillFormStatus && <p className="form-message">{skillFormStatus}</p>}

            <button type="submit" disabled={isCreatingSkill}>
              {isCreatingSkill ? "Сохраняем..." : "Добавить навык"}
            </button>
          </form>
        </div>

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
            <div>
              <dt>Навыков в справочнике</dt>
              <dd>{skills.length}</dd>
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
            <TaskCard key={task.id} onOpenDetail={setSelectedTask} task={task} />
          ))}
        </section>
      </section>

      <TaskDetailModal
        isOpen={Boolean(selectedTask)}
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdated={loadManagerData}
      />
    </>
  );
}
