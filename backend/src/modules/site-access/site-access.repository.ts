import { prisma } from "@common/database/prisma";
import type { Prisma } from "../../generated/prisma/client";
import { defaultPublicCatalogs, normalizePublicCatalogs, type PublicCatalogs } from "./site-access.types";

const SITE_ID = "site";

export const siteAccessRepository = {
  async read(): Promise<PublicCatalogs> {
    const row = await prisma.siteAccess.findUnique({ where: { id: SITE_ID } });
    return row ? normalizePublicCatalogs(row.catalogs) : defaultPublicCatalogs;
  },

  async save(catalogs: PublicCatalogs): Promise<PublicCatalogs> {
    const row = await prisma.siteAccess.upsert({
      where: { id: SITE_ID },
      create: { id: SITE_ID, catalogs: catalogs as Prisma.InputJsonValue },
      update: { catalogs: catalogs as Prisma.InputJsonValue },
    });
    return normalizePublicCatalogs(row.catalogs);
  },
};
