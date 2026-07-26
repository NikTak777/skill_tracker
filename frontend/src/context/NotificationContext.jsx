import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import {
  appendInboxItem,
  countUnreadInbox,
  markAllInboxRead,
  markInboxItemRead,
  readInbox,
} from "../utils/notificationInbox.js";
import { useSession } from "./SessionContext.jsx";

const NotificationContext = createContext(null);

const NOTIFICATION_TTL_MS = 15000;

export function NotificationProvider({ children }) {
  const { session } = useSession();
  const [toasts, setToasts] = useState([]);
  const [inbox, setInbox] = useState([]);

  useEffect(() => {
    if (!session.isAuthenticated || !session.username) {
      setInbox([]);
      return;
    }

    setInbox(readInbox(session.username));
  }, [session.isAuthenticated, session.username]);

  const removeNotification = useCallback((id) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const pushNotification = useCallback(({ id, title, message, taskId }) => {
    const notificationId = id || `notification-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const payload = {
      id: notificationId,
      title: title || "Уведомление",
      message: message || "",
      taskId: taskId || null,
      createdAt: new Date().toISOString(),
      read: false,
    };

    if (session.isAuthenticated && session.username) {
      setInbox(appendInboxItem(session.username, payload));
    }

    setToasts((current) => {
      if (current.some((item) => item.id === notificationId)) {
        return current;
      }

      return [{
        id: payload.id,
        title: payload.title,
        message: payload.message,
        taskId: payload.taskId,
      }, ...current];
    });

    window.setTimeout(() => {
      removeNotification(notificationId);
    }, NOTIFICATION_TTL_MS);

    return notificationId;
  }, [removeNotification, session.isAuthenticated, session.username]);

  const markInboxRead = useCallback((itemId) => {
    if (!session.username) {
      return;
    }

    setInbox(markInboxItemRead(session.username, itemId));
  }, [session.username]);

  const markInboxAllRead = useCallback(() => {
    if (!session.username) {
      return;
    }

    setInbox(markAllInboxRead(session.username));
  }, [session.username]);

  const unreadCount = countUnreadInbox(inbox);

  const value = useMemo(
    () => ({
      notifications: toasts,
      inbox,
      unreadCount,
      pushNotification,
      removeNotification,
      markInboxRead,
      markInboxAllRead,
    }),
    [
      toasts,
      inbox,
      unreadCount,
      pushNotification,
      removeNotification,
      markInboxRead,
      markInboxAllRead,
    ],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }

  return context;
}
