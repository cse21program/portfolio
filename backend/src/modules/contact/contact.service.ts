import { env } from "@common/config/env";
import { AppError, ErrorCode } from "@common/errors/AppError";
import { sendMailSafe } from "@common/mailer/mailer";
import { contactConfirmationEmail, contactOwnerEmail } from "@common/mailer/mailer.templates";
import { notifyAdmins, notifyInApp } from "../notifications/notify";
import { logger } from "@common/utils/logger";
import { persistUploadedFile } from "@modules/media/media.files";
import { publicFileUrl } from "@modules/media/media.storage";
import { isPublishedService } from "@modules/services/services.types";
import { servicesRepository } from "@modules/services/services.repository";
import { contactRepository } from "./contact.repository";
import type { ContactStatus } from "./contact.types";
import type { CreateContactInput, UpdateContactInput } from "./contact.validation";

type Actor = { id: string; email: string; role: "CUSTOMER" | "ADMIN" } | undefined;

function siteUrl(path: string) {
  return `${env.FRONTEND_URL.replace(/\/$/, "")}${path}`;
}

function ownerInbox() {
  return env.MAIL_FROM?.trim() || env.ADMIN_BOOTSTRAP_EMAIL?.trim() || "";
}

function sanitizeAttachmentUrl(value: string) {
  const url = value.trim();
  if (!url) {
    return null;
  }
  if (url.startsWith(`${env.API_PREFIX}/media/files/`)) {
    return url;
  }
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      return url;
    }
  } catch {
    /* fall through */
  }
  throw new AppError(ErrorCode.VALIDATION_ERROR, "Attachment must be a file URL", 400);
}

async function resolveService(slug: string) {
  const value = slug.trim().toLowerCase();
  if (!value) {
    return { serviceSlug: "", serviceTitle: "" };
  }
  const services = await servicesRepository.list();
  const service = services.find((item) => item.slug === value && isPublishedService(item));
  if (!service) {
    return { serviceSlug: value, serviceTitle: "" };
  }
  return { serviceSlug: service.slug, serviceTitle: service.title };
}

export const contactService = {
  async create(
    input: CreateContactInput,
    actor: Actor,
    file?: Express.Multer.File,
  ) {
    const service = await resolveService(input.serviceSlug);
    let attachmentUrl = sanitizeAttachmentUrl(input.attachmentUrl ?? "");
    if (file) {
      void persistUploadedFile(file);
      attachmentUrl = publicFileUrl(file.filename);
    }

    const inquiry = await contactRepository.create({
      name: input.name,
      email: input.email,
      phone: input.phone,
      company: input.company,
      subject: input.subject,
      serviceSlug: service.serviceSlug,
      serviceTitle: service.serviceTitle,
      budget: input.budget,
      message: input.message,
      attachmentUrl,
      userId: actor?.id ?? null,
    });

    const confirmation = contactConfirmationEmail({
      name: inquiry.name,
      subject: inquiry.subject,
    });
    await sendMailSafe({ to: inquiry.email, ...confirmation });

    if (actor?.id) {
      await notifyInApp({
        userId: actor.id,
        type: "NEW_MESSAGE",
        title: "Message received",
        body: `Thanks for writing about ${inquiry.subject}. I will read it and reply.`,
        href: "/dashboard",
      });
    }

    const owner = ownerInbox();
    if (owner) {
      const notice = contactOwnerEmail({
        name: inquiry.name,
        email: inquiry.email,
        subject: inquiry.subject,
        serviceTitle: inquiry.serviceTitle,
        url: siteUrl("/admin/leads"),
      });
      await sendMailSafe({ to: owner, ...notice });
    }

    await notifyAdmins({
      type: "NEW_MESSAGE",
      title: "New inquiry",
      body: `${inquiry.name} wrote about ${inquiry.subject}${inquiry.serviceTitle ? ` · ${inquiry.serviceTitle}` : ""}.`,
      href: "/admin/leads",
      exceptUserId: actor?.id,
    });

    logger.info("contact.created", {
      id: inquiry.id,
      email: inquiry.email,
      serviceSlug: inquiry.serviceSlug,
    });

    return inquiry;
  },

  list() {
    return contactRepository.list();
  },

  async getById(id: string) {
    const inquiry = await contactRepository.findById(id);
    if (!inquiry) {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Inquiry not found", 404);
    }
    return inquiry;
  },

  async update(id: string, input: UpdateContactInput) {
    const current = await contactRepository.findById(id);
    if (!current) {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Inquiry not found", 404);
    }

    const nextStatus: ContactStatus | undefined = input.status;
    const data: { status?: ContactStatus; adminNote?: string; readAt?: Date | null } = {};
    if (nextStatus) {
      data.status = nextStatus;
      if (nextStatus === "new") {
        data.readAt = null;
      } else if (!current.readAt) {
        data.readAt = new Date();
      }
    }
    if (input.adminNote !== undefined) {
      data.adminNote = input.adminNote;
    }

    const inquiry = await contactRepository.update(id, data);
    logger.info("contact.updated", { id, status: inquiry.status });
    return inquiry;
  },
};
