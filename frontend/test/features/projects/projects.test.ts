import { describe, expect, it } from "vitest";
import {
  selectFeaturedProjects,
  listFromLines,
  normalizeProject,
  normalizeProjectList,
  slugFromTitle,
} from "@/types/projects";

describe("project helpers", () => {
  it("builds a kebab-case slug from a title", () => {
    expect(slugFromTitle("Talk Now")).toBe("talk-now");
    expect(slugFromTitle("  Portfolio Platform  ")).toBe("portfolio-platform");
  });

  it("normalizes list order and trims fields", () => {
    const items = normalizeProjectList([
      {
        title: "  Talk Now  ",
        slug: " Talk-Now ",
        category: " Realtime ",
        status: " Shipped ",
        featured: true,
        shortDescription: " Typed conversations. ",
        fullDescription: " Overview ",
        thumbnailUrl: " /media/thumb.jpg ",
        images: [" /media/one.jpg ", ""],
        demoVideoUrl: " /media/demo.mp4 ",
        problem: " State ",
        requirements: " Keep it typed ",
        solution: " Model first ",
        architecture: " React ",
        features: [" Threads ", ""],
        technologies: [" TypeScript "],
        challenges: [" Realtime UX "],
        solutions: [" Type the domain "],
        lessons: [" Start with types "],
        githubUrl: " https://github.com/swe-rezaul-karim/talk-now ",
        liveUrl: null,
        docsUrl: null,
        startDate: "2025",
        endDate: "2025",
        seoTitle: " Talk Now ",
        seoDescription: " A typed conversation product. ",
      },
    ]);

    expect(items[0]?.title).toBe("Talk Now");
    expect(items[0]?.slug).toBe("talk-now");
    expect(items[0]?.category).toBe("Realtime");
    expect(items[0]?.shortDescription).toBe("Typed conversations.");
    expect(items[0]?.images).toEqual(["/media/one.jpg"]);
    expect(items[0]?.technologies).toEqual(["TypeScript"]);
    expect(items[0]?.githubUrl).toBe("https://github.com/swe-rezaul-karim/talk-now");
    expect(items[0]?.sortOrder).toBe(0);
  });

  it("splits editor lines and prefers featured items", () => {
    expect(listFromLines("React\nExpress\n")).toEqual(["React", "Express"]);
    expect(
      selectFeaturedProjects([
        normalizeProject({ title: "Alpha", slug: "alpha", featured: false }),
        normalizeProject({ title: "Beta", slug: "beta", featured: true }),
      ]).map((item) => item.slug),
    ).toEqual(["beta"]);
    expect(
      selectFeaturedProjects([
        normalizeProject({ title: "Alpha", slug: "alpha", featured: false }),
        normalizeProject({ title: "Beta", slug: "beta", featured: false }),
        normalizeProject({ title: "Gamma", slug: "gamma", featured: false }),
        normalizeProject({ title: "Delta", slug: "delta", featured: false }),
      ]).map((item) => item.slug),
    ).toEqual(["alpha", "beta", "gamma"]);
  });
});
