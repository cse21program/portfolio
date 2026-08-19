export const contactStatuses = ["new", "read", "contacted", "converted", "closed", "spam"] as const;

export type ContactStatus = (typeof contactStatuses)[number];

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  subject: string;
  serviceSlug: string;
  serviceTitle: string;
  budget: string;
  message: string;
  attachmentUrl: string | null;
  status: ContactStatus;
  adminNote: string;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
  readAt: string | null;
};

export function contactStatusLabel(status: string) {
  switch (status) {
    case "new":
      return "New";
    case "read":
      return "Read";
    case "contacted":
      return "Contacted";
    case "converted":
      return "Converted";
    case "closed":
      return "Closed";
    case "spam":
      return "Spam";
    default:
      return status;
  }
}

export function isOpenContactStatus(status: string) {
  return status === "new" || status === "read" || status === "contacted";
}
