import { logger } from "@common/utils/logger";
import { AppError, ErrorCode } from "@common/errors/AppError";
import { fieldsRepository } from "./fields.repository";
import { siteAccessService } from "../site-access/site-access.service";
import type { UpdateFieldListInput } from "./fields.validation";

type Actor = { id?: string; email?: string; role?: "CUSTOMER" | "ADMIN" };

export const fieldsService = {
  async list(actor?: Actor) {
    if (!(await siteAccessService.isOpen("skills", actor))) {
      return [];
    }
    const fields = await fieldsRepository.list();
    if (actor?.role === "ADMIN") {
      return fields;
    }
    return fields.filter((item) => item.published !== false);
  },

  async getBySlug(slug: string, actor?: Actor) {
    await siteAccessService.assertOpen("skills", actor);
    const payload = await fieldsRepository.getBySlug(slug);
    if (payload.field.published === false && actor?.role !== "ADMIN") {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Field not found", 404);
    }
    return payload;
  },

  async replaceAll(input: UpdateFieldListInput, actor: { id: string; email: string }) {
    const fields = await fieldsRepository.replaceAll(input);

    logger.info("fields.updated", {
      actorId: actor.id,
      actorEmail: actor.email,
      count: fields.length,
    });

    return fields;
  },
};
