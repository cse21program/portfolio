import { logger } from "@common/utils/logger";
import { experienceRepository } from "./experience.repository";
import type { UpdateExperienceListInput } from "./experience.validation";

export const experienceService = {
  list() {
    return experienceRepository.list();
  },

  async replaceAll(
    input: UpdateExperienceListInput,
    actor: { id: string; email: string },
  ) {
    const experiences = await experienceRepository.replaceAll(input);

    logger.info("experience.updated", {
      actorId: actor.id,
      actorEmail: actor.email,
      count: experiences.length,
    });

    return experiences;
  },
};
