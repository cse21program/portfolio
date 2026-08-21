import { AppError, ErrorCode } from "@common/errors/AppError";
import { logger } from "@common/utils/logger";
import { siteAccessRepository } from "./site-access.repository";
import { normalizePublicCatalogs, type PublicCatalogKey } from "./site-access.types";
import type { UpdateSiteAccessInput } from "./site-access.validation";

type Actor = { id?: string; email?: string; role?: "CUSTOMER" | "ADMIN" };

let cache: { catalogs: ReturnType<typeof normalizePublicCatalogs>; at: number } | null = null;
const CACHE_MS = 4_000;

async function readCatalogs() {
  if (cache && Date.now() - cache.at < CACHE_MS) {
    return cache.catalogs;
  }
  const catalogs = await siteAccessRepository.read();
  cache = { catalogs, at: Date.now() };
  return catalogs;
}

export const siteAccessService = {
  async get() {
    return readCatalogs();
  },

  clearCache() {
    cache = null;
  },

  async isOpen(key: PublicCatalogKey, actor?: Actor) {
    if (actor?.role === "ADMIN") {
      return true;
    }
    const catalogs = await readCatalogs();
    return catalogs[key] !== false;
  },

  async assertOpen(key: PublicCatalogKey, actor?: Actor) {
    if (await this.isOpen(key, actor)) {
      return;
    }
    throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Not found", 404);
  },

  async replaceAll(input: UpdateSiteAccessInput, actor: { id: string; email: string }) {
    const catalogs = normalizePublicCatalogs(input.catalogs);
    const saved = await siteAccessRepository.save(catalogs);
    cache = { catalogs: saved, at: Date.now() };
    logger.info("site-access.updated", {
      actorId: actor.id,
      actorEmail: actor.email,
      catalogs: saved,
    });
    return saved;
  },
};
