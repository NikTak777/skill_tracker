import { useEffect, useRef } from "react";

import { getApiList, getTasks } from "../api.js";
import { useNotifications } from "../context/NotificationContext.jsx";
import { useSession } from "../context/SessionContext.jsx";


const POLL_INTERVAL_MS = 3000;
export const TASKS_REFRESH_EVENT = "tasks:refresh";

function getTaskId(task) {
  return Number(task?.id) || 0;
}

function getSeenStorageKey(username) {
  return `skilltracker_task_seen_${username || "user"}`;
}

function readLastSeenId(username) {
  return Number(sessionStorage.getItem(getSeenStorageKey(username))) || 0;
}

function writeLastSeenId(username, taskId) {
  if (!taskId) {
    return;
  }

  sessionStorage.setItem(getSeenStorageKey(username), String(taskId));
}

export default function NewTaskNotificationPoller() {
  const { authChecked, session } = useSession();
  const { pushNotification } = useNotifications();
  const pushNotificationRef = useRef(pushNotification);

  pushNotificationRef.current = pushNotification;

  const isEmployee = session.role === "employee";

  useEffect(() => {
    if (!authChecked || !session.isAuthenticated || !isEmployee || !session.username) {
      return undefined;
    }

    const username = session.username;
    let cancelled = false;
    let lastSeenId = readLastSeenId(username);
    let baselineReady = lastSeenId > 0;

    function markTaskSeen(taskId) {
      const normalizedId = getTaskId({ id: taskId });
      if (normalizedId > lastSeenId) {
        lastSeenId = normalizedId;
        writeLastSeenId(username, lastSeenId);
      }
    }

    function notifyForTask(task) {
      pushNotificationRef.current({
        id: `task-${task.id}`,
        title: "Новая задача",
        message: `Вам назначена задача «${task.title || "Без названия"}».`,
        taskId: task.id,
      });
      markTaskSeen(task.id);
      window.dispatchEvent(new CustomEvent(TASKS_REFRESH_EVENT));
    }

    async function pollTasks() {
      try {
        const tasks = getApiList(await getTasks());
        if (cancelled) {
          return;
        }

        const sortedTasks = [...tasks].sort(
          (left, right) => getTaskId(left) - getTaskId(right),
        );

        if (!baselineReady) {
          const maxId = sortedTasks.reduce(
            (max, task) => Math.max(max, getTaskId(task)),
            0,
          );
          lastSeenId = maxId;
          writeLastSeenId(username, lastSeenId);
          baselineReady = true;
          return;
        }

        sortedTasks
          .filter((task) => getTaskId(task) > lastSeenId)
          .forEach((task) => {
            notifyForTask(task);
          });
      } catch {
        // Фоновый опрос не должен ломать UI.
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        pollTasks();
      }
    }

    pollTasks();
    const intervalId = window.setInterval(pollTasks, POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [authChecked, isEmployee, session.isAuthenticated, session.username]);

  return null;
}
