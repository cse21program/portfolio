export type TopicLink = {
  label: string;
  url: string;
};

export type TopicSnippet = {
  label: string;
  language: string;
  code: string;
};

export type TopicRecord = {
  id: string;
  skill: string;
  skillSlug: string;
  field: string;
  fieldSlug: string;
  title: string;
  slug: string;
  summary: string;
  overview: string;
  body: string;
  images: string[];
  videoUrl: string | null;
  embedVideoUrl: string | null;
  codeSnippets: TopicSnippet[];
  resources: TopicLink[];
  externalLinks: TopicLink[];
  relatedBlogSlugs: string[];
  relatedTutorialSlugs: string[];
  relatedCourseSlugs: string[];
  relatedProjectSlugs: string[];
  relatedCertificateSlugs: string[];
  published: boolean;
  seoTitle: string;
  seoDescription: string;
  sortOrder: number;
};

export type TopicWrite = Omit<TopicRecord, "id" | "sortOrder"> & {
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

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

export function parseTopicLinks(value: unknown): TopicLink[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const links: TopicLink[] = [];
  for (const entry of value) {
    const row = asRecord(entry);
    if (!row) {
      continue;
    }
    const label = typeof row.label === "string" ? row.label.trim() : "";
    const url = typeof row.url === "string" ? row.url.trim() : "";
    if (label && url) {
      links.push({ label, url });
    }
  }
  return links;
}

export function parseTopicSnippets(value: unknown): TopicSnippet[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const snippets: TopicSnippet[] = [];
  for (const entry of value) {
    const row = asRecord(entry);
    if (!row) {
      continue;
    }
    const code = typeof row.code === "string" ? row.code : "";
    if (!code.trim()) {
      continue;
    }
    snippets.push({
      label: typeof row.label === "string" ? row.label.trim() : "",
      language: typeof row.language === "string" && row.language.trim() ? row.language.trim() : "text",
      code,
    });
  }
  return snippets;
}
