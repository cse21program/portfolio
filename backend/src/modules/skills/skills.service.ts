import { logger } from "@common/utils/logger";
import { skillsRepository } from "./skills.repository";
import type { UpdateSkillListInput } from "./skills.validation";

export const skillsService = {
  list() {
    return skillsRepository.list();
  },

  getBySlug(slug: string) {
    return skillsRepository.getBySlug(slug);
  },

  async replaceAll(input: UpdateSkillListInput, actor: { id: string; email: string }) {
    const skills = await skillsRepository.replaceAll(input);

    logger.info("skills.updated", {
      actorId: actor.id,
      actorEmail: actor.email,
      count: skills.length,
      topics: skills.reduce((total, skill) => total + skill.topics.length, 0),
    });

    return skills;
  },
};
