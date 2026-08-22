export const notificationTypes = [
  "ACCOUNT_CREATED",
  "EMAIL_VERIFIED",
  "PURCHASE_SUCCESSFUL",
  "PAYMENT_FAILED",
  "COURSE_ENROLLMENT",
  "SERVICE_ORDER_CREATED",
  "ORDER_STATUS_CHANGED",
  "COURSE_COMPLETED",
  "NEW_MESSAGE",
  "PASSWORD_CHANGED",
  "FOLLOW_UPDATE",
] as const;

export type NotificationType = (typeof notificationTypes)[number];

export type AccountNotification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  href: string;
  readAt: string | null;
  createdAt: string;
};

export function notificationKindLabel(type: NotificationType) {
  switch (type) {
    case "COURSE_ENROLLMENT":
    case "COURSE_COMPLETED":
      return "Course";
    case "PURCHASE_SUCCESSFUL":
    case "ORDER_STATUS_CHANGED":
      return "Order";
    case "PAYMENT_FAILED":
      return "Payment";
    case "SERVICE_ORDER_CREATED":
      return "Service";
    case "NEW_MESSAGE":
      return "Message";
    case "FOLLOW_UPDATE":
      return "Studio";
    case "PASSWORD_CHANGED":
      return "Security";
    default:
      return "Account";
  }
}

export function formatNotificationDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short" }).format(date);
}
