import { logger } from "@common/utils/logger";
import { prisma } from "@common/database/prisma";
import { blogsRepository } from "./blogs.repository";
import type { UpdateBlogListInput } from "./blogs.validation";

export const blogsService = {
  async list() {
    const blogs = await blogsRepository.list();
    const likes = await prisma.blogLike.groupBy({
      by: ["slug"],
      _count: { _all: true },
    });
    const counts = new Map(likes.map((row) => [row.slug, row._count._all]));
    return blogs.map((blog) => ({ ...blog, likeCount: counts.get(blog.slug) ?? 0 }));
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
