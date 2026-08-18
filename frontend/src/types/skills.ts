import type { Skill, SkillTopic } from "@/types/public";

export type { Skill, SkillTopic };

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function listFromLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
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
  return value.length >= 2 && value.length <= 80 && SLUG_PATTERN.test(value);
}

export function normalizeRelatedSlugs(value: unknown): string[] {
  const chunks: string[] = [];

  function pushPart(part: string) {
    const trimmed = part.trim().toLowerCase();
    if (isSlug(trimmed)) {
      chunks.push(trimmed);
      return;
    }
    const slug = slugFromTitle(part);
    if (isSlug(slug)) {
      chunks.push(slug);
    }
  }

  function pushEntry(entry: unknown) {
    if (typeof entry !== "string") {
      return;
    }
    for (const part of entry.split(/[\n,]+/)) {
      pushPart(part);
    }
  }

  if (Array.isArray(value)) {
    value.forEach(pushEntry);
  } else {
    pushEntry(value);
  }

  return [...new Set(chunks)];
}

export function normalizeTopic(
  item: Partial<SkillTopic> & Pick<SkillTopic, "title" | "slug">,
  index = 0,
): SkillTopic {
  return {
    id: typeof item.id === "string" && item.id.length > 0 ? item.id : undefined,
    title: item.title.trim(),
    slug: item.slug.trim().toLowerCase(),
    summary: item.summary?.trim() ?? "",
    overview: item.overview?.trim() ?? "",
    images: (item.images ?? []).map((entry) => entry.trim()).filter(Boolean),
    videoUrl: item.videoUrl?.trim() || null,
    embedVideoUrl: item.embedVideoUrl?.trim() || null,
    relatedBlogSlugs: normalizeRelatedSlugs(item.relatedBlogSlugs),
    relatedTutorialSlugs: normalizeRelatedSlugs(item.relatedTutorialSlugs),
    relatedCourseSlugs: normalizeRelatedSlugs(item.relatedCourseSlugs),
    seoTitle: item.seoTitle?.trim() ?? "",
    seoDescription: item.seoDescription?.trim() ?? "",
    sortOrder: item.sortOrder ?? index,
  };
}

export function normalizeSkill(item: Partial<Skill> & Pick<Skill, "name" | "slug">): Skill {
  return {
    id: typeof item.id === "string" && item.id.length > 0 ? item.id : undefined,
    name: item.name.trim(),
    slug: item.slug.trim().toLowerCase(),
    field: item.field?.trim() ?? "",
    fieldSlug: item.fieldSlug?.trim() || slugFromTitle(item.field ?? ""),
    level: item.level?.trim() || "Intermediate",
    years: item.years?.trim() ?? "",
    summary: item.summary?.trim() ?? "",
    overview: item.overview?.trim() ?? "",
    iconUrl: item.iconUrl?.trim() || null,
    imageUrl: item.imageUrl?.trim() || null,
    videoUrl: item.videoUrl?.trim() || null,
    embedVideoUrl: item.embedVideoUrl?.trim() || null,
    fieldVideoUrl: item.fieldVideoUrl?.trim() || null,
    fieldEmbedVideoUrl: item.fieldEmbedVideoUrl?.trim() || null,
    featured: item.featured === true,
    published: item.published !== false,
    seoTitle: item.seoTitle?.trim() ?? "",
    seoDescription: item.seoDescription?.trim() ?? "",
    sortOrder: item.sortOrder,
    topics: (item.topics ?? []).map((topic, index) => normalizeTopic(topic, index)),
  };
}

export function normalizeSkillList(items: Skill[] | undefined) {
  return (items ?? []).map((item, index) =>
    normalizeSkill({
      ...item,
      sortOrder: item.sortOrder ?? index,
    }),
  );
}

export function publishedSkills(items: Skill[]) {
  return items.filter((item) => item.published !== false);
}

export const SKILL_FIELDS = [
  "Backend Development",
  "Frontend Development",
  "DevOps",
  "Cloud Engineering",
  "Database Engineering",
  "System Design",
  "Software Architecture",
] as const;

export const SKILL_LEVELS = ["Advanced", "Intermediate", "Familiar"] as const;

export const NEW_SKILL_FIELD = "__new_field__";

export function fieldOptions(items: Skill[], current = "") {
  const extra = items.map((item) => item.field.trim()).filter(Boolean);
  if (current.trim()) {
    extra.push(current.trim());
  }
  return [...new Set([...SKILL_FIELDS, ...extra])];
}

