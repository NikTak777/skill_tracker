import { useEffect, useState } from "react";

import { createProgress, getProgress } from "../api.js";
import CommentSection from "./CommentSection.jsx";
import LoadingSpinner from "./LoadingSpinner.jsx";
import ProgressBar from "./ProgressBar.jsx";


const INITIAL_PROGRESS_FORM = {
  percent: "",
  note: "",
};

function getList(data) {
  if (Array.isArray(data)) {
    return data;
  }

  return data?.results || data?.progress || [];
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

function formatDate(value) {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getLatestProgressPercent(entries) {
  if (entries.length === 0) {
    return 0;
  }

  return entries[0].percent || 0;
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

  if (data.percent) {
    return Array.isArray(data.percent) ? data.percent.join(" ") : data.percent;
  }

  return "Не удалось сохранить прогресс.";
}

export default function TaskDetailModal({
  canAddProgress = false,
  isOpen,
  onClose,
  onUpdated,
  task,
}) {
  const [progressEntries, setProgressEntries] = useState([]);
  const [progressForm, setProgressForm] = useState(INITIAL_PROGRESS_FORM);
  const [loadStatus, setLoadStatus] = useState("idle");
  const [formError, setFormError] = useState("");
  const [formStatus, setFormStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadProgress() {
    if (!task?.id) {
      return;
    }

    setLoadStatus("loading");

    try {
      const data = await getProgress(task.id);
      setProgressEntries(getList(data));
      setLoadStatus("success");
    } catch {
      setProgressEntries([]);
      setLoadStatus("error");
    }
  }

  useEffect(() => {
    if (isOpen && task?.id) {
      setProgressForm(INITIAL_PROGRESS_FORM);
      setFormError("");
      setFormStatus("");
      loadProgress();
    }
  }, [isOpen, task?.id]);

  if (!isOpen || !task) {
    return null;
  }

  function updateProgressField(event) {
    const { name, value } = event.target;
    setProgressForm((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  }

  async function handleProgressSubmit(event) {
    event.preventDefault();
    setFormError("");
    setFormStatus("");
    setIsSubmitting(true);

    try {
      await createProgress({
        task: task.id,
        percent: Number(progressForm.percent),
        note: progressForm.note.trim(),
      });

      setProgressForm(INITIAL_PROGRESS_FORM);
      setFormStatus("Прогресс сохранён.");
      await loadProgress();
      onUpdated?.();
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  const latestProgress = getLatestProgressPercent(progressEntries);
  const skill = getSkillName(task.skill);
  const employee = getPersonName(task.employee) || task.owner;
  const manager = getPersonName(task.manager);
  const dueDate = task.due_date || task.deadline || "Без срока";

  return (
    <div className="task-modal" role="dialog" aria-modal="true" aria-labelledby="task-modal-title">
      <button
        aria-label="Закрыть окно задачи"
        className="task-modal__backdrop"
        type="button"
        onClick={onClose}
      />
      <div className="task-modal__panel">
        <div className="task-modal__header">
          <div>
            <p className="label">Детали задачи</p>
            <h2 id="task-modal-title">{task.title}</h2>
          </div>
          <button className="task-modal__close" type="button" onClick={onClose}>
            Закрыть
          </button>
        </div>

        <div className="task-modal__meta">
          <span>{skill || "Навык не указан"}</span>
          <span>{task.status}</span>
          <span>Срок: {dueDate}</span>
        </div>

        <p className="task-modal__description">{task.description || "Описание не указано."}</p>

        <div className="task-modal__people">
          <span>Сотрудник: {employee || "Не назначен"}</span>
          {manager && <span>Руководитель: {manager}</span>}
        </div>

        <section className="task-modal__section" aria-label="Прогресс задачи">
          <div className="section-heading">
            <p className="label">Прогресс</p>
            <h3>Текущий результат: {latestProgress}%</h3>
          </div>
          <ProgressBar percent={latestProgress} />

          {loadStatus === "loading" && <LoadingSpinner label="Загружаем историю прогресса..." />}
          {loadStatus === "error" && (
            <p className="form-message form-message--error">Не удалось загрузить историю прогресса.</p>
          )}

          {progressEntries.length > 0 && (
            <ul className="progress-history">
              {progressEntries.map((entry) => (
                <li className="progress-history__item" key={entry.id}>
                  <div>
                    <strong>{entry.percent}%</strong>
                    <span>{formatDate(entry.created_at)}</span>
                  </div>
                  {entry.note && <p>{entry.note}</p>}
                </li>
              ))}
            </ul>
          )}

          {canAddProgress && (
            <form className="progress-form" onSubmit={handleProgressSubmit}>
              <label>
                Процент выполнения
                <input
                  max="100"
                  min="0"
                  name="percent"
                  required
                  type="number"
                  value={progressForm.percent}
                  onChange={updateProgressField}
                />
              </label>

              <label>
                Комментарий к прогрессу
                <textarea
                  name="note"
                  placeholder="Что уже сделано по задаче"
                  value={progressForm.note}
                  onChange={updateProgressField}
                />
              </label>

              {formError && <p className="form-message form-message--error">{formError}</p>}
              {formStatus && <p className="form-message">{formStatus}</p>}

              <button disabled={isSubmitting} type="submit">
                {isSubmitting ? "Сохраняем..." : "Добавить прогресс"}
              </button>
            </form>
          )}
        </section>

        <CommentSection taskId={task.id} />
      </div>
    </div>
  );
}
