import { logger } from "@common/utils/logger";
import { projectsRepository } from "./projects.repository";
import type { UpdateProjectListInput } from "./projects.validation";

export const projectsService = {
  list() {
    return projectsRepository.list();
  },

  getBySlug(slug: string) {
    return projectsRepository.getBySlug(slug);
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
