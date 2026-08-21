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

export type PublicCatalogGroupId = "portfolio" | "knowledge" | "learn" | "work";

export type PublicCatalogMeta = {
  key: PublicCatalogKey;
  group: PublicCatalogGroupId;
  label: string;
  summary: string;
  href: string;
  studioHref: string;
};

export const publicCatalogGroups: Array<{
  id: PublicCatalogGroupId;
  label: string;
  description: string;
}> = [
  { id: "portfolio", label: "Portfolio", description: "The public body of work." },
  { id: "knowledge", label: "Knowledge", description: "Skills, fields, and topics visitors can open." },
  { id: "learn", label: "Learn", description: "Articles, tutorials, and courses." },
  { id: "work", label: "Work", description: "Services people can request." },
];

export const publicCatalogMeta: PublicCatalogMeta[] = [
  {
    key: "projects",
    group: "portfolio",
    label: "Projects",
    summary: "Case studies, featured work, and search results.",
    href: "/projects",
    studioHref: "/admin/projects",
  },
  {
    key: "experience",
    group: "portfolio",
    label: "Experience",
    summary: "Work history on the public timeline.",
    href: "/experience",
    studioHref: "/admin/experience",
  },
  {
    key: "education",
    group: "portfolio",
    label: "Education",
    summary: "Degrees and study on the public site.",
    href: "/education",
    studioHref: "/admin/education",
  },
  {
    key: "certificates",
    group: "portfolio",
    label: "Certificates",
    summary: "Credentials list and certificate pages.",
    href: "/certificates",
    studioHref: "/admin/certificates",
  },
  {
    key: "skills",
    group: "knowledge",
    label: "Skills",
    summary: "Skills, fields, and topics in the knowledge catalog.",
    href: "/skills",
    studioHref: "/admin/skills",
  },
  {
    key: "blogs",
    group: "learn",
    label: "Blog",
    summary: "Articles, related links, and the newsletter block.",
    href: "/blog",
    studioHref: "/admin/blogs",
  },
  {
    key: "tutorials",
    group: "learn",
    label: "Tutorials",
    summary: "Tutorial catalog. Purchased lessons stay in the account.",
    href: "/tutorials",
    studioHref: "/admin/tutorials",
  },
  {
    key: "courses",
    group: "learn",
    label: "Courses",
    summary: "Course catalog and checkout. Enrolled students keep their classroom.",
    href: "/courses",
    studioHref: "/admin/courses",
  },
  {
    key: "services",
    group: "work",
    label: "Services",
    summary: "Service catalog, packages, and public requests.",
    href: "/services",
    studioHref: "/admin/services",
  },
];

const pathCatalogs: Array<{ prefix: string; catalog: PublicCatalogKey }> = [
  { prefix: "/projects", catalog: "projects" },
  { prefix: "/skills", catalog: "skills" },
  { prefix: "/topics", catalog: "skills" },
  { prefix: "/fields", catalog: "skills" },
  { prefix: "/blog", catalog: "blogs" },
  { prefix: "/tutorials", catalog: "tutorials" },
  { prefix: "/courses", catalog: "courses" },
  { prefix: "/services", catalog: "services" },
  { prefix: "/certificates", catalog: "certificates" },
  { prefix: "/experience", catalog: "experience" },
  { prefix: "/education", catalog: "education" },
];

export function normalizePublicCatalogs(value: unknown): PublicCatalogs {
  const source =
    value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  const catalogs = { ...defaultPublicCatalogs };
  for (const key of publicCatalogKeys) {
    catalogs[key] = source[key] !== false;
  }
  return catalogs;
}

export function catalogForHref(href: string): PublicCatalogKey | null {
  const path = href.split("?")[0] ?? href;
  const match = pathCatalogs.find((item) => path === item.prefix || path.startsWith(`${item.prefix}/`));
  return match?.catalog ?? null;
}

export function visibleNavItems<T extends { href: string }>(items: T[], catalogs: PublicCatalogs): T[] {
  return items.filter((item) => {
    const catalog = catalogForHref(item.href);
    return !catalog || catalogs[catalog] !== false;
  });
}

export const searchKindCatalog: Record<string, PublicCatalogKey> = {
  project: "projects",
  skill: "skills",
  topic: "skills",
  blog: "blogs",
  tutorial: "tutorials",
  course: "courses",
  service: "services",
};
