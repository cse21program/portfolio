import { prisma } from "@common/database/prisma";
import { AppError, ErrorCode } from "@common/errors/AppError";
import { isContactStatus, type ContactMessageRecord, type ContactStatus } from "./contact.types";

type ContactRow = {
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
  status: string;
  adminNote: string;
  userId: string | null;
  createdAt: Date;
  updatedAt: Date;
  readAt: Date | null;
};

function toRecord(row: ContactRow): ContactMessageRecord {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    company: row.company,
    subject: row.subject,
    serviceSlug: row.serviceSlug,
    serviceTitle: row.serviceTitle,
    budget: row.budget,
    message: row.message,
    attachmentUrl: row.attachmentUrl,
    status: isContactStatus(row.status) ? row.status : "new",
    adminNote: row.adminNote,
    userId: row.userId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    readAt: row.readAt ? row.readAt.toISOString() : null,
  };
}

export const contactRepository = {
  async create(data: {
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
    userId: string | null;
  }): Promise<ContactMessageRecord> {
    const row = await prisma.contactMessage.create({ data });
    return toRecord(row);
  },

  async list(): Promise<ContactMessageRecord[]> {
    const rows = await prisma.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toRecord);
  },

  async findById(id: string): Promise<ContactMessageRecord | null> {
    const row = await prisma.contactMessage.findUnique({ where: { id } });
    return row ? toRecord(row) : null;
  },

  async update(
    id: string,
    data: { status?: ContactStatus; adminNote?: string; readAt?: Date | null },
  ): Promise<ContactMessageRecord> {
    try {
      const row = await prisma.contactMessage.update({ where: { id }, data });
      return toRecord(row);
    } catch {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Inquiry not found", 404);
    }
  },
};
