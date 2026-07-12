import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getTasksWithProgress } from "../api.js";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import TaskCard from "../components/TaskCard.jsx";
import TaskDetailModal from "../components/TaskDetailModal.jsx";
import { useSession } from "../context/SessionContext.jsx";


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

  return (
    <>
      <section className="hero">
        <p className="label">SkillTracker</p>
        <h1>Витрина задач развития</h1>
        <p>Dashboard загружает задачи из backend API для текущего пользователя.</p>
        {loadStatus === "success" && (
          <p className="form-message">Задачи загружены из /api/tasks/ и /api/progress/.</p>
        )}
        {loadStatus === "error" && (
          <p className="form-message form-message--error">
            Не удалось загрузить задачи. Проверьте backend и авторизацию.
          </p>
        )}
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
          <h2>{session.role === "manager" ? "Панель руководителя" : "Панель сотрудника"}</h2>
          <p>
            {session.role === "manager"
              ? "Вы можете перейти к управлению задачами команды."
              : "Вы можете перейти к списку своих задач развития."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(session.role === "manager" ? "/manager" : "/employee")}
        >
          {session.role === "manager" ? "Открыть панель управления" : "Открыть мои задачи"}
        </button>
      </section>

      <TaskGrid onOpenDetail={setSelectedTask} tasks={dashboardTasks} />

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
