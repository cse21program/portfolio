import type { SkillField } from "@/types/public";
import { slugFromTitle } from "@/types/skills";

export type { SkillField };

export function normalizeField(
  item: Partial<SkillField> & Pick<SkillField, "name" | "slug">,
): SkillField {
  return {
    id: typeof item.id === "string" && item.id.length > 0 ? item.id : undefined,
    name: item.name.trim(),
    slug: item.slug.trim().toLowerCase() || slugFromTitle(item.name),
    summary: item.summary?.trim() ?? "",
    overview: item.overview?.trim() ?? "",
    iconUrl: item.iconUrl?.trim() || null,
    thumbnailUrl: item.thumbnailUrl?.trim() || null,
    bannerUrl: item.bannerUrl?.trim() || null,
    videoUrl: item.videoUrl?.trim() || null,
    embedVideoUrl: item.embedVideoUrl?.trim() || null,
    featured: item.featured === true,
    published: item.published !== false,
    seoTitle: item.seoTitle?.trim() ?? "",
    seoDescription: item.seoDescription?.trim() ?? "",
    sortOrder: item.sortOrder,
  };
}

export function normalizeFieldList(items: SkillField[] | undefined) {
  return (items ?? []).map((item, index) =>
    normalizeField({
      ...item,
      sortOrder: item.sortOrder ?? index,
    }),
  );
}

export function publishedFields(items: SkillField[]) {
  return items.filter((item) => item.published !== false);
}

export function findField(items: SkillField[], slug: string) {
  return publishedFields(items).find((item) => item.slug === slug);
}

export function fieldIntroFromField(field: SkillField) {
  if (!field.embedVideoUrl && !field.videoUrl) {
    return null;
  }
  return {
    embedUrl: field.embedVideoUrl ?? null,
    fileUrl: field.videoUrl ?? null,
    title: `${field.name} introduction`,
  };
}

export function emptyField(sortOrder = 0): SkillField {
  return {
    id: crypto.randomUUID(),
    name: "",
    slug: "",
    summary: "",
    overview: "",
    iconUrl: null,
    thumbnailUrl: null,
    bannerUrl: null,
    videoUrl: null,
    embedVideoUrl: null,
    featured: false,
    published: true,
    seoTitle: "",
    seoDescription: "",
    sortOrder,
  };
}
