"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import Flashbar, { FlashbarProps } from "@cloudscape-design/components/flashbar";
import {
  publishNotification,
  subscribeToNotifications,
  type AppNotification,
  type NotificationLevel,
} from "@/lib/notification-bus";

interface Notification extends AppNotification {
  readonly id: string;
  readonly dismissible: boolean;
  readonly autoDismiss: boolean;
}

interface NotificationContextValue {
  /** Report a notification directly, for a page that knows more than the API layer. */
  readonly addNotification: (type: NotificationLevel, header: string, content?: string) => void;
  readonly dismissNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

let sequence = 0;

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const addNotification = useCallback(
    (level: NotificationLevel, header: string, detail?: string) => {
      sequence += 1;
      const id = `notification-${Date.now()}-${sequence}`;
      // Success is transient; a failure must stay until acknowledged.
      const autoDismiss = level === "success";

      setNotifications((prev) => [
        ...prev,
        { id, level, header, detail, dismissible: true, autoDismiss },
      ]);

      if (autoDismiss) {
        setTimeout(() => {
          setNotifications((prev) => prev.filter((n) => n.id !== id));
        }, 5000);
      }
    },
    [],
  );

  // The API layer publishes failures here. This is the only automatic producer,
  // and it is why the console reports errors at all.
  useEffect(
    () =>
      subscribeToNotifications((notification) => {
        addNotification(notification.level, notification.header, notification.detail);
      }),
    [addNotification],
  );

  const flashbarItems: FlashbarProps.MessageDefinition[] = notifications.map((notification) => ({
    type: notification.level,
    header: notification.header,
    content: notification.detail,
    dismissible: notification.dismissible,
    /*
        Cloudscape renders the dismiss control with no accessible name unless
        `dismissLabel` is supplied, which fails WCAG 2.1.1 (button-name).
        `statusIconAriaLabel` names the leading status glyph, and errors are
        announced assertively while everything else stays polite.
      */
    dismissLabel: notification.dismissible ? "Dismiss notification" : undefined,
    statusIconAriaLabel: `${notification.level} notification`,
    ariaRole: notification.level === "error" ? "alert" : "status",
    onDismiss: () => dismissNotification(notification.id),
    id: notification.id,
  }));

  return (
    <NotificationContext.Provider value={{ addNotification, dismissNotification }}>
      {/*
        Anchored below the top navigation rather than floating over the content,
        so a notification never covers a control the user is reaching for.
        aria-live announces failures without stealing focus.
      */}
      <div
        className="aws-notification-region"
        role="region"
        aria-label="Console notifications"
        aria-live="polite"
      >
        <Flashbar
          i18nStrings={{
            ariaLabel: "Console notifications",
            successIconAriaLabel: "Success",
            errorIconAriaLabel: "Error",
            warningIconAriaLabel: "Warning",
            infoIconAriaLabel: "Information",
            inProgressIconAriaLabel: "In progress",
          }}
          items={flashbarItems}
        />
      </div>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}

export { publishNotification };
