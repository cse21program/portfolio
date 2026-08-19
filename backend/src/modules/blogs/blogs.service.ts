import { logger } from "@common/utils/logger";
import { blogsRepository } from "./blogs.repository";
import type { UpdateBlogListInput } from "./blogs.validation";

export const blogsService = {
  list() {
    return blogsRepository.list();
  },

  getBySlug(slug: string) {
    return blogsRepository.getBySlug(slug);
  },

  async replaceAll(input: UpdateBlogListInput, actor: { id: string; email: string }) {
    const blogs = await blogsRepository.replaceAll(input);

    logger.info("blogs.updated", {
      actorId: actor.id,
      actorEmail: actor.email,
      count: blogs.length,
    });

    return blogs;
  },
};