export function levelOptions(current = "") {
  const trimmed = current.trim();
  if (trimmed && !SKILL_LEVELS.includes(trimmed as (typeof SKILL_LEVELS)[number])) {
    return [trimmed, ...SKILL_LEVELS];
  }
  return [...SKILL_LEVELS];
}

export function listSkillFields(items: Skill[]) {
  return [...new Set(publishedSkills(items).map((item) => item.field).filter(Boolean))];
}

export function fieldAnchor(field: string) {
  return `field-${slugFromTitle(field)}`;
}

export function groupSkillsByField(items: Skill[], fieldOrder: string[] = []) {
  const visible = publishedSkills(items);
  const names = fieldOrder.length > 0 ? fieldOrder : listSkillFields(visible);
  const extras = listSkillFields(visible).filter((field) => !names.includes(field));
  return [...names, ...extras]
    .filter((field) => visible.some((item) => item.field === field))
    .map((field) => ({
      field,
      skills: visible.filter((item) => item.field === field),
    }));
}

export function selectFeaturedSkills(items: Skill[]) {
  const visible = publishedSkills(items);
  const featured = visible.filter((item) => item.featured);
  return featured.length > 0 ? featured : visible.slice(0, 6);
}

export function findSkill(items: Skill[], slug: string) {
  return publishedSkills(items).find((item) => item.slug === slug);
}

export function findTopic(items: Skill[], skillSlug: string, topicSlug: string) {
  const skill = findSkill(items, skillSlug);
  const topic = skill?.topics.find((item) => item.slug === topicSlug);
  return skill && topic ? { skill, topic } : undefined;
}

export function relatedSkillsFor(skill: Skill, all: Skill[], limit = 3) {
  const visible = publishedSkills(all);
  const sameField = visible.filter((item) => item.slug !== skill.slug && item.field === skill.field);
  const others = visible.filter((item) => item.slug !== skill.slug && item.field !== skill.field);
  return [...sameField, ...others].slice(0, limit);
}

export type SkillsIntro = {
  embedUrl: string | null;
  fileUrl: string | null;
  poster: string | null;
  title: string;
};

export function skillsIntro(
  items: Skill[],
  fallback?: { embedVideoUrl?: string | null; introVideoUrl?: string | null },
): SkillsIntro | null {
  const visible = publishedSkills(items);
  const ordered = [
    ...visible.filter((item) => item.featured),
    ...visible.filter((item) => !item.featured),
  ];
  for (const skill of ordered) {
    if (skill.embedVideoUrl || skill.videoUrl) {
      return {
        embedUrl: skill.embedVideoUrl ?? null,
        fileUrl: skill.videoUrl ?? null,
        poster: skill.imageUrl ?? null,
        title: `${skill.name} introduction`,
      };
    }
  }
  if (fallback?.embedVideoUrl || fallback?.introVideoUrl) {
    return {
      embedUrl: fallback.embedVideoUrl ?? null,
      fileUrl: fallback.introVideoUrl ?? null,
      poster: null,
      title: "Skills introduction",
    };
  }
  return null;
}

export function fieldIntro(items: Skill[]) {
  const withMedia = items.find((item) => item.fieldEmbedVideoUrl || item.fieldVideoUrl);
  if (!withMedia) {
    return null;
  }
  return {
    embedUrl: withMedia.fieldEmbedVideoUrl ?? null,
    fileUrl: withMedia.fieldVideoUrl ?? null,
    title: `${withMedia.field} introduction`,
  };
}

export function emptyTopic(sortOrder = 0): SkillTopic {
  return {
    id: crypto.randomUUID(),
    title: "",
    slug: "",
    summary: "",
    overview: "",
    images: [],
    videoUrl: null,
    embedVideoUrl: null,
    relatedBlogSlugs: [],
    relatedTutorialSlugs: [],
    relatedCourseSlugs: [],
    seoTitle: "",
    seoDescription: "",
    sortOrder,
  };
}

export function emptySkill(sortOrder = 0): Skill {
  return {
    id: crypto.randomUUID(),
    name: "",
    slug: "",
    field: "",
    fieldSlug: "",
    level: "Intermediate",
    years: "",
    summary: "",
    overview: "",
    iconUrl: null,
    imageUrl: null,
    videoUrl: null,
    embedVideoUrl: null,
    fieldVideoUrl: null,
    fieldEmbedVideoUrl: null,
    featured: false,
    published: true,
    seoTitle: "",
    seoDescription: "",
    sortOrder,
    topics: [],
  };
}
