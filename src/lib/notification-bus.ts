/**
 * Notification bus.
 *
 * A tiny publish/subscribe seam between the non-React data layer and the React
 * notification surface. `apiFetch` is a plain module with no React dependency and
 * is also imported by non-component code, so it cannot call a context directly.
 * Components subscribe instead.
 *
 * A subscriber that throws is isolated: one broken listener must not stop the
 * others from being told, and must never turn a notification into an error.
 */

export type NotificationLevel = "success" | "error" | "warning" | "info";

export interface AppNotification {
  readonly level: NotificationLevel;
  readonly header: string;
  readonly detail?: string;
}

export type NotificationSubscriber = (notification: AppNotification) => void;

const subscribers = new Set<NotificationSubscriber>();

/** Registers a listener. Returns an unsubscribe function. */
export function subscribeToNotifications(subscriber: NotificationSubscriber): () => void {
  subscribers.add(subscriber);
  return () => {
    subscribers.delete(subscriber);
  };
}

export function publishNotification(notification: AppNotification): void {
  for (const subscriber of [...subscribers]) {
    try {
      subscriber(notification);
    } catch {
      // A failing listener must not break the caller that published.
    }
  }
}

export function notificationSubscriberCount(): number {
  return subscribers.size;
}

/** Test-only: drops every listener. */
export function resetNotificationSubscribers(): void {
  subscribers.clear();
}
