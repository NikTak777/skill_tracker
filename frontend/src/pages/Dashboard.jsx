import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import TaskCard from "../components/TaskCard.jsx";
import TaskDetailModal from "../components/TaskDetailModal.jsx";
import { useSession } from "../context/SessionContext.jsx";


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

function TaskGrid({ onOpenDetail, tasks: taskList }) {
  if (taskList.length === 0) {
    return <p className="empty-state">Задач пока нет.</p>;
  }

  return (
    <section className="task-grid" aria-label="Список задач">
      {taskList.map((task) => (
        <TaskCard key={task.id} onOpenDetail={onOpenDetail} task={task} />
      ))}
    </section>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { session } = useSession();
  const [dashboardTasks, setDashboardTasks] = useState([]);
  const [loadStatus, setLoadStatus] = useState("loading");
  const [selectedTask, setSelectedTask] = useState(null);

  async function loadTasks() {
    setLoadStatus("loading");

    try {
      const taskList = await getTasksWithProgress();
      setDashboardTasks(taskList);
      setLoadStatus("success");
    } catch {
      setDashboardTasks([]);
      setLoadStatus("error");
    }
  }

  useEffect(() => {
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

  if (loadStatus === "loading") {
    return <LoadingSpinner label="Загружаем задачи..." />;
  }

  const heroSection = (
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
  );

  const mainContent = (
    <div className="dashboard-main">
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
    </div>
  );

  const managerSidebar = (
    <aside className="dashboard-sidebar" aria-label="Панель управления">
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

      <form className="manager-form" onSubmit={handleEmployeeSubmit} autoComplete="off">
        <h2>Новый сотрудник</h2>

        <label>
          Логин
          <input
            name="username"
            type="text"
            placeholder="Введите логин"
            value={employeeFormData.username}
            onChange={updateEmployeeField}
            autoComplete="off"
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
            autoComplete="new-password"
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
    </aside>
  );

  return (
    <>
      {isManager ? (
        <div className="manager-dashboard">
          {heroSection}

          <section className="summary summary--manager" aria-label="Сводка">
            <article>
              <span>Сотрудников</span>
              <strong>{employees.length || teamMembers.length}</strong>
            </article>
            <div className="summary__main">
              <article>
                <span>Средний прогресс</span>
                <strong>{averageProgress}%</strong>
              </article>
              <article>
                <span>В работе</span>
                <strong>{tasksInProgress}</strong>
              </article>
            </div>
          </section>

          {managerSidebar}
          {mainContent}
        </div>
      ) : (
        <>
          {heroSection}

          <section className="summary" aria-label="Сводка">
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

          <div className="dashboard-layout dashboard-layout--no-sidebar">
            {mainContent}
          </div>
        </>
      )}

      <TaskDetailModal
        canAddProgress={session.role === "employee"}
        isOpen={Boolean(selectedTask)}
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdated={loadTasks}
      />
    </>
  );
}
