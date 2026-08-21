import { logger } from "@common/utils/logger";
import { topicsRepository } from "./topics.repository";
import { siteAccessService } from "../site-access/site-access.service";
import type { UpdateTopicListInput } from "./topics.validation";

type Actor = { id?: string; email?: string; role?: "CUSTOMER" | "ADMIN" };

export const topicsService = {
  async list(actor?: Actor) {
    if (!(await siteAccessService.isOpen("skills", actor))) {
      return [];
    }
    const topics = await topicsRepository.list();
    if (actor?.role === "ADMIN") {
      return topics;
    }
    return topics.filter((item) => item.published !== false);
  },

  async getBySlug(skillSlug: string, topicSlug: string, actor?: Actor) {
    await siteAccessService.assertOpen("skills", actor);
    return topicsRepository.getBySlug(skillSlug, topicSlug, {
      includeUnpublished: actor?.role === "ADMIN",
    });
  },

  async getByUniqueSlug(topicSlug: string, actor?: Actor) {
    await siteAccessService.assertOpen("skills", actor);
    return topicsRepository.getByUniqueSlug(topicSlug, {
      includeUnpublished: actor?.role === "ADMIN",
    });
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
