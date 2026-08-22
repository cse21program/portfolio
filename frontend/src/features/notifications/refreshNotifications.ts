export const NOTIFICATIONS_REFRESH = "portfolio:notifications-refresh";

export function refreshNotificationBadge() {
  window.dispatchEvent(new Event(NOTIFICATIONS_REFRESH));
}
