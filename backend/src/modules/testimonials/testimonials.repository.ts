import { prisma } from "@common/database/prisma";
import { publicAuthorName } from "../reviews/reviews.types";
import {
  defaultTestimonials,
  emptyToNull,
  type TestimonialRecord,
  type TestimonialSource,
} from "./testimonials.types";
import type { TestimonialItemInput, UpdateTestimonialListInput } from "./testimonials.validation";

type TestimonialRow = {
  id: string;
  name: string;
  position: string;
  company: string;
  imageUrl: string | null;
  comment: string;
  rating: number;
  featured: boolean;
  sortOrder: number;
  reviewId: string | null;
};

function toRecord(row: TestimonialRow): TestimonialRecord {
  return {
    id: row.id,
    name: row.name,
    position: row.position,
    company: row.company,
    imageUrl: row.imageUrl,
    comment: row.comment,
    rating: row.rating,
    featured: row.featured,
    sortOrder: row.sortOrder,
    reviewId: row.reviewId,
  };
}

function toCreateData(item: TestimonialItemInput, index: number) {
  return {
    ...(item.id ? { id: item.id } : {}),
    name: item.name,
    position: item.position,
    company: item.company,
    imageUrl: emptyToNull(item.imageUrl),
    comment: item.comment,
    rating: item.rating,
    featured: item.featured,
    reviewId: emptyToNull(item.reviewId),
    sortOrder: item.sortOrder ?? index,
  };
}

export const testimonialsRepository = {
  async list(): Promise<TestimonialRecord[]> {
    const rows = await prisma.testimonial.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    if (rows.length > 0) {
      return rows.map(toRecord);
    }

    await prisma.testimonial.createMany({
      data: defaultTestimonials.map((item, index) =>
        toCreateData(
          {
            name: item.name,
            position: item.position,
            company: item.company,
            imageUrl: item.imageUrl,
            comment: item.comment,
            rating: item.rating,
            featured: item.featured,
          },
          index,
        ),
      ),
    });

    const seeded = await prisma.testimonial.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
    return seeded.map(toRecord);
  },

  async replaceAll(input: UpdateTestimonialListInput): Promise<TestimonialRecord[]> {
    await prisma.$transaction(async (tx) => {
      await tx.testimonial.deleteMany();
      if (input.testimonials.length === 0) {
        return;
      }
      await tx.testimonial.createMany({
        data: input.testimonials.map((item, index) => toCreateData(item, index)),
      });
    });

    const rows = await prisma.testimonial.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
    return rows.map(toRecord);
  },

  async findByReviewId(reviewId: string): Promise<TestimonialRecord | null> {
    const row = await prisma.testimonial.findUnique({ where: { reviewId } });
    return row ? toRecord(row) : null;
  },

  async createFromReview(input: {
    reviewId: string;
    name: string;
    company: string;
    comment: string;
    rating: number;
  }): Promise<TestimonialRecord> {
    const last = await prisma.testimonial.findFirst({
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    const row = await prisma.testimonial.create({
      data: {
        name: input.name,
        position: "",
        company: input.company,
        comment: input.comment,
        rating: input.rating,
        featured: false,
        reviewId: input.reviewId,
        sortOrder: (last?.sortOrder ?? -1) + 1,
      },
    });
    return toRecord(row);
  },

  async listUnusedSources(): Promise<TestimonialSource[]> {
    const rows = await prisma.review.findMany({
      where: { status: "approved", testimonial: null },
      include: { user: { select: { name: true } } },
      orderBy: { publishedAt: "desc" },
    });
    return rows.map((row) => ({
      reviewId: row.id,
      name: publicAuthorName(row.user?.name),
      comment: row.comment,
      rating: row.rating,
      title: row.title,
      href: row.href,
      kind: row.kind,
    }));
  },

  async findApprovedReview(id: string) {
    return prisma.review.findFirst({
      where: { id, status: "approved" },
      include: { user: { select: { name: true } } },
    });
  },

  async approvedReviewIds(ids: string[]) {
    if (ids.length === 0) {
      return new Set<string>();
    }
    const rows = await prisma.review.findMany({
      where: { id: { in: ids }, status: "approved" },
      select: { id: true },
    });
    return new Set(rows.map((row) => row.id));
  },
};
