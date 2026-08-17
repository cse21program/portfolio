import { logger } from "@common/utils/logger";
import { educationRepository } from "./education.repository";
import type { UpdateEducationListInput } from "./education.validation";

export const educationService = {
  list() {
    return educationRepository.list();
  },

  async replaceAll(input: UpdateEducationListInput, actor: { id: string; email: string }) {
    const education = await educationRepository.replaceAll(input);

    logger.info("education.updated", {
      actorId: actor.id,
      actorEmail: actor.email,
      count: education.length,
    });

    return education;
  },
};
