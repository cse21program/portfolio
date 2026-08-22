import { AppError, ErrorCode } from "@common/errors/AppError";
import { logger } from "@common/utils/logger";
import { publicAuthorName } from "../reviews/reviews.types";
import { siteAccessService } from "../site-access/site-access.service";
import { testimonialsRepository } from "./testimonials.repository";
import type { FromReviewInput, UpdateTestimonialListInput } from "./testimonials.validation";

type Actor = { id: string; email: string; role?: "CUSTOMER" | "ADMIN" };

function assertAdmin(actor: Actor) {
  if (actor.role !== "ADMIN") {
    throw new AppError(ErrorCode.FORBIDDEN, "You do not have access to this resource", 403);
  }
}

function uniqueReviewIds(ids: Array<string | null | undefined>) {
  const values = ids.filter((value): value is string => Boolean(value));
  return {
    values,
    unique: new Set(values).size === values.length,
  };
}

export const testimonialsService = {
  async list(actor?: { role?: "CUSTOMER" | "ADMIN" }) {
    if (!(await siteAccessService.isOpen("testimonials", actor))) {
      return [];
    }
    return testimonialsRepository.list();
  },

  async getAdmin(actor: Actor) {
    assertAdmin(actor);
    const [testimonials, sources] = await Promise.all([
      testimonialsRepository.list(),
      testimonialsRepository.listUnusedSources(),
    ]);
    return { testimonials, sources };
  },

  async replaceAll(input: UpdateTestimonialListInput, actor: Actor) {
    assertAdmin(actor);
    const { values, unique } = uniqueReviewIds(input.testimonials.map((item) => item.reviewId));
    if (!unique) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "Each review can become only one testimonial", 400);
    }
    const approved = await testimonialsRepository.approvedReviewIds(values);
    if (values.some((id) => !approved.has(id))) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "Only an approved review can be attached", 400);
    }

    const testimonials = await testimonialsRepository.replaceAll(input);
    logger.info("testimonials.updated", {
      actorId: actor.id,
      actorEmail: actor.email,
      count: testimonials.length,
    });
    return testimonials;
  },

  async createFromReview(input: FromReviewInput, actor: Actor) {
    assertAdmin(actor);
    const existing = await testimonialsRepository.findByReviewId(input.reviewId);
    if (existing) {
      return existing;
    }

    const review = await testimonialsRepository.findApprovedReview(input.reviewId);
    if (!review) {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Approved review not found", 404);
    }

    const testimonial = await testimonialsRepository.createFromReview({
      reviewId: review.id,
      name: publicAuthorName(review.user?.name),
      company: review.title,
      comment: review.comment,
      rating: review.rating,
    });
    logger.info("testimonials.from_review", {
      actorId: actor.id,
      actorEmail: actor.email,
      reviewId: review.id,
      testimonialId: testimonial.id,
    });
    return testimonial;
  },
};
