import { AppError, ErrorCode } from "@common/errors/AppError";
import { env } from "@common/config/env";
import { sendMailSafe } from "@common/mailer/mailer";
import { serviceOrderReceivedEmail, serviceOrderStatusEmail } from "@common/mailer/mailer.templates";
import { notifyInApp } from "../notifications/notify";
import { logger } from "@common/utils/logger";
import { authRepository } from "../auth/auth.repository";
import { isPublishedService } from "../services/services.types";
import { servicesRepository } from "../services/services.repository";
import { serviceOrdersRepository } from "./service-orders.repository";
import {
  openServiceOrderStatuses,
  type ServiceOrderRecord,
  type ServiceOrderServiceSummary,
} from "./service-orders.types";
import type {
  CreateServiceOrderInput,
  GrantServiceOrderInput,
  UpdateServiceOrderInput,
} from "./service-orders.validation";

type Actor = { id: string; email: string; role: "CUSTOMER" | "ADMIN" };

function dashboardUrl() {
  return `${env.FRONTEND_URL.replace(/\/$/, "")}/dashboard/orders`;
}

function serviceSummary(
  service:
    | {
        slug: string;
        title: string;
        startingPrice: string;
        pricingType: string;
        deliveryTime: string;
        available: boolean;
      }
    | undefined,
): ServiceOrderServiceSummary {
  if (!service) {
    return null;
  }
  return {
    slug: service.slug,
    title: service.title,
    startingPrice: service.startingPrice,
    pricingType: service.pricingType,
    deliveryTime: service.deliveryTime,
    available: service.available,
  };
}

async function attachServices(rows: ServiceOrderRecord[]): Promise<ServiceOrderRecord[]> {
  const services = await servicesRepository.list();
  const bySlug = new Map(services.map((item) => [item.slug, item]));
  return rows.map((row) => ({
    ...row,
    service: serviceSummary(bySlug.get(row.serviceSlug)),
  }));
}

async function publishedService(slug: string) {
  const services = await servicesRepository.list();
  return services.find((item) => item.slug === slug && isPublishedService(item)) ?? null;
}

