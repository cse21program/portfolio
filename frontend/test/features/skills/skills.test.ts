import { describe, expect, it } from "vitest";
import {
  fieldOptions,
  fieldIntro,
  findSkill,
  findTopic,
  groupSkillsByField,
  isSlug,
  listFromLines,
  listSkillFields,
  normalizeRelatedSlugs,
  normalizeSkill,
  normalizeSkillList,
  publishedSkills,
  selectFeaturedSkills,
  skillsIntro,
  slugFromTitle,
  SKILL_FIELDS,
} from "@/types/skills";

describe("skill helpers", () => {
  it("builds a kebab-case slug from a name", () => {
    expect(slugFromTitle("Spring Boot")).toBe("spring-boot");
    expect(slugFromTitle("  Node.js  ")).toBe("node-js");
  });

  it("normalizes list order and trims nested topics", () => {
    const items = normalizeSkillList([
      {
        name: "  Java  ",
        slug: " Java ",
        field: " Backend Development ",
        level: " Advanced ",
        years: " Core language ",
        summary: " Typed backends. ",
        overview: " Domain models. ",
        featured: true,
        published: true,
        topics: [
          {
            title: "  OOP  ",
            slug: " OOP ",
            summary: " Encapsulation. ",
            overview: " Composition first. ",
            relatedBlogSlugs: [" jwt-authentication ", ""],
            relatedTutorialSlugs: [],
            relatedCourseSlugs: [" spring-boot-masterclass "],
          },
        ],
      },
    ]);

    expect(items[0]?.name).toBe("Java");
    expect(items[0]?.slug).toBe("java");
    expect(items[0]?.field).toBe("Backend Development");
    expect(items[0]?.topics[0]?.slug).toBe("oop");
    expect(items[0]?.topics[0]?.relatedBlogSlugs).toEqual(["jwt-authentication"]);
    expect(items[0]?.sortOrder).toBe(0);
    expect(normalizeRelatedSlugs("jwt-authentication, modular-monolith")).toEqual([
      "jwt-authentication",
      "modular-monolith",
    ]);
    expect(normalizeRelatedSlugs([" JWT authentication ", "jwt-authentication"])).toEqual([
      "jwt-authentication",
    ]);
    expect(isSlug("jwt-authentication")).toBe(true);
    expect(isSlug("JWT Auth")).toBe(false);
  });

  it("groups fields, hides unpublished, and prefers featured items", () => {
    expect(listFromLines("java\nspring-boot\n")).toEqual(["java", "spring-boot"]);

    const java = normalizeSkill({
      name: "Java",
      slug: "java",
      field: "Backend Development",
      featured: true,
      summary: "Typed backends.",
    });
    const docker = normalizeSkill({
      name: "Docker",
      slug: "docker",
      field: "DevOps",
      featured: false,
      published: false,
      summary: "Containers.",
    });
    const aws = normalizeSkill({
      name: "AWS",
      slug: "aws",
      field: "Cloud Engineering",
      featured: false,
      summary: "Cloud services.",
    });

    expect(listSkillFields([java, docker, aws])).toEqual([
      "Backend Development",
      "Cloud Engineering",
    ]);
    expect(groupSkillsByField([java, docker, aws]).map((group) => group.field)).toEqual([
      "Backend Development",
      "Cloud Engineering",
    ]);
    expect(fieldOptions([java], "").slice(0, 3)).toEqual([
      "Backend Development",
      "Frontend Development",
      "DevOps",
    ]);
    expect(fieldOptions([], "Custom Area")).toContain("Custom Area");
    expect(SKILL_FIELDS).toContain("Cloud Engineering");
    expect(publishedSkills([java, docker, aws]).map((item) => item.slug)).toEqual(["java", "aws"]);
    expect(selectFeaturedSkills([java, docker, aws]).map((item) => item.slug)).toEqual(["java"]);
    expect(findSkill([java, docker, aws], "docker")).toBeUndefined();
    expect(findTopic([java], "java", "missing")).toBeUndefined();
    expect(
      skillsIntro([
        { ...java, videoUrl: "/media/java.mp4" },
        { ...aws, embedVideoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
      ])?.title,
    ).toBe("Java introduction");
    expect(
      fieldIntro([
        { ...java, fieldEmbedVideoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
        { ...java, name: "Spring Boot", slug: "spring-boot", fieldVideoUrl: "/media/backend.mp4" },
      ])?.title,
    ).toBe("Backend Development introduction");
  });
});
