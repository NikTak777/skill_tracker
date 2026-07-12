import { useEffect, useState } from "react";

import {
  attachProgressToTasks,
  createEmployee,
  createSkill,
  createTask,
  getEmployees,
  getMe,
  getSkills,
  getTasks,
  getTasksWithProgress,
  updateTask,
} from "../api.js";
import CollapsibleSection from "../components/CollapsibleSection.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import TaskCard from "../components/TaskCard.jsx";
import TaskDetailModal from "../components/TaskDetailModal.jsx";
import { useSession } from "../context/SessionContext.jsx";


const ROLE_LABELS = {
  manager: "Руководитель",
  employee: "Сотрудник",
};

const STATUS_NEXT = {
  todo: "in_progress",
  in_progress: "done",
};

const STATUS_ACTION_LABELS = {
  todo: "Взять в работу",
  in_progress: "Завершить",
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

const INITIAL_EMPLOYEE_FORM = {
  username: "",
  password: "",
};

function getList(data) {
  if (Array.isArray(data)) {
    return data;
  }

  return data?.results || data?.tasks || data?.skills || data?.employees || [];
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

function getEmployeeLabel(employee) {
  return getPersonName(employee) || employee.username;
}

function getApiErrorMessage(error, fallback = "Не удалось выполнить запрос.") {
  const data = error.response?.data;

  if (!data) {
    return fallback;
  }

  if (typeof data === "string") {
    return data;
  }

  if (data.detail) {
    return data.detail;
  }

  if (data.errors) {
    return "Ошибка валидации. Проверьте введённые данные.";
  }

  const fieldErrors = Object.entries(data)
    .map(([field, value]) => `${field}: ${Array.isArray(value) ? value.join(" ") : value}`)
    .join(" ");

  return fieldErrors || fallback;
}

export default function Dashboard() {
  const { session } = useSession();
  const isManager = session.role === "manager";

  const [profile, setProfile] = useState({
    username: session.username,
    role: session.role,
  });
  const [skills, setSkills] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [skillFormData, setSkillFormData] = useState(INITIAL_SKILL_FORM);
  const [employeeFormData, setEmployeeFormData] = useState(INITIAL_EMPLOYEE_FORM);
  const [loadStatus, setLoadStatus] = useState("loading");
  const [formStatus, setFormStatus] = useState("");
  const [formError, setFormError] = useState("");
  const [skillFormStatus, setSkillFormStatus] = useState("");
  const [skillFormError, setSkillFormError] = useState("");
  const [employeeFormStatus, setEmployeeFormStatus] = useState("");
  const [employeeFormError, setEmployeeFormError] = useState("");
  const [statusError, setStatusError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingSkill, setIsCreatingSkill] = useState(false);
  const [isCreatingEmployee, setIsCreatingEmployee] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showSkillForm, setShowSkillForm] = useState(false);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);

  async function loadDashboardData() {
    setLoadStatus("loading");
    setStatusError("");

    try {
      if (isManager) {
        const [profileResult, taskResult, skillResult, employeeResult] = await Promise.allSettled([
          getMe(),
          getTasks(),
          getSkills(),
          getEmployees(),
        ]);

        if (profileResult.status === "fulfilled") {
          const userProfile = profileResult.value;
          setProfile({
            username: userProfile.username || session.username,
            role: String(userProfile.role || session.role || "").toLowerCase(),
          });
        }

        const taskList = taskResult.status === "fulfilled" ? getList(taskResult.value) : [];
        const tasksWithProgress = await attachProgressToTasks(taskList);

        setTasks(tasksWithProgress);
        setSkills(skillResult.status === "fulfilled" ? getList(skillResult.value) : []);
        setEmployees(employeeResult.status === "fulfilled" ? getList(employeeResult.value) : []);

        const hasCriticalError = [profileResult, taskResult, skillResult].some(
          (result) => result.status === "rejected",
        );

        setLoadStatus(hasCriticalError ? "error" : "success");
        return;
      }

      const [userProfile, taskList] = await Promise.all([getMe(), getTasksWithProgress()]);

      setProfile({
        username: userProfile.username || session.username,
        role: String(userProfile.role || session.role || "").toLowerCase(),
      });
      setTasks(taskList);
      setLoadStatus("success");
    } catch {
      setTasks([]);
      setSkills([]);
      setEmployees([]);
      setLoadStatus("error");
    }
  }

  useEffect(() => {
    loadDashboardData();
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

  function updateEmployeeField(event) {
    const { name, value } = event.target;
    setEmployeeFormData((currentData) => ({
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
      await loadDashboardData();
    } catch (error) {
      setSkillFormError(getApiErrorMessage(error, "Не удалось создать навык."));
    } finally {
      setIsCreatingSkill(false);
    }
  }

  async function handleEmployeeSubmit(event) {
    event.preventDefault();
    setEmployeeFormStatus("");
    setEmployeeFormError("");
    setIsCreatingEmployee(true);

    try {
      const createdEmployee = await createEmployee({
        username: employeeFormData.username.trim(),
        password: employeeFormData.password,
      });

      setEmployeeFormData(INITIAL_EMPLOYEE_FORM);
      setEmployeeFormStatus("Сотрудник добавлен.");
      setFormData((currentData) => ({
        ...currentData,
        employee: String(createdEmployee.id),
      }));
      await loadDashboardData();
    } catch (error) {
      setEmployeeFormError(getApiErrorMessage(error, "Не удалось создать сотрудника."));
    } finally {
      setIsCreatingEmployee(false);
    }
  }

  async function handleTaskSubmit(event) {
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
      setFormStatus("Задача создана.");
      await loadDashboardData();
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleStatusChange(task) {
    const nextStatus = STATUS_NEXT[task.status];
    if (!nextStatus) {
      return;
    }

    setStatusError("");
    setUpdatingTaskId(task.id);

    try {
      await updateTask(task.id, { status: nextStatus });
      await loadDashboardData();
    } catch (error) {
      const message = error.response?.data?.detail
        || error.response?.data?.status
        || "Не удалось обновить статус задачи.";
      setStatusError(typeof message === "string" ? message : "Не удалось обновить статус задачи.");
    } finally {
      setUpdatingTaskId(null);
    }
  }

  const averageProgress = tasks.length === 0
    ? 0
    : Math.round(tasks.reduce((sum, task) => sum + getTaskProgress(task), 0) / tasks.length);
  const skillsCount = new Set(
    tasks.map((task) => (typeof task.skill === "string" ? task.skill : task.skill?.name)).filter(Boolean),
  ).size;
  const tasksInProgress = tasks.filter((task) => task.status === "in_progress").length;

  const teamRows = tasks.reduce((rows, task) => {
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

  if (loadStatus === "loading") {
    return <LoadingSpinner label="Загружаем витрину..." />;
  }

  return (
    <>
      <section className={`hero ${isManager ? "manager-hero" : "employee-hero"}`}>
        <h1>Витрина задач развития</h1>
        <p>
          {isManager
            ? "Создавайте задачи, назначайте сотрудников и отслеживайте прогресс команды."
            : "Ваши задачи, прогресс и комментарии."}
        </p>
        {loadStatus === "error" && (
          <p className="form-message form-message--error">
            Не удалось загрузить данные. Попробуйте обновить страницу.
          </p>
        )}
        {statusError && <p className="form-message form-message--error">{statusError}</p>}
      </section>

      <section className="summary" aria-label="Сводка">
        {isManager ? (
          <>
            <article>
              <span>Сотрудников</span>
              <strong>{employees.length || teamMembers.length}</strong>
            </article>
            <article>
              <span>Средний прогресс</span>
              <strong>{averageProgress}%</strong>
            </article>
            <article>
              <span>В работе</span>
              <strong>{tasksInProgress}</strong>
            </article>
          </>
        ) : (
          <>
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
          </>
        )}
      </section>

      <section className="dashboard-toolbar">
        <div className="dashboard-toolbar__actions">
          {isManager && (
            <div className="manager-actions">
            <CollapsibleSection
              buttonLabel="Поставить задачу"
              isOpen={showTaskForm}
              onToggle={() => setShowTaskForm((current) => !current)}
            >
              <form className="manager-form" onSubmit={handleTaskSubmit}>
                <h2>Поставить задачу</h2>

                <label>
                  Название
                  <input name="title" type="text" value={formData.title} onChange={updateField} required />
                </label>

                <label>
                  Описание
                  <textarea name="description" value={formData.description} onChange={updateField} />
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
                  <input name="due_date" type="date" value={formData.due_date} onChange={updateField} />
                </label>

                {employees.length === 0 && (
                  <p className="form-message form-message--error">Сначала добавьте сотрудника.</p>
                )}

                {formError && <p className="form-message form-message--error">{formError}</p>}
                {formStatus && <p className="form-message">{formStatus}</p>}

                <button type="submit" disabled={isSubmitting || employees.length === 0}>
                  {isSubmitting ? "Создаем..." : "Создать задачу"}
                </button>
              </form>
            </CollapsibleSection>

            <CollapsibleSection
              buttonLabel="Добавить навык"
              isOpen={showSkillForm}
              onToggle={() => setShowSkillForm((current) => !current)}
            >
              <form className="manager-form" onSubmit={handleSkillSubmit}>
                <h2>Новый навык</h2>

                <label>
                  Название
                  <input name="name" type="text" value={skillFormData.name} onChange={updateSkillField} required />
                </label>

                <label>
                  Описание
                  <textarea name="description" value={skillFormData.description} onChange={updateSkillField} />
                </label>

                {skillFormError && <p className="form-message form-message--error">{skillFormError}</p>}
                {skillFormStatus && <p className="form-message">{skillFormStatus}</p>}

                <button type="submit" disabled={isCreatingSkill}>
                  {isCreatingSkill ? "Сохраняем..." : "Добавить навык"}
                </button>
              </form>
            </CollapsibleSection>

            <CollapsibleSection
              buttonLabel="Добавить сотрудника"
              isOpen={showEmployeeForm}
              onToggle={() => setShowEmployeeForm((current) => !current)}
            >
              <form className="manager-form" onSubmit={handleEmployeeSubmit}>
                <h2>Новый сотрудник</h2>

                <label>
                  Логин
                  <input
                    name="username"
                    type="text"
                    placeholder="Введите логин"
                    value={employeeFormData.username}
                    onChange={updateEmployeeField}
                    required
                  />
                </label>

                <label>
                  Пароль
                  <input
                    name="password"
                    type="password"
                    placeholder="Минимум 8 символов"
                    value={employeeFormData.password}
                    onChange={updateEmployeeField}
                    required
                    minLength={8}
                  />
                </label>

                {employeeFormError && <p className="form-message form-message--error">{employeeFormError}</p>}
                {employeeFormStatus && <p className="form-message">{employeeFormStatus}</p>}

                <button type="submit" disabled={isCreatingEmployee}>
                  {isCreatingEmployee ? "Сохраняем..." : "Добавить сотрудника"}
                </button>
              </form>
            </CollapsibleSection>
          </div>
          )}

          <div className="dashboard-toolbar__profile">
            <CollapsibleSection
              buttonLabel="Профиль"
              isOpen={showProfile}
              onToggle={() => setShowProfile((current) => !current)}
            >
              <div className={isManager ? "manager-profile employee-panel" : "employee-panel"}>
                <h2>{profile.username || (isManager ? "Руководитель" : "Сотрудник")}</h2>
                <dl className={isManager ? "profile-list" : undefined}>
                  <div>
                    <dt>Роль</dt>
                    <dd>{ROLE_LABELS[profile.role] || profile.role || "Не указана"}</dd>
                  </div>
                  {isManager ? (
                    <>
                      <div>
                        <dt>Задач команды</dt>
                        <dd>{tasks.length}</dd>
                      </div>
                      <div>
                        <dt>Навыков в справочнике</dt>
                        <dd>{skills.length}</dd>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <dt>Активных задач</dt>
                        <dd>{tasks.length}</dd>
                      </div>
                      <div>
                        <dt>Средний прогресс</dt>
                        <dd>{averageProgress}%</dd>
                      </div>
                    </>
                  )}
                </dl>
              </div>
            </CollapsibleSection>
          </div>
        </div>
      </section>

      {isManager && (
        <section className="manager-team">
          <h2>Прогресс сотрудников</h2>
          <div className="employee-list">
            {teamMembers.length === 0 && <p className="empty-state">Сотрудников с задачами пока нет.</p>}
            {teamMembers.map((employee) => (
              <article className="employee-row" key={employee.name}>
                <div>
                  <h3>{employee.name}</h3>
                  <p>{employee.taskCount} задач в работе</p>
                </div>
                <div className="employee-row__stats">
                  <span>{employee.taskCount} задач</span>
                  <span>{employee.progress}%</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="manager-tasks">
        <h2>{isManager ? "Все задачи" : "Назначенные задачи"}</h2>
        {tasks.length === 0 && <p className="empty-state">Задач пока нет.</p>}
        <section className="task-grid" aria-label="Список задач">
          {tasks.map((task) => (
            <TaskCard
              actionLabel={STATUS_ACTION_LABELS[task.status]}
              isUpdating={updatingTaskId === task.id}
              key={task.id}
              onOpenDetail={setSelectedTask}
              onStatusChange={!isManager ? handleStatusChange : undefined}
              showStatusAction={!isManager}
              task={task}
            />
          ))}
        </section>
      </section>

      <TaskDetailModal
        canAddProgress={!isManager}
        isOpen={Boolean(selectedTask)}
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdated={loadDashboardData}
      />
    </>
  );
}
