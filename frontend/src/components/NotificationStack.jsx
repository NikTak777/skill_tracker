import { createPortal } from "react-dom";

import { useNotifications } from "../context/NotificationContext.jsx";


export const OPEN_TASK_EVENT = "notifications:open-task";

export function dispatchOpenTask(taskId) {
  if (!taskId) {
    return;
  }

  window.dispatchEvent(new CustomEvent(OPEN_TASK_EVENT, {
    detail: { taskId: Number(taskId) },
  }));
}

export default function NotificationStack() {
  const { notifications, removeNotification } = useNotifications();

  if (notifications.length === 0) {
    return null;
  }

  function handleOpen(notification) {
    if (notification.taskId) {
      dispatchOpenTask(notification.taskId);
    }

    removeNotification(notification.id);
  }

  function handleClose(event, notificationId) {
    event.stopPropagation();
    removeNotification(notificationId);
  }

  return createPortal(
    <div
      aria-label="Уведомления"
      aria-live="polite"
      className="notification-stack"
      role="region"
    >
      {notifications.map((notification) => (
        <article
          className={`notification-toast${notification.taskId ? " notification-toast--clickable" : ""}`}
          key={notification.id}
          role={notification.taskId ? "button" : undefined}
          tabIndex={notification.taskId ? 0 : undefined}
          onClick={notification.taskId ? () => handleOpen(notification) : undefined}
          onKeyDown={notification.taskId ? (event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              handleOpen(notification);
            }
          } : undefined}
        >
          <div className="notification-toast__content">
            <p className="notification-toast__title">{notification.title}</p>
            <p className="notification-toast__message">{notification.message}</p>
            {notification.taskId && (
              <span className="notification-toast__link">Открыть задачу</span>
            )}
          </div>
          <button
            aria-label="Закрыть уведомление"
            className="notification-toast__close"
            type="button"
            onClick={(event) => handleClose(event, notification.id)}
          >
            ×
          </button>
        </article>
      ))}
    </div>,
    document.body,
  );
}
