import ProgressBar from "./ProgressBar.jsx";
import { getTaskProgress } from "../utils/taskProgress.js";


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

function getSkillName(skill) {
  if (!skill) {
    return "";
  }

  if (typeof skill === "string") {
    return skill;
  }

  return skill.name || "";
}

const STATUS_LABELS = {
  todo: "К выполнению",
  in_progress: "В работе",
  done: "Готова",
};

export default function TaskCard({
  actionLabel,
  isUpdating = false,
  onOpenDetail,
  onStatusChange,
  showStatusAction = false,
  task,
}) {
  const skill = getSkillName(task.skill);
  const employee = getPersonName(task.employee) || task.owner;
  const manager = getPersonName(task.manager);
  const dueDate = task.due_date || task.deadline || "Без срока";
  const progress = getTaskProgress(task);

  return (
    <article className={`task-card${onOpenDetail ? " task-card--interactive" : ""}`}>
      <div className="task-card__top">
        <span className="task-card__badge task-card__badge--skill">
          {skill || "Навык не указан"}
        </span>
        <span className={`task-card__badge task-card__badge--status task-card__badge--status-${task.status}`}>
          {STATUS_LABELS[task.status] || task.status}
        </span>
      </div>
      {onOpenDetail ? (
        <button className="task-card__title-button" type="button" onClick={() => onOpenDetail(task)}>
          <h2>{task.title}</h2>
        </button>
      ) : (
        <h2>{task.title}</h2>
      )}
      <p>{task.description}</p>
      <ProgressBar percent={progress} />
      <div className="task-card__meta">
        <span>Сотрудник: {employee || "Не назначен"}</span>
        {manager && <span>Руководитель: {manager}</span>}
        <span>Срок: {dueDate}</span>
      </div>
      <div className="task-card__actions">
        {showStatusAction && actionLabel && onStatusChange && (
          <button
            className="task-card__action"
            disabled={isUpdating}
            type="button"
            onClick={() => onStatusChange(task)}
          >
            {isUpdating ? "Сохраняем..." : actionLabel}
          </button>
        )}
        {onOpenDetail && (
          <button
            className="task-card__secondary"
            type="button"
            onClick={() => onOpenDetail(task)}
          >
            Подробнее
          </button>
        )}
      </div>
    </article>
  );
}
