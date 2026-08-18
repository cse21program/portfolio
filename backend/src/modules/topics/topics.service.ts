import { logger } from "@common/utils/logger";
import { topicsRepository } from "./topics.repository";
import type { UpdateTopicListInput } from "./topics.validation";

export const topicsService = {
  list() {
    return topicsRepository.list();
  },

  getBySlug(skillSlug: string, topicSlug: string) {
    return topicsRepository.getBySlug(skillSlug, topicSlug);
  },

  getByUniqueSlug(topicSlug: string) {
    return topicsRepository.getByUniqueSlug(topicSlug);
  },

  async replaceAll(input: UpdateTopicListInput, actor: { id: string; email: string }) {
    const topics = await topicsRepository.replaceAll(input);

    logger.info("topics.updated", {
      actorId: actor.id,
      actorEmail: actor.email,
      count: topics.length,
    });

    return topics;
  },
};
