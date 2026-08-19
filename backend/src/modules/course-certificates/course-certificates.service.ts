import { AppError, ErrorCode } from "@common/errors/AppError";
import { courseCertificatesRepository } from "./course-certificates.repository";

export const courseCertificatesService = {
  async getByPublicId(publicId: string) {
    const certificate = await courseCertificatesRepository.getByPublicId(publicId);
    if (!certificate) {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Certificate not found", 404);
    }
    return certificate;
  },
};
