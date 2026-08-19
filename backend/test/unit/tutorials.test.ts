import { describe, expect, it } from "vitest";
import { defaultTutorials } from "../../src/modules/tutorials/tutorials.seed";
import {
  parseTutorialSections,
  relatedTutorials,
  type TutorialRecord,
} from "../../src/modules/tutorials/tutorials.types";

const docker: TutorialRecord = {
  id: "1",
  title: "Docker complete",
  slug: "docker-complete",
  description: "Images and containers.",
  difficulty: "Beginner",
  prerequisites: [],
  duration: "4 hours",
  thumbnailUrl: null,
  skill: "Docker",
  relatedSkillSlugs: [],
  relatedCourseSlugs: [],
  price: "Free",
  free: true,
  sections: [],
  status: "published",
  publishedAt: "2026-06-02",
  seoTitle: "",
  seoDescription: "",
  canonicalUrl: "",
  sortOrder: 0,
};

describe("tutorial helpers", () => {
  it("seeds every section with body copy", () => {
    expect(defaultTutorials.map((item) => item.slug)).toEqual([
      "docker-complete",
      "express-modules",
      "jwt-api-security",
    ]);
    for (const tutorial of defaultTutorials) {
      expect(tutorial.sections.length).toBeGreaterThan(0);
      for (const section of tutorial.sections) {
        expect(section.body.length, `${tutorial.slug} / ${section.title}`).toBeGreaterThan(0);
      }
    }
    expect(defaultTutorials[0]?.sections.some((section) => section.codeSnippets.length > 0)).toBe(true);
    expect(defaultTutorials[0]?.sections[0]?.body[0]).toContain("Containers package an app with its runtime");
  });

  it("parses sections from title and summary only", () => {
    expect(
      parseTutorialSections([{ title: "Images", summary: "Layers and tagging." }]),
    ).toEqual([
      {
        title: "Images",
        summary: "Layers and tagging.",
        body: [],
        videoUrl: null,
        images: [],
        codeSnippets: [],
        resources: [],
        downloads: [],
      },
    ]);
  });

  it("prefers related tutorials with the same skill or difficulty", () => {
    const related = relatedTutorials(docker, [
      docker,
      { ...docker, id: "2", slug: "compose", title: "Compose", skill: "Docker" },
      { ...docker, id: "3", slug: "express", title: "Express", difficulty: "Intermediate", skill: "Node.js" },
      { ...docker, id: "4", slug: "draft", title: "Draft", status: "draft" },
    ]);

    expect(related.map((item) => item.slug)).toEqual(["compose", "express"]);
  });
});
