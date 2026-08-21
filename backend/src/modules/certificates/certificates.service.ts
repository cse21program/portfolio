import { logger } from "@common/utils/logger";
import { isPublishedCertificate } from "./certificates.types";
import { certificatesRepository } from "./certificates.repository";
import { siteAccessService } from "../site-access/site-access.service";
import type { UpdateCertificateListInput } from "./certificates.validation";

type Actor = { id?: string; email?: string; role?: "CUSTOMER" | "ADMIN" };

export const certificatesService = {
  async list(actor?: Actor) {
    if (!(await siteAccessService.isOpen("certificates", actor))) {
      return [];
    }
    const certificates = await certificatesRepository.list();
    if (actor?.role === "ADMIN") {
      return certificates;
    }
    return certificates.filter(isPublishedCertificate);
  },

  async getBySlug(slug: string, actor?: Actor) {
    await siteAccessService.assertOpen("certificates", actor);
    return certificatesRepository.getBySlug(slug, { includeUnpublished: actor?.role === "ADMIN" });
  },

  async replaceAll(input: UpdateCertificateListInput, actor: { id: string; email: string }) {
    const certificates = await certificatesRepository.replaceAll(input);

    logger.info("certificates.updated", {
      actorId: actor.id,
      actorEmail: actor.email,
      count: certificates.length,
    });

    return certificates;
  },
};
