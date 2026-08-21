import { AppError, ErrorCode } from "@common/errors/AppError";
import { logger } from "@common/utils/logger";
import { ordersRepository } from "../orders/orders.repository";
import { siteAccessService } from "../site-access/site-access.service";
import { tutorialsRepository } from "./tutorials.repository";
import { isPublishedTutorial, stripSectionContent, type TutorialAccess, type TutorialRecord } from "./tutorials.types";
import type { UpdateTutorialListInput } from "./tutorials.validation";

type Actor = { id: string; email?: string; role?: "CUSTOMER" | "ADMIN" };

async function accessFor(actor: Actor | undefined, tutorial: TutorialRecord): Promise<TutorialAccess> {
  if (tutorial.free) {
    return { purchased: false, canReadSections: true };
  }
  if (actor?.role === "ADMIN") {
    return { purchased: false, canReadSections: true };
  }
  if (!actor?.id) {
    return { purchased: false, canReadSections: false };
  }

  const purchased = Boolean(await ordersRepository.findPurchasedItem(actor.id, "tutorial", tutorial.slug));
  return { purchased, canReadSections: purchased };
}

function forCatalog(tutorial: TutorialRecord, actor?: Actor) {
  if (actor?.role === "ADMIN" || tutorial.free) {
    return tutorial;
  }
  return stripSectionContent(tutorial);
}

export const tutorialsService = {
  async list(actor?: Actor) {
    if (!(await siteAccessService.isOpen("tutorials", actor))) {
      return [];
    }
    const tutorials = await tutorialsRepository.list();
    if (actor?.role === "ADMIN") {
      return tutorials;
    }
    return tutorials.filter(isPublishedTutorial).map((tutorial) => forCatalog(tutorial, actor));
  },

  async getBySlug(slug: string, actor?: Actor) {
    const payload = await tutorialsRepository.getBySlug(slug, { includeUnpublished: actor?.role === "ADMIN" });
    const access = await accessFor(actor, payload.tutorial);
    if (!(await siteAccessService.isOpen("tutorials", actor)) && !access.purchased) {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Tutorial not found", 404);
    }
    return {
      tutorial: access.canReadSections ? payload.tutorial : stripSectionContent(payload.tutorial),
      related:
        actor?.role === "ADMIN" ? payload.related : payload.related.map(stripSectionContent),
      access,
    };
  },

  async replaceAll(input: UpdateTutorialListInput, actor: { id: string; email: string }) {
    const tutorials = await tutorialsRepository.replaceAll(input);

    logger.info("tutorials.updated", {
      actorId: actor.id,
      actorEmail: actor.email,
      count: tutorials.length,
    });

    return tutorials;
  },
};