export const serviceOrdersService = {
  async listMine(userId: string) {
    const rows = await serviceOrdersRepository.listForUser(userId);
    return attachServices(rows);
  },

  async listAdmin() {
    const rows = await serviceOrdersRepository.listAll();
    return attachServices(rows);
  },

  async create(input: CreateServiceOrderInput, actor: Actor) {
    const service = await publishedService(input.serviceSlug);
    if (!service) {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Service not found", 404);
    }
    if (!service.available) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "This service is not taking new requests", 400);
    }

    const packageName = input.packageName.trim();
    if (packageName && service.packages.length > 0) {
      const allowed = service.packages.some((item) => item.name === packageName);
      if (!allowed) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, "That package is not on this service", 400);
      }
    }

    const existing = await serviceOrdersRepository.findOpenForUserService(actor.id, service.slug);
    if (existing) {
      const [hydrated] = await attachServices([existing]);
      return { order: hydrated ?? existing, created: false };
    }

    const order = await serviceOrdersRepository.create({
      userId: actor.id,
      serviceSlug: service.slug,
      serviceTitle: service.title,
      packageName,
      requirements: input.requirements,
      budget: input.budget,
      timeline: input.timeline,
      source: "self",
    });

    logger.info("service-orders.created", {
      actorId: actor.id,
      actorEmail: actor.email,
      serviceSlug: service.slug,
      orderId: order.id,
    });

    await sendMailSafe({
      to: actor.email,
      ...serviceOrderReceivedEmail({
        name: order.user?.name ?? "",
        serviceTitle: service.title,
        url: dashboardUrl(),
      }),
    });
    await notifyInApp({
      userId: actor.id,
      type: "SERVICE_ORDER_CREATED",
      title: "Request received",
      body: `I have your request for ${service.title}.`,
      href: "/dashboard/orders",
    });

    const [hydrated] = await attachServices([order]);
    return { order: hydrated ?? order, created: true };
  },

  async cancelMine(id: string, actor: Actor) {
    const existing = await serviceOrdersRepository.findById(id);
    if (!existing || existing.userId !== actor.id) {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Order not found", 404);
    }
    if (existing.status !== "pending") {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "Only a pending request can be cancelled", 400);
    }
    const updated = await serviceOrdersRepository.update(existing.id, {
      status: "cancelled",
      canceledAt: new Date(),
    });
    logger.info("service-orders.cancelled", {
      actorId: actor.id,
      actorEmail: actor.email,
      orderId: existing.id,
    });
    const [hydrated] = await attachServices([updated]);
    return hydrated ?? updated;
  },

  async grant(input: GrantServiceOrderInput, actor: Actor) {
    const service = await publishedService(input.serviceSlug);
    if (!service) {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Service not found", 404);
    }
    const user = await authRepository.findByEmail(input.email);
    if (!user) {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "No account uses that email", 404);
    }

    const existing = await serviceOrdersRepository.findOpenForUserService(user.id, service.slug);
    if (existing) {
      const [hydrated] = await attachServices([existing]);
      return { order: hydrated ?? existing, created: false };
    }

    const order = await serviceOrdersRepository.create({
      userId: user.id,
      serviceSlug: service.slug,
      serviceTitle: service.title,
      packageName: input.packageName,
      requirements: input.requirements.trim() || "Granted from Studio",
      budget: input.budget,
      timeline: input.timeline,
      source: "admin",
      status: "confirmed",
    });

    logger.info("service-orders.granted", {
      actorId: actor.id,
      actorEmail: actor.email,
      userId: user.id,
      serviceSlug: service.slug,
      orderId: order.id,
    });

    if (user.email) {
      await sendMailSafe({
        to: user.email,
        ...serviceOrderStatusEmail({
          name: user.name ?? "",
          serviceTitle: service.title,
          status: "confirmed",
          url: dashboardUrl(),
        }),
      });
      await notifyInApp({
        userId: user.id,
        type: "ORDER_STATUS_CHANGED",
        title: service.title,
        body: "Your request is confirmed. Work can start once we agree the first slice.",
        href: "/dashboard/orders",
      });
    }

    const [hydrated] = await attachServices([order]);
    return { order: hydrated ?? order, created: true };
  },

  async updateAdmin(id: string, input: UpdateServiceOrderInput, actor: Actor) {
    const existing = await serviceOrdersRepository.findById(id);
    if (!existing) {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Order not found", 404);
    }

    const nextStatus = input.status ?? existing.status;
    const updated = await serviceOrdersRepository.update(existing.id, {
      status: nextStatus,
      adminNote: input.adminNote ?? existing.adminNote,
      canceledAt:
        nextStatus === "cancelled"
          ? existing.canceledAt
            ? new Date(existing.canceledAt)
            : new Date()
          : null,
    });

    logger.info("service-orders.updated", {
      actorId: actor.id,
      actorEmail: actor.email,
      orderId: existing.id,
      status: updated.status,
    });

    if (input.status && input.status !== existing.status && existing.user?.email) {
      await sendMailSafe({
        to: existing.user.email,
        ...serviceOrderStatusEmail({
          name: existing.user.name ?? "",
          serviceTitle: existing.serviceTitle,
          status: updated.status,
          url: dashboardUrl(),
        }),
      });
      await notifyInApp({
        userId: existing.userId,
        type: "ORDER_STATUS_CHANGED",
        title: existing.serviceTitle,
        body: `Status is now ${updated.status.replace(/_/g, " ")}.`,
        href: "/dashboard/orders",
      });
    }

    const [hydrated] = await attachServices([updated]);
    return hydrated ?? updated;
  },
};

export { openServiceOrderStatuses };
