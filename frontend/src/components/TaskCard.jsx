import ProgressBar from "./ProgressBar.jsx";


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

function getTaskProgress(task) {
  if (typeof task.progress === "number") {
    return task.progress;
  }

  if (Array.isArray(task.progress_entries) && task.progress_entries.length > 0) {
    return task.progress_entries[0].percent;
  }

  return 0;
}

export default function TaskCard({ task }) {
  const skill = getSkillName(task.skill);
  const employee = getPersonName(task.employee) || task.owner;
  const manager = getPersonName(task.manager);
  const dueDate = task.due_date || task.deadline || "Без срока";
  const progress = getTaskProgress(task);

  return (
    <article className="task-card">
      <div className="task-card__top">
        <span>{skill || "Навык не указан"}</span>
        <span>{task.status}</span>
      </div>
      <h2>{task.title}</h2>
      <p>{task.description}</p>
      <ProgressBar percent={progress} />
      <div className="task-card__meta">
        <span>Сотрудник: {employee || "Не назначен"}</span>
        {manager && <span>Руководитель: {manager}</span>}
        <span>Срок: {dueDate}</span>
      </div>
    </article>
  );
}
