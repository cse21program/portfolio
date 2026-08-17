import { describe, expect, it } from "vitest";
import { relatedProjects, type ProjectRecord } from "../../src/modules/projects/projects.types";

function project(partial: Partial<ProjectRecord> & Pick<ProjectRecord, "slug" | "category">): ProjectRecord {
  return {
    id: partial.id ?? partial.slug,
    title: partial.title ?? partial.slug,
    slug: partial.slug,
    shortDescription: "",
    fullDescription: "",
    thumbnailUrl: null,
    images: [],
    demoVideoUrl: null,
    category: partial.category,
    technologies: [],
    features: [],
    architecture: "",
    problem: "",
    requirements: "",
    solution: "",
    challenges: [],
    solutions: [],
    lessons: [],
    status: "Shipped",
    startDate: "",
    endDate: "",
    githubUrl: null,
    liveUrl: null,
    docsUrl: null,
    featured: false,
    seoTitle: "",
    seoDescription: "",
    sortOrder: 0,
  };
}

describe("relatedProjects", () => {
  it("prefers the same category, then fills from the rest", () => {
    const current = project({ slug: "alpha", category: "API" });
    const related = relatedProjects(current, [
      current,
      project({ slug: "beta", category: "API" }),
      project({ slug: "gamma", category: "Web" }),
      project({ slug: "delta", category: "API" }),
    ]);

    expect(related.map((item) => item.slug)).toEqual(["beta", "delta", "gamma"]);
  });
});
