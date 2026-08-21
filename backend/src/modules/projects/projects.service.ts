import { logger } from "@common/utils/logger";
import { AppError, ErrorCode } from "@common/errors/AppError";
import { projectsRepository } from "./projects.repository";
import { siteAccessService } from "../site-access/site-access.service";
import type { UpdateProjectListInput } from "./projects.validation";

type Actor = { id?: string; email?: string; role?: "CUSTOMER" | "ADMIN" };

export const projectsService = {
  async list(actor?: Actor) {
    if (!(await siteAccessService.isOpen("projects", actor))) {
      return [];
    }
    const projects = await projectsRepository.list();
    if (actor?.role === "ADMIN") {
      return projects;
    }
    return projects.filter((item) => item.published !== false);
  },

  async getBySlug(slug: string, actor?: Actor) {
    await siteAccessService.assertOpen("projects", actor);
    const payload = await projectsRepository.getBySlug(slug);
    if (payload.project.published === false && actor?.role !== "ADMIN") {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Project not found", 404);
    }
    return {
      project: payload.project,
      related: payload.related.filter((item) => item.published !== false),
    };
  },

  async replaceAll(input: UpdateProjectListInput, actor: { id: string; email: string }) {
    const projects = await projectsRepository.replaceAll(input);

    logger.info("projects.updated", {
      actorId: actor.id,
      actorEmail: actor.email,
      count: projects.length,
    });

    return projects;
  },
};
