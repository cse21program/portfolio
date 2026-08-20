import type { TopicLink, TopicSnippet, Tutorial, TutorialSection } from "@/types/public";

export type { Tutorial, TutorialSection };

export const tutorialStatuses = ["draft", "scheduled", "published", "archived"] as const;
export type TutorialStatus = (typeof tutorialStatuses)[number];

export const tutorialDifficulties = ["Beginner", "Intermediate", "Advanced", "Professional"] as const;
export type TutorialDifficulty = (typeof tutorialDifficulties)[number];

export function listFromLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function paragraphsFromBody(value: string) {
  return value
    .split(/\n{2,}/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function slugFromTitle(title: string) {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function isSlug(value: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length >= 2 && value.length <= 80;
}

export function accessLabel(item: Pick<Tutorial, "free" | "price">) {
  return item.free ? "Free" : item.price.trim() || "Premium";
}

export type TutorialAccess = {
  purchased: boolean;
  canReadSections: boolean;
};

export const defaultTutorialAccess: TutorialAccess = {
  purchased: false,
  canReadSections: false,
};

export function parseTutorialAccess(value: unknown): TutorialAccess {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return defaultTutorialAccess;
  }
  const row = value as Record<string, unknown>;
  return {
    purchased: row.purchased === true,
    canReadSections: row.canReadSections === true,
  };
}

export function formatTutorialDate(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  const iso = /^\d{4}-\d{2}-\d{2}/.test(trimmed) ? `${trimmed.slice(0, 10)}T00:00:00` : trimmed;
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) {
    return trimmed;
  }
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(parsed));
}

export function sectionAnchor(index: number, title: string) {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `section-${index + 1}${slug ? `-${slug}` : ""}`;
}

export function emptySection(): TutorialSection {
  return {
    title: "",
    summary: "",
    body: [],
    videoUrl: null,
    images: [],
    codeSnippets: [],
    resources: [],
    downloads: [],
  };
}

function normalizeLink(item: Partial<TopicLink> | undefined): TopicLink | null {
  const label = item?.label?.trim() ?? "";
  const url = item?.url?.trim() ?? "";
  if (!label || !url) {
    return null;
  }
  return { label, url };
}

function normalizeSnippet(item: Partial<TopicSnippet> | undefined): TopicSnippet | null {
  const code = item?.code ?? "";
  if (!code.trim()) {
    return null;
  }
  return {
    label: item?.label?.trim() ?? "",
    language: item?.language?.trim() || "text",
    code,
  };
}

export function normalizeSection(item: Partial<TutorialSection> & Pick<TutorialSection, "title">): TutorialSection {
  return {
    title: item.title.trim(),
    summary: item.summary?.trim() ?? "",
    body: (item.body ?? []).map((entry) => entry.trim()).filter(Boolean),
    videoUrl: item.videoUrl?.trim() || null,
    images: (item.images ?? []).map((entry) => entry.trim()).filter(Boolean),
    codeSnippets: (item.codeSnippets ?? []).map(normalizeSnippet).filter((entry): entry is TopicSnippet => Boolean(entry)),
    resources: (item.resources ?? []).map(normalizeLink).filter((entry): entry is TopicLink => Boolean(entry)),
    downloads: (item.downloads ?? []).map(normalizeLink).filter((entry): entry is TopicLink => Boolean(entry)),
  };
}

export function normalizeTutorial(
  item: Partial<Tutorial> & Pick<Tutorial, "title" | "slug">,
  index = 0,
): Tutorial {
  const free = item.free ?? (item.price?.trim().toLowerCase() === "free" || !item.price);
  return {
    id: typeof item.id === "string" && item.id.length > 0 ? item.id : undefined,
    title: item.title.trim(),
    slug: item.slug.trim().toLowerCase(),
    description: item.description?.trim() ?? "",
    difficulty: item.difficulty?.trim() || "Beginner",
    prerequisites: (item.prerequisites ?? []).map((entry) => entry.trim()).filter(Boolean),
    duration: item.duration?.trim() ?? "",
    thumbnailUrl: item.thumbnailUrl?.trim() || null,
    price: free ? "Free" : item.price?.trim() || "Premium",
    free,
    skill: item.skill?.trim() ?? "",
    relatedSkillSlugs: (item.relatedSkillSlugs ?? []).map((entry) => entry.trim()).filter(Boolean),
    relatedCourseSlugs: (item.relatedCourseSlugs ?? []).map((entry) => entry.trim()).filter(Boolean),
    sections: (item.sections ?? [])
      .filter((section) => section.title?.trim())
      .map((section) => normalizeSection({ ...section, title: section.title })),
    status: item.status?.trim() || "published",
    publishedAt: item.publishedAt?.trim() ?? "",
    seoTitle: item.seoTitle?.trim() ?? "",
    seoDescription: item.seoDescription?.trim() ?? "",
    canonicalUrl: item.canonicalUrl?.trim() ?? "",
    sortOrder: item.sortOrder ?? index,
    updatedAt: item.updatedAt,
  };
}

export function normalizeTutorialList(items: Tutorial[] | undefined) {
  return (items ?? []).map((item, index) => normalizeTutorial(item, index));
}

export function publishedTutorials(items: Tutorial[]) {
  return items.filter((item) => (item.status ?? "published") === "published");
}

export function findTutorial(items: Tutorial[], slug: string) {
  return publishedTutorials(items).find((item) => item.slug === slug);
}

export function relatedTutorials(tutorial: Tutorial, items: Tutorial[]) {
  const others = publishedTutorials(items).filter((item) => item.slug !== tutorial.slug);
  const close = others.filter(
    (item) =>
      (tutorial.skill && item.skill === tutorial.skill) ||
      (tutorial.difficulty && item.difficulty === tutorial.difficulty),
  );
  const rest = others.filter((item) => !close.includes(item));
  return [...close, ...rest].slice(0, 3);
}

export function matchesTutorialQuery(item: Tutorial, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return true;
  }
  return [
    item.title,
    item.description,
    item.skill,
    item.difficulty,
    accessLabel(item),
    ...(item.prerequisites ?? []),
    ...item.sections.map((section) => `${section.title} ${section.summary}`),
  ]
    .join(" ")
    .toLowerCase()
    .includes(needle);
}

export type TutorialFilters = {
  query: string;
  difficulty: string;
  skill: string;
  access: string;
  status: string;
};

export function matchesTutorialFilters(item: Tutorial, filters: TutorialFilters) {
  if (!matchesTutorialQuery(item, filters.query)) {
    return false;
  }
  if (filters.difficulty && item.difficulty !== filters.difficulty) {
    return false;
  }
  if (filters.skill && item.skill !== filters.skill) {
    return false;
  }
  if (filters.access === "free" && !item.free) {
    return false;
  }
  if (filters.access === "premium" && item.free) {
    return false;
  }
  if (filters.status && (item.status ?? "published") !== filters.status) {
    return false;
  }
  return true;
}

export function emptyTutorial(sortOrder = 0): Tutorial {
  return {
    id: crypto.randomUUID(),
    title: "",
    slug: "",
    description: "",
    difficulty: "Beginner",
    prerequisites: [],
    duration: "",
    thumbnailUrl: null,
    price: "Free",
    free: true,
    skill: "",
    relatedSkillSlugs: [],
    relatedCourseSlugs: [],
    sections: [emptySection()],
    status: "draft",
    publishedAt: new Date().toISOString().slice(0, 10),
    seoTitle: "",
    seoDescription: "",
    canonicalUrl: "",
    sortOrder,
  };
}
