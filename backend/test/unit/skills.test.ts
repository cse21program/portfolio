import { describe, expect, it } from "vitest";
import { relatedSkills, type SkillRecord, type TopicRecord } from "../../src/modules/skills/skills.types";

function topic(slug: string): TopicRecord {
  return {
    id: slug,
    slug,
    title: slug,
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
    sortOrder: 0,
  };
}

function skill(partial: Partial<SkillRecord> & Pick<SkillRecord, "slug" | "field">): SkillRecord {
  return {
    id: partial.id ?? partial.slug,
    name: partial.name ?? partial.slug,
    slug: partial.slug,
    field: partial.field,
    level: partial.level ?? "Advanced",
    years: partial.years ?? "",
    summary: partial.summary ?? "",
    overview: partial.overview ?? "",
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
    sortOrder: 0,
    topics: partial.topics ?? [topic("overview")],
  };
}

describe("relatedSkills", () => {
  it("prefers the same field, then fills from the rest", () => {
    const current = skill({ slug: "java", field: "Backend Development" });
    const related = relatedSkills(current, [
      current,
      skill({ slug: "spring-boot", field: "Backend Development" }),
      skill({ slug: "docker", field: "DevOps" }),
      skill({ slug: "nodejs", field: "Backend Development" }),
    ]);

    expect(related.map((item) => item.slug)).toEqual(["spring-boot", "nodejs", "docker"]);
  });
});
