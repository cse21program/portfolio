import { logger } from "@common/utils/logger";
import { tutorialsRepository } from "./tutorials.repository";
import type { UpdateTutorialListInput } from "./tutorials.validation";

export const tutorialsService = {
  list() {
    return tutorialsRepository.list();
  },

  getBySlug(slug: string) {
    return tutorialsRepository.getBySlug(slug);
  },

  async replaceAll(input: UpdateTutorialListInput, actor: { id: string; email: string }) {
    const tutorials = await tutorialsRepository.replaceAll(input);

    logger.info("tutorials.updated", {
      actorId: actor.id,
      actorEmail: actor.email,
      count: tutorials.length,
    });

    return tutorials;
  },
};
