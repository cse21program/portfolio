export const publicCatalogKeys = [
  "projects",
  "skills",
  "blogs",
  "tutorials",
  "courses",
  "services",
  "certificates",
  "experience",
  "education",
] as const;

export type PublicCatalogKey = (typeof publicCatalogKeys)[number];
export type PublicCatalogs = Record<PublicCatalogKey, boolean>;

export const defaultPublicCatalogs: PublicCatalogs = {
  projects: true,
  skills: true,
  blogs: true,
  tutorials: true,
  courses: true,
  services: true,
  certificates: true,
  experience: true,
  education: true,
};

export function normalizePublicCatalogs(value: unknown): PublicCatalogs {
  const source =
    value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  const catalogs = { ...defaultPublicCatalogs };
  for (const key of publicCatalogKeys) {
    catalogs[key] = source[key] !== false;
  }
  return catalogs;
}

export function isCatalogLive(catalogs: PublicCatalogs, key: PublicCatalogKey) {
  return catalogs[key] !== false;
}
