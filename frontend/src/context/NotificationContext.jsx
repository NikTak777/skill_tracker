import { createContext, useCallback, useContext, useMemo, useState } from "react";

const NotificationContext = createContext(null);

const NOTIFICATION_TTL_MS = 15000;

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const removeNotification = useCallback((id) => {
    setNotifications((current) => current.filter((item) => item.id !== id));
  }, []);

  const pushNotification = useCallback(({ id, title, message, taskId }) => {
    const notificationId = id || `notification-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    setNotifications((current) => {
      if (current.some((item) => item.id === notificationId)) {
        return current;
      }

      return [{
        id: notificationId,
        title,
        message,
        taskId: taskId || null,
      }, ...current];
    });

    window.setTimeout(() => {
      removeNotification(notificationId);
    }, NOTIFICATION_TTL_MS);

    return notificationId;
  }, [removeNotification]);

  const value = useMemo(
    () => ({
      notifications,
      pushNotification,
      removeNotification,
    }),
    [notifications, pushNotification, removeNotification],
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
