import { prisma } from "@common/database/prisma";
import { AppError, ErrorCode } from "@common/errors/AppError";
import {
  defaultBlogs,
  emptyToNull,
  estimateReadingTime,
  isPublishedBlog,
  relatedBlogs,
  type BlogRecord,
} from "./blogs.types";
import type { BlogItemInput, UpdateBlogListInput } from "./blogs.validation";

type BlogRow = Omit<BlogRecord, "updatedAt"> & { updatedAt: Date };

function toRecord(row: BlogRow): BlogRecord {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    content: row.content,
    featuredImageUrl: row.featuredImageUrl,
    author: row.author,
    category: row.category,
    tags: row.tags,
    skill: row.skill,
    topic: row.topic,
    readingTime: row.readingTime,
    publishedAt: row.publishedAt,
    status: row.status,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    canonicalUrl: row.canonicalUrl,
    sortOrder: row.sortOrder,
    updatedAt: row.updatedAt.toISOString().slice(0, 10),
  };
}

function toCreateData(item: BlogItemInput, index: number) {
  const content = item.content.filter((entry) => entry.trim());
  return {
    ...(item.id ? { id: item.id } : {}),
    title: item.title,
    slug: item.slug,
    excerpt: item.excerpt,
    content,
    featuredImageUrl: emptyToNull(item.featuredImageUrl),
    author: item.author,
    category: item.category,
    tags: item.tags,
    skill: item.skill,
    topic: item.topic,
    readingTime: item.readingTime.trim() || estimateReadingTime(content),
    publishedAt: item.publishedAt,
    status: item.status,
    seoTitle: item.seoTitle,
    seoDescription: item.seoDescription,
    canonicalUrl: item.canonicalUrl,
    sortOrder: item.sortOrder ?? index,
  };
}

export const blogsRepository = {
  async list(): Promise<BlogRecord[]> {
    const rows = await prisma.blog.findMany({
      orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
    });

    if (rows.length > 0) {
      return rows.map(toRecord);
    }

    try {
      await prisma.blog.createMany({
        data: defaultBlogs.map((item, index) =>
          toCreateData(
            {
              title: item.title,
              slug: item.slug,
              excerpt: item.excerpt,
              content: item.content,
              featuredImageUrl: item.featuredImageUrl,
              author: item.author,
              category: item.category,
              tags: item.tags,
              skill: item.skill,
              topic: item.topic,
              readingTime: item.readingTime,
              publishedAt: item.publishedAt,
              status: item.status as BlogItemInput["status"],
              seoTitle: item.seoTitle,
              seoDescription: item.seoDescription,
              canonicalUrl: item.canonicalUrl,
            },
            index,
          ),
        ),
        skipDuplicates: true,
      });
    } catch {
      // Another request may have seeded the same rows.
    }

    const seeded = await prisma.blog.findMany({
      orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
    });
    return seeded.map(toRecord);
  },

  async getBySlug(slug: string) {
    const blogs = await blogsRepository.list();
    const blog = blogs.find((item) => item.slug === slug && isPublishedBlog(item));
    if (!blog) {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Blog post not found", 404);
    }
    return {
      blog,
      related: relatedBlogs(blog, blogs),
    };
  },

  async replaceAll(input: UpdateBlogListInput): Promise<BlogRecord[]> {
    await prisma.$transaction(async (tx) => {
      await tx.blog.deleteMany();
      if (input.blogs.length === 0) {
        return;
      }
      await tx.blog.createMany({
        data: input.blogs.map((item, index) => toCreateData(item, index)),
      });
    });

    const kept = input.blogs.map((item) => item.slug);
    if (kept.length === 0) {
      await prisma.blogComment.deleteMany();
      await prisma.blogLike.deleteMany();
      await prisma.blogBookmark.deleteMany();
    } else {
      await prisma.$transaction([
        prisma.blogComment.deleteMany({ where: { slug: { notIn: kept } } }),
        prisma.blogLike.deleteMany({ where: { slug: { notIn: kept } } }),
        prisma.blogBookmark.deleteMany({ where: { slug: { notIn: kept } } }),
      ]);
    }

    const rows = await prisma.blog.findMany({
      orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
    });
    return rows.map(toRecord);
  },
};
