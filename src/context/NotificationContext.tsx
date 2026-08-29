"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import Flashbar, { FlashbarProps } from "@cloudscape-design/components/flashbar";

type NotificationType = "success" | "error" | "warning" | "info";

interface Notification {
  id: string;
  type: NotificationType;
  header: string;
  content?: string;
  dismissible: boolean;
  autoDismiss?: boolean;
}

interface NotificationContextValue {
  addNotification: (
    type: NotificationType,
    header: string,
    content?: string
  ) => void;
  dismissNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(
  undefined
);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback(
    (type: NotificationType, header: string, content?: string) => {
      const id = `notification-${Date.now()}-${Math.random()}`;
      const autoDismiss = type === "success";

      setNotifications((prev) => [
        ...prev,
        {
          id,
          type,
          header,
          content,
          dismissible: true,
          autoDismiss,
        },
      ]);

      // Auto-dismiss success notifications after 5 seconds
      if (autoDismiss) {
        setTimeout(() => {
          setNotifications((prev) => prev.filter((n) => n.id !== id));
        }, 5000);
      }
    },
    []
  );

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const flashbarItems: FlashbarProps.MessageDefinition[] = notifications.map(
    (notification) => ({
      type: notification.type,
      header: notification.header,
      content: notification.content,
      dismissible: notification.dismissible,
      onDismiss: () => dismissNotification(notification.id),
      id: notification.id,
    })
  );

  return (
    <NotificationContext.Provider
      value={{ addNotification, dismissNotification }}
    >
      <div style={{ position: "fixed", top: 60, right: 20, zIndex: 1000, maxWidth: 400 }}>
        <Flashbar items={flashbarItems} />
      </div>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
}
