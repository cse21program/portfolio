import { AppError, ErrorCode } from "@common/errors/AppError";
import { logger } from "@common/utils/logger";
import { resumeRepository } from "./resume.repository";
import type { UpdateResumeInput } from "./resume.validation";

export const resumeService = {
  getResume() {
    return resumeRepository.getOrCreate();
  },

  async updateResume(
    input: UpdateResumeInput,
    expectedVersion: number,
    actor: { id: string; email: string },
  ) {
    await resumeRepository.getOrCreate();
    const resume = await resumeRepository.update(input, expectedVersion);

    if (!resume) {
      throw new AppError(
        ErrorCode.PRECONDITION_FAILED,
        "This page was updated elsewhere. Reload and try again.",
        412,
      );
    }

    logger.info("resume.updated", {
      actorId: actor.id,
      actorEmail: actor.email,
      version: resume.version,
      hasPdf: Boolean(resume.pdfUrl),
    });

    return resume;
  },
};
