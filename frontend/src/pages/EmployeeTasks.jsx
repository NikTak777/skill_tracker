import { useEffect, useState } from "react";

import { getMe, getTasksWithProgress, updateTask } from "../api.js";
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

function getTaskProgress(task) {
  if (typeof task.progress === "number") {
    return task.progress;
  }

  return 0;
}

export default function EmployeeTasks() {
  const { session } = useSession();
  const [employeeProfile, setEmployeeProfile] = useState({
    username: session.username,
    email: "",
    role: session.role,
  });
  const [employeeTasks, setEmployeeTasks] = useState([]);
  const [loadStatus, setLoadStatus] = useState("loading");
  const [statusError, setStatusError] = useState("");
  const [updatingTaskId, setUpdatingTaskId] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  async function loadEmployeeData() {
    setLoadStatus("loading");
    setStatusError("");

    try {
      const [profile, taskList] = await Promise.all([getMe(), getTasksWithProgress()]);

      setEmployeeProfile({
        username: profile.username || session.username,
        email: profile.email || "",
        role: String(profile.role || session.role || "").toLowerCase(),
      });
      setEmployeeTasks(taskList);
      setLoadStatus("success");
    } catch {
      setEmployeeTasks([]);
      setLoadStatus("error");
    }
  }

  useEffect(() => {
    loadEmployeeData();
  }, [session.role, session.username]);

  async function handleStatusChange(task) {
    const nextStatus = STATUS_NEXT[task.status];
    if (!nextStatus) {
      return;
    }

    setStatusError("");
    setUpdatingTaskId(task.id);

    try {
      await updateTask(task.id, { status: nextStatus });
      await loadEmployeeData();
    } catch (error) {
      const message = error.response?.data?.detail
        || error.response?.data?.status
        || "Не удалось обновить статус задачи.";
      setStatusError(typeof message === "string" ? message : "Не удалось обновить статус задачи.");
    } finally {
      setUpdatingTaskId(null);
    }
  }

  const completedProgress = employeeTasks.length === 0
    ? 0
    : Math.round(
        employeeTasks.reduce((sum, task) => sum + getTaskProgress(task), 0) / employeeTasks.length,
      );

  if (loadStatus === "loading") {
    return <LoadingSpinner label="Загружаем данные сотрудника..." />;
  }

  return (
    <>
      <section className="hero employee-hero">
        <p className="label">Кабинет сотрудника</p>
        <h1>Мои задачи развития</h1>
        <p>
          Страница загружает задачи сотрудника, прогресс, комментарии и позволяет менять статус.
        </p>
        <p className="form-message">
          {loadStatus === "success" && "Данные загружены из /api/auth/me/, /api/tasks/, /api/progress/ и /api/comments/."}
          {loadStatus === "error" && "Не удалось загрузить данные. Проверьте backend и авторизацию."}
        </p>
        {statusError && <p className="form-message form-message--error">{statusError}</p>}
      </section>

      <section className="employee-layout">
        <aside className="employee-panel">
          <p className="label">Профиль</p>
          <h2>{employeeProfile.username || "Сотрудник"}</h2>
          <dl>
            <div>
              <dt>Роль</dt>
              <dd>{ROLE_LABELS[employeeProfile.role] || employeeProfile.role || "Не указана"}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{employeeProfile.email || "Не указан"}</dd>
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

          {employeeTasks.length === 0 && <p className="empty-state">Задач пока нет.</p>}

          <section className="task-grid employee-task-grid" aria-label="Список задач сотрудника">
            {employeeTasks.map((task) => (
              <TaskCard
                actionLabel={STATUS_ACTION_LABELS[task.status]}
                isUpdating={updatingTaskId === task.id}
                key={task.id}
                onOpenDetail={setSelectedTask}
                onStatusChange={handleStatusChange}
                showStatusAction
                task={task}
              />
            ))}
          </section>
        </section>
      </section>

      <TaskDetailModal
        canAddProgress
        isOpen={Boolean(selectedTask)}
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdated={loadEmployeeData}
      />
    </>
  );
}
