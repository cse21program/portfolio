export const contactStatuses = ["new", "read", "contacted", "converted", "closed", "spam"] as const;

export type ContactStatus = (typeof contactStatuses)[number];

export type ContactMessageRecord = {
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

export function isContactStatus(value: string): value is ContactStatus {
  return (contactStatuses as readonly string[]).includes(value);
}
