import { logger } from "@common/utils/logger";
import { fieldsRepository } from "./fields.repository";
import type { UpdateFieldListInput } from "./fields.validation";

export const fieldsService = {
  list() {
    return fieldsRepository.list();
  },

  getBySlug(slug: string) {
    return fieldsRepository.getBySlug(slug);
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
