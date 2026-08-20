import type { KnowledgeTopic } from "@/types/public";
import { normalizeTopic, slugFromTitle } from "@/types/skills";

export type { KnowledgeTopic };

export function normalizeKnowledgeTopic(
  item: Partial<KnowledgeTopic> & Pick<KnowledgeTopic, "title" | "slug" | "skill" | "skillSlug">,
  index = 0,
): KnowledgeTopic {
  const topic = normalizeTopic(item, index);
  return {
    ...topic,
    skill: item.skill.trim(),
    skillSlug: item.skillSlug.trim().toLowerCase() || slugFromTitle(item.skill),
    field: item.field?.trim() ?? "",
    fieldSlug: item.fieldSlug?.trim() || slugFromTitle(item.field ?? ""),
  };
}

export function normalizeTopicList(items: KnowledgeTopic[] | undefined) {
  return (items ?? []).map((item, index) => normalizeKnowledgeTopic(item, index));
}

export function publishedKnowledgeTopics(items: KnowledgeTopic[]) {
  return items.filter((item) => item.published !== false);
}

export function findKnowledgeTopic(items: KnowledgeTopic[], skillSlug: string, topicSlug: string) {
  return publishedKnowledgeTopics(items).find(
    (item) => item.skillSlug === skillSlug && item.slug === topicSlug,
  );
}

export function findUniqueTopicBySlug(items: KnowledgeTopic[], slug: string) {
  const matches = publishedKnowledgeTopics(items).filter((item) => item.slug === slug);
  return matches.length === 1 ? matches[0] : undefined;
}

export function siblingTopics(items: KnowledgeTopic[], topic: KnowledgeTopic) {
  return publishedKnowledgeTopics(items).filter((item) => item.skillSlug === topic.skillSlug);
}

export function topicCanonicalPath(topic: Pick<KnowledgeTopic, "skillSlug" | "slug">) {
  return `/topics/${topic.skillSlug}/${topic.slug}`;
}

export function topicBodyParagraphs(body: string) {
  return body
    .trim()
    .split(/\n{2,}/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function matchesTopicQuery(item: KnowledgeTopic, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return true;
  }

  return [item.title, item.slug, item.skill, item.skillSlug, item.field, item.summary]
    .join(" ")
    .toLowerCase()
    .includes(needle);
}

export type TopicStatusFilter = "all" | "published" | "draft";

export function matchesTopicFilters(
  item: KnowledgeTopic,
  filters: { query: string; skill: string; status: TopicStatusFilter; field?: string },
) {
  if (!matchesTopicQuery(item, filters.query)) {
    return false;
  }
  if (filters.skill && item.skill !== filters.skill) {
    return false;
  }
  if (filters.field && item.field !== filters.field) {
    return false;
  }
  if (filters.status === "published" && item.published === false) {
    return false;
  }
  if (filters.status === "draft" && item.published !== false) {
    return false;
  }
  return true;
}

export function groupTopicsBySkill(items: KnowledgeTopic[]) {
  const chapters: Array<{ skill: string; skillSlug: string; field: string; topics: KnowledgeTopic[] }> = [];
  for (const item of publishedKnowledgeTopics(items)) {
    const current = chapters.find((chapter) => chapter.skillSlug === item.skillSlug);
    if (current) {
      current.topics.push(item);
      continue;
    }
    chapters.push({
      skill: item.skill,
      skillSlug: item.skillSlug,
      field: item.field,
      topics: [item],
    });
  }
  return chapters;
}

export function emptyKnowledgeTopic(skill = "", skillSlug = "", sortOrder = 0): KnowledgeTopic {
  return {
    id: crypto.randomUUID(),
    skill,
    skillSlug,
    field: "",
    fieldSlug: "",
    title: "",
    slug: "",
    summary: "",
    overview: "",
    body: "",
    images: [],
    videoUrl: null,
    embedVideoUrl: null,
    codeSnippets: [],
    resources: [],
    externalLinks: [],
    relatedBlogSlugs: [],
    relatedTutorialSlugs: [],
    relatedCourseSlugs: [],
    relatedProjectSlugs: [],
    relatedCertificateSlugs: [],
    published: true,
    seoTitle: "",
    seoDescription: "",
    sortOrder,
  };
}
