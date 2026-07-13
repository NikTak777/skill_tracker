import { useEffect, useState } from "react";

import { createComment, getComments } from "../api.js";
import LoadingSpinner from "./LoadingSpinner.jsx";


function getList(data) {
  if (Array.isArray(data)) {
    return data;
  }

  return data?.results || data?.comments || [];
}

function getAuthorName(author) {
  if (!author) {
    return "Неизвестный автор";
  }

  if (typeof author === "string") {
    return author;
  }

  const fullName = [author.first_name, author.last_name].filter(Boolean).join(" ");
  return fullName || author.username || "Неизвестный автор";
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

  if (data.text) {
    return Array.isArray(data.text) ? data.text.join(" ") : data.text;
  }

  return "Не удалось сохранить комментарий.";
}

export default function CommentSection({ onChanged, taskId }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [loadStatus, setLoadStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadComments() {
    setLoadStatus("loading");
    setErrorMessage("");

    try {
      const data = await getComments(taskId);
      setComments(getList(data));
      setLoadStatus("success");
    } catch {
      setComments([]);
      setLoadStatus("error");
    }
  }

  useEffect(() => {
    if (taskId) {
      loadComments();
    }
  }, [taskId]);

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");
    setStatusMessage("");
    setIsSubmitting(true);

    try {
      await createComment({
        task: taskId,
        text: text.trim(),
      });

      setText("");
      setStatusMessage("Комментарий добавлен.");
      await loadComments();
      onChanged?.();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="comment-section" aria-label="Комментарии к задаче">
      <div className="section-heading">
        <p className="label">Обсуждение</p>
        <h3>Комментарии</h3>
      </div>

      {loadStatus === "loading" && <LoadingSpinner label="Загружаем комментарии..." />}
      {loadStatus === "error" && (
        <p className="form-message form-message--error">Не удалось загрузить комментарии.</p>
      )}

      <ul className="comment-list">
        {comments.length === 0 && loadStatus === "success" && (
          <li className="empty-state">Комментариев пока нет.</li>
        )}
        {comments.map((comment) => (
          <li className="comment-item" key={comment.id}>
            <div className="comment-item__meta">
              <strong>{getAuthorName(comment.author)}</strong>
              <span>{formatDate(comment.created_at)}</span>
            </div>
            <p>{comment.text}</p>
          </li>
        ))}
      </ul>

      <form className="comment-form" onSubmit={handleSubmit}>
        <label>
          Новый комментарий
          <textarea
            placeholder="Опишите прогресс, вопрос или результат"
            required
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
        </label>

        {errorMessage && <p className="form-message form-message--error">{errorMessage}</p>}
        {statusMessage && <p className="form-message">{statusMessage}</p>}

        <button disabled={isSubmitting} type="submit">
          {isSubmitting ? "Отправляем..." : "Добавить комментарий"}
        </button>
      </form>
    </section>
  );
}
