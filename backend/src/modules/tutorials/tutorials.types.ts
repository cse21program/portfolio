import { parseTopicLinks, parseTopicSnippets, type TopicLink, type TopicSnippet } from "../topics/topics.types";

export type TutorialSection = {
  title: string;
  summary: string;
  body: string[];
  videoUrl: string | null;
  images: string[];
  codeSnippets: TopicSnippet[];
  resources: TopicLink[];
  downloads: TopicLink[];
};

export type TutorialRecord = {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: string;
  prerequisites: string[];
  duration: string;
  thumbnailUrl: string | null;
  skill: string;
  relatedSkillSlugs: string[];
  relatedCourseSlugs: string[];
  price: string;
  free: boolean;
  sections: TutorialSection[];
  status: string;
  publishedAt: string;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  sortOrder: number;
  updatedAt?: string;
};

export type TutorialWrite = Omit<TutorialRecord, "id" | "sortOrder" | "updatedAt"> & {
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

export function isPublishedTutorial(item: Pick<TutorialRecord, "status">) {
  return item.status === "published";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function parseTutorialSections(value: unknown): TutorialSection[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const sections: TutorialSection[] = [];
  for (const entry of value) {
    const row = asRecord(entry);
    if (!row) {
      continue;
    }
    const title = typeof row.title === "string" ? row.title.trim() : "";
    if (!title) {
      continue;
    }
    const video = typeof row.videoUrl === "string" ? row.videoUrl.trim() : "";
    sections.push({
      title,
      summary: typeof row.summary === "string" ? row.summary.trim() : "",
      body: stringList(row.body),
      videoUrl: video.length > 0 ? video : null,
      images: stringList(row.images),
      codeSnippets: parseTopicSnippets(row.codeSnippets),
      resources: parseTopicLinks(row.resources),
      downloads: parseTopicLinks(row.downloads),
    });
  }
  return sections;
}

export function relatedTutorials(tutorial: TutorialRecord, all: TutorialRecord[]) {
  const others = all.filter((item) => isPublishedTutorial(item) && item.slug !== tutorial.slug);
  const close = others.filter(
    (item) =>
      Boolean(tutorial.skill && item.skill === tutorial.skill) ||
      Boolean(tutorial.difficulty && item.difficulty === tutorial.difficulty),
  );
  const rest = others.filter((item) => !close.includes(item));
  return [...close, ...rest].slice(0, 3);
}

export { defaultTutorials } from "./tutorials.seed";
