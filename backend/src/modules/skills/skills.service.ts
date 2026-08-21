import { logger } from "@common/utils/logger";
import { AppError, ErrorCode } from "@common/errors/AppError";
import { skillsRepository } from "./skills.repository";
import { siteAccessService } from "../site-access/site-access.service";
import type { SkillRecord } from "./skills.types";
import type { UpdateSkillListInput } from "./skills.validation";

type Actor = { id?: string; email?: string; role?: "CUSTOMER" | "ADMIN" };

function forPublic(skill: SkillRecord): SkillRecord {
  return {
    ...skill,
    topics: skill.topics.filter((topic) => topic.published !== false),
  };
}

export const skillsService = {
  async list(actor?: Actor) {
    if (!(await siteAccessService.isOpen("skills", actor))) {
      return [];
    }
    const skills = await skillsRepository.list();
    if (actor?.role === "ADMIN") {
      return skills;
    }
    return skills.filter((item) => item.published !== false).map(forPublic);
  },

  async getBySlug(slug: string, actor?: Actor) {
    await siteAccessService.assertOpen("skills", actor);
    const payload = await skillsRepository.getBySlug(slug);
    if (payload.skill.published === false && actor?.role !== "ADMIN") {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Skill not found", 404);
    }
    const skill = actor?.role === "ADMIN" ? payload.skill : forPublic(payload.skill);
    return {
      skill,
      related: payload.related
        .filter((item) => item.published !== false)
        .map((item) => (actor?.role === "ADMIN" ? item : forPublic(item))),
    };
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
