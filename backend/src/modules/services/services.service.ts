import { AppError, ErrorCode } from "@common/errors/AppError";
import { logger } from "@common/utils/logger";
import { isPublishedService } from "./services.types";
import { servicesRepository } from "./services.repository";
import type { UpdateServiceListInput } from "./services.validation";

type Actor = { id: string; email?: string; role?: "CUSTOMER" | "ADMIN" };

export const servicesService = {
  async list(actor?: Actor) {
    const services = await servicesRepository.list();
    if (actor?.role === "ADMIN") {
      return services;
    }
    return services.filter(isPublishedService);
  },

  async getBySlug(slug: string, actor?: Actor) {
    const payload = await servicesRepository.getBySlug(slug);
    if (!isPublishedService(payload.service) && actor?.role !== "ADMIN") {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Service not found", 404);
    }
    return {
      service: payload.service,
      related: payload.related.filter(isPublishedService),
    };
  },

  async replaceAll(input: UpdateServiceListInput, actor: { id: string; email: string }) {
    const services = await servicesRepository.replaceAll(input);
    logger.info("services.updated", {
      actorId: actor.id,
      actorEmail: actor.email,
      count: services.length,
    });
    return services;
  },
};
