import { prisma } from "@common/database/prisma";
import { AppError, ErrorCode } from "@common/errors/AppError";
import { toReviewRecord, toReviewSummary, type ReviewKind, type ReviewRecord, type ReviewStatus } from "./reviews.types";

const userSelect = { id: true, email: true, name: true } as const;

export const reviewsRepository = {
  async listPublic(kind: ReviewKind, slug: string): Promise<{ reviews: ReviewRecord[]; summary: ReturnType<typeof toReviewSummary> }> {
    const rows = await prisma.review.findMany({
      where: { kind, slug, status: "approved" },
      include: { user: { select: userSelect } },
      orderBy: { publishedAt: "desc" },
    });
    return {
      reviews: rows.map((row) => toReviewRecord(row)),
      summary: toReviewSummary(rows.map((row) => row.rating)),
    };
  },

  async listForUser(userId: string): Promise<ReviewRecord[]> {
    const rows = await prisma.review.findMany({
      where: { userId },
      include: { user: { select: userSelect } },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((row) => toReviewRecord(row));
  },

  async listAdmin(): Promise<ReviewRecord[]> {
    const rows = await prisma.review.findMany({
      include: { user: { select: userSelect } },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((row) => toReviewRecord(row, { includeAdmin: true }));
  },

  async findById(id: string): Promise<ReviewRecord | null> {
    const row = await prisma.review.findUnique({
      where: { id },
      include: { user: { select: userSelect } },
    });
    return row ? toReviewRecord(row, { includeAdmin: true }) : null;
  },

  async findForUserProduct(userId: string, kind: string, slug: string): Promise<ReviewRecord | null> {
    const row = await prisma.review.findUnique({
      where: { userId_kind_slug: { userId, kind, slug } },
      include: { user: { select: userSelect } },
    });
    return row ? toReviewRecord(row) : null;
  },

  async create(input: {
    userId: string;
    kind: string;
    slug: string;
    title: string;
    href: string;
    rating: number;
    comment: string;
  }): Promise<ReviewRecord> {
    try {
      const row = await prisma.review.create({
        data: {
          userId: input.userId,
          kind: input.kind,
          slug: input.slug,
          title: input.title,
          href: input.href,
          rating: input.rating,
          comment: input.comment,
          status: "pending",
          verified: true,
        },
        include: { user: { select: userSelect } },
      });
      return toReviewRecord(row);
    } catch (error) {
      const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
      if (code === "P2002") {
        throw new AppError(ErrorCode.CONFLICT, "You already reviewed this", 409);
      }
      throw error;
    }
  },

  async updateMine(
    id: string,
    data: { rating?: number; comment?: string; status: ReviewStatus },
  ): Promise<ReviewRecord> {
    try {
      const row = await prisma.review.update({
        where: { id },
        data: {
          ...(data.rating !== undefined ? { rating: data.rating } : {}),
          ...(data.comment !== undefined ? { comment: data.comment } : {}),
          status: data.status,
          publishedAt: null,
        },
        include: { user: { select: userSelect } },
      });
      return toReviewRecord(row);
    } catch {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Review not found", 404);
    }
  },

  async updateAdmin(
    id: string,
    data: { status?: ReviewStatus; adminNote?: string; publishedAt?: Date | null },
  ): Promise<ReviewRecord> {
    try {
      const row = await prisma.review.update({
        where: { id },
        data: {
          ...(data.status ? { status: data.status } : {}),
          ...(data.adminNote !== undefined ? { adminNote: data.adminNote } : {}),
          ...(data.publishedAt !== undefined ? { publishedAt: data.publishedAt } : {}),
        },
        include: { user: { select: userSelect } },
      });
      return toReviewRecord(row, { includeAdmin: true });
    } catch {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Review not found", 404);
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await prisma.review.delete({ where: { id } });
    } catch {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Review not found", 404);
    }
  },
};
