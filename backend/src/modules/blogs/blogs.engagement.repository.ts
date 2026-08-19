import { prisma } from "@common/database/prisma";
import { AppError, ErrorCode } from "@common/errors/AppError";
import { blogsRepository } from "./blogs.repository";
import { isPublishedBlog } from "./blogs.types";
import type { CommentBodyInput } from "./blogs.engagement.validation";

function toComment(row: {
  id: string;
  slug: string;
  body: string;
  createdAt: Date;
  user: { id: string; name: string | null; email: string };
}) {
  return {
    id: row.id,
    slug: row.slug,
    body: row.body,
    author: row.user.name?.trim() || "Reader",
    userId: row.user.id,
    createdAt: row.createdAt.toISOString(),
  };
}

async function publishedSlug(slug: string) {
  const blogs = await blogsRepository.list();
  const blog = blogs.find((item) => item.slug === slug && isPublishedBlog(item));
  if (!blog) {
    throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Blog post not found", 404);
  }
  return blog;
}

export const blogsEngagementRepository = {
  async get(slug: string, userId?: string) {
    await publishedSlug(slug);
    const [comments, likeCount, liked, bookmarked] = await Promise.all([
      prisma.blogComment.findMany({
        where: { slug },
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "asc" },
      }),
      prisma.blogLike.count({ where: { slug } }),
      userId
        ? prisma.blogLike.findUnique({ where: { slug_userId: { slug, userId } } }).then(Boolean)
        : Promise.resolve(false),
      userId
        ? prisma.blogBookmark.findUnique({ where: { slug_userId: { slug, userId } } }).then(Boolean)
        : Promise.resolve(false),
    ]);

    return {
      comments: comments.map(toComment),
      likeCount,
      liked,
      bookmarked,
    };
  },

  async addComment(slug: string, userId: string, input: CommentBodyInput) {
    await publishedSlug(slug);
    const row = await prisma.blogComment.create({
      data: { slug, userId, body: input.body },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    return toComment(row);
  },

  async deleteComment(id: string, actor: { id: string; role: string }) {
    const row = await prisma.blogComment.findUnique({ where: { id } });
    if (!row) {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Comment not found", 404);
    }
    if (row.userId !== actor.id && actor.role !== "ADMIN") {
      throw new AppError(ErrorCode.FORBIDDEN, "You can only remove your own comment", 403);
    }
    await prisma.blogComment.delete({ where: { id } });
  },

  async toggleLike(slug: string, userId: string) {
    await publishedSlug(slug);
    const existing = await prisma.blogLike.findUnique({
      where: { slug_userId: { slug, userId } },
    });
    if (existing) {
      await prisma.blogLike.delete({ where: { id: existing.id } });
    } else {
      await prisma.blogLike.create({ data: { slug, userId } });
    }
    const likeCount = await prisma.blogLike.count({ where: { slug } });
    return { liked: !existing, likeCount };
  },

  async toggleBookmark(slug: string, userId: string) {
    await publishedSlug(slug);
    const existing = await prisma.blogBookmark.findUnique({
      where: { slug_userId: { slug, userId } },
    });
    if (existing) {
      await prisma.blogBookmark.delete({ where: { id: existing.id } });
    } else {
      await prisma.blogBookmark.create({ data: { slug, userId } });
    }
    return { bookmarked: !existing };
  },

  async listBookmarks(userId: string) {
    const rows = await prisma.blogBookmark.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    const blogs = await blogsRepository.list();
    const published = new Map(
      blogs.filter(isPublishedBlog).map((item) => [item.slug, item] as const),
    );
    return rows
      .map((row) => published.get(row.slug))
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
  },

  async listComments() {
    const rows = await prisma.blogComment.findMany({
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
    const blogs = await blogsRepository.list();
    const titles = new Map(blogs.map((item) => [item.slug, item.title] as const));
    return rows.map((row) => ({
      ...toComment(row),
      title: titles.get(row.slug) ?? row.slug,
    }));
  },
};
