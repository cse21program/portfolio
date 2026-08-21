import { logger } from "@common/utils/logger";
import { educationRepository } from "./education.repository";
import { siteAccessService } from "../site-access/site-access.service";
import type { UpdateEducationListInput } from "./education.validation";

export const educationService = {
  async list(actor?: { role?: "CUSTOMER" | "ADMIN" }) {
    if (!(await siteAccessService.isOpen("education", actor))) {
      return [];
    }
    return educationRepository.list();
  },

  async replaceAll(input: UpdateEducationListInput, actor: { id: string; email: string }) {
    const education = await educationRepository.replaceAll(input);

    logger.info("education.updated", {
      actorId: actor.id,
      actorEmail: actor.email,
      count: education.length,
    });

    return education;
  },
};
