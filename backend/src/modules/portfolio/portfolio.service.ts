import { AppError, ErrorCode } from "@common/errors/AppError";
import { logger } from "@common/utils/logger";
import { portfolioRepository } from "./portfolio.repository";
import type { UpdateAboutInput } from "./portfolio.validation";

export const portfolioService = {
  getAbout() {
    return portfolioRepository.getOrCreate();
  },

  async updateAbout(
    input: UpdateAboutInput,
    expectedVersion: number,
    actor: { id: string; email: string },
  ) {
    await portfolioRepository.getOrCreate();
    const profile = await portfolioRepository.update(input, expectedVersion);

    if (!profile) {
      throw new AppError(
        ErrorCode.PRECONDITION_FAILED,
        "This page was updated elsewhere. Reload and try again.",
        412,
      );
    }

    logger.info("about.updated", {
      actorId: actor.id,
      actorEmail: actor.email,
      version: profile.version,
    });

    return profile;
  },

  async updateGallery(
    gallery: UpdateAboutInput["gallery"],
    expectedVersion: number,
    actor: { id: string; email: string },
  ) {
    await portfolioRepository.getOrCreate();
    const profile = await portfolioRepository.updateGallery(gallery, expectedVersion);

    if (!profile) {
      throw new AppError(
        ErrorCode.PRECONDITION_FAILED,
        "This page was updated elsewhere. Reload and try again.",
        412,
      );
    }

    logger.info("about.gallery.updated", {
      actorId: actor.id,
      actorEmail: actor.email,
      version: profile.version,
      privateCount: gallery.filter((photo) => photo.private).length,
    });

    return profile;
  },
};
