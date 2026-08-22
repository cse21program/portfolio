import { logger } from "@common/utils/logger";
import { prisma } from "@common/database/prisma";
import { newlyLiveItems, notifyStudioPublish } from "../follows/follows.fanout";
import { siteAccessService } from "../site-access/site-access.service";
import { isPublishedBlog } from "./blogs.types";
import { blogsRepository } from "./blogs.repository";
import type { UpdateBlogListInput } from "./blogs.validation";

type Actor = { id?: string; email?: string; role?: "CUSTOMER" | "ADMIN" };

export const blogsService = {
  async list(actor?: Actor) {
    if (!(await siteAccessService.isOpen("blogs", actor))) {
      return [];
    }
    const blogs = await blogsRepository.list();
    const likes = await prisma.blogLike.groupBy({
      by: ["slug"],
      _count: { _all: true },
    });
    const counts = new Map(likes.map((row) => [row.slug, row._count._all]));
    const visible = actor?.role === "ADMIN" ? blogs : blogs.filter(isPublishedBlog);
    return visible.map((blog) => ({ ...blog, likeCount: counts.get(blog.slug) ?? 0 }));
  },

  async getBySlug(slug: string, actor?: Actor) {
    await siteAccessService.assertOpen("blogs", actor);
    return blogsRepository.getBySlug(slug, { includeUnpublished: actor?.role === "ADMIN" });
  },

  async replaceAll(input: UpdateBlogListInput, actor: { id: string; email: string }) {
    const previous = await blogsRepository.listStored();
    const blogs = await blogsRepository.replaceAll(input);
    const published = newlyLiveItems(previous, blogs, isPublishedBlog);

    logger.info("blogs.updated", {
      actorId: actor.id,
      actorEmail: actor.email,
      count: blogs.length,
    });

    await notifyStudioPublish({
      kind: "note",
      items: published.map((item) => ({ title: item.title, slug: item.slug })),
      exceptUserId: actor.id,
    });

    return blogs;
  },
};
