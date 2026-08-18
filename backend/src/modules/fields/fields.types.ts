export type FieldRecord = {
  id: string;
  name: string;
  slug: string;
  summary: string;
  overview: string;
  iconUrl: string | null;
  thumbnailUrl: string | null;
  bannerUrl: string | null;
  videoUrl: string | null;
  embedVideoUrl: string | null;
  featured: boolean;
  published: boolean;
  seoTitle: string;
  seoDescription: string;
  sortOrder: number;
};

export type FieldWrite = Omit<FieldRecord, "id" | "sortOrder"> & {
  id?: string;
  sortOrder?: number;
};

export function emptyToNull(value: string | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export function slugFromName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export const defaultFields: FieldWrite[] = [
  {
    name: "Backend Development",
    slug: "backend-development",
    summary: "APIs, domain models, and services that stay stable as systems grow.",
    overview:
      "I treat backend work as product work: clear boundaries, boring operations, and APIs that stay readable after the first launch.",
    iconUrl: null,
    thumbnailUrl: null,
    bannerUrl: null,
    videoUrl: null,
    embedVideoUrl: null,
    featured: true,
    published: true,
    seoTitle: "",
    seoDescription: "",
  },
  {
    name: "DevOps",
    slug: "devops",
    summary: "Packaging, delivery, and the path from a laptop to production.",
    overview:
      "Containers, compose files, and rollouts so the same artifact I test locally is the one I promote.",
    iconUrl: null,
    thumbnailUrl: null,
    bannerUrl: null,
    videoUrl: null,
    embedVideoUrl: null,
    featured: true,
    published: true,
    seoTitle: "",
    seoDescription: "",
  },
  {
    name: "Cloud Engineering",
    slug: "cloud-engineering",
    summary: "Identity, networks, compute, and storage on AWS.",
    overview:
      "Cloud work starts with IAM and the network. Compute and data follow once those boundaries are explicit.",
    iconUrl: null,
    thumbnailUrl: null,
    bannerUrl: null,
    videoUrl: null,
    embedVideoUrl: null,
    featured: false,
    published: true,
    seoTitle: "",
    seoDescription: "",
  },
];
