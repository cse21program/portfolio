import { env } from "@common/config/env";
import { AppError, ErrorCode } from "@common/errors/AppError";
import { sendMailSafe } from "@common/mailer/mailer";
import { reviewApprovedEmail } from "@common/mailer/mailer.templates";
import { logger } from "@common/utils/logger";
import { ordersRepository } from "@modules/orders/orders.repository";
import { reviewsRepository } from "./reviews.repository";
import type { ReviewKind } from "./reviews.types";
import type { CreateReviewInput, ListPublicReviewsInput, UpdateAdminReviewInput, UpdateReviewInput } from "./reviews.validation";

type Actor = {
  id: string;
  email: string;
  role: "CUSTOMER" | "ADMIN";
};

function productUrl(href: string) {
  const path = href.startsWith("/") ? href : `/${href}`;
  return `${env.FRONTEND_URL.replace(/\/$/, "")}${path}`;
}

export const reviewsService = {
  listPublic(input: ListPublicReviewsInput) {
    return reviewsRepository.listPublic(input.kind, input.slug);
  },

  listMine(userId: string) {
    return reviewsRepository.listForUser(userId);
  },

  listAdmin() {
    return reviewsRepository.listAdmin();
  },

  async listEligible(userId: string) {
    const [purchased, reviews] = await Promise.all([
      ordersRepository.listPurchasedItems(userId),
      reviewsRepository.listForUser(userId),
    ]);
    const reviewed = new Set(reviews.map((item) => `${item.kind}:${item.slug}`));
    return purchased
      .filter((item) => item.kind === "course" || item.kind === "tutorial" || item.kind === "service")
      .filter((item) => !reviewed.has(`${item.kind}:${item.slug}`))
      .map((item) => ({
        kind: item.kind as ReviewKind,
        slug: item.slug,
        title: item.title,
        href: item.href,
      }));
  },

  async create(input: CreateReviewInput, actor: Actor) {
    const purchased = await ordersRepository.findPurchasedItem(actor.id, input.kind, input.slug);
    if (!purchased) {
      throw new AppError(ErrorCode.FORBIDDEN, "Only a verified purchase can be reviewed", 403);
    }
    const review = await reviewsRepository.create({
      userId: actor.id,
      kind: input.kind,
      slug: input.slug,
      title: purchased.title,
      href: purchased.href,
      rating: input.rating,
      comment: input.comment,
    });
    logger.info("reviews.created", {
      actorId: actor.id,
      kind: review.kind,
      slug: review.slug,
      rating: review.rating,
    });
    return review;
  },

  async updateMine(id: string, input: UpdateReviewInput, actor: Actor) {
    const existing = await reviewsRepository.findById(id);
    if (!existing || existing.userId !== actor.id) {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Review not found", 404);
    }
    if (existing.status === "approved") {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "An approved review cannot be edited", 400);
    }
    return reviewsRepository.updateMine(id, {
      rating: input.rating,
      comment: input.comment,
      status: "pending",
    });
  },

  async deleteMine(id: string, actor: Actor) {
    const existing = await reviewsRepository.findById(id);
    if (!existing || existing.userId !== actor.id) {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Review not found", 404);
    }
    if (existing.status === "approved") {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "An approved review cannot be removed", 400);
    }
    await reviewsRepository.delete(id);
  },

  async updateAdmin(id: string, input: UpdateAdminReviewInput, actor: Actor) {
    if (actor.role !== "ADMIN") {
      throw new AppError(ErrorCode.FORBIDDEN, "You do not have access to this resource", 403);
    }
    const existing = await reviewsRepository.findById(id);
    if (!existing) {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Review not found", 404);
    }

    const nextStatus = input.status ?? existing.status;
    const publishedAt =
      input.status === "approved"
        ? existing.publishedAt
          ? new Date(existing.publishedAt)
          : new Date()
        : input.status
          ? null
          : undefined;

    const next = await reviewsRepository.updateAdmin(id, {
      status: input.status,
      adminNote: input.adminNote,
      publishedAt,
    });

    if (input.status === "approved" && existing.status !== "approved") {
      const email = next.user?.email;
      if (email) {
        await sendMailSafe({
          to: email,
          ...reviewApprovedEmail({
            name: next.authorName === "A student" ? "" : next.authorName,
            title: next.title,
            url: productUrl(next.href),
          }),
        });
      }
    }

    logger.info("reviews.admin.updated", {
      actorId: actor.id,
      id: next.id,
      status: nextStatus,
    });
    return next;
  },
};
