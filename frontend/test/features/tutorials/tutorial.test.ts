import { describe, expect, it } from "vitest";
import {
  findTutorial,
  formatTutorialDate,
  matchesTutorialFilters,
  matchesTutorialQuery,
  normalizeTutorialList,
  publishedTutorials,
  relatedTutorials,
} from "@/types/tutorial";

const items = normalizeTutorialList([
  {
    title: "Docker complete tutorial",
    slug: "docker-complete",
    description: "From images and containers to a deployable API stack.",
    difficulty: "Beginner",
    duration: "4 hours",
    price: "Free",
    free: true,
    skill: "Docker",
    sections: [{ title: "Images", summary: "Layers and tagging." }],
    status: "published",
  },
  {
    title: "Express modules that stay maintainable",
    slug: "express-modules",
    description: "A practical layout for routes, controllers, and services.",
    difficulty: "Intermediate",
    duration: "2 hours",
    price: "Free",
    free: true,
    skill: "Node.js",
    sections: [{ title: "Why modules", summary: "Boundaries before frameworks." }],
    status: "published",
  },
  {
    title: "Draft walkthrough",
    slug: "draft-walkthrough",
    description: "Not ready for the public site yet.",
    difficulty: "Beginner",
    duration: "1 hour",
    price: "$29",
    free: false,
    skill: "Docker",
    sections: [{ title: "Notes", summary: "Still writing." }],
    status: "draft",
  },
]);

describe("tutorial helpers", () => {
  it("hides drafts from public listings and detail lookup", () => {
    expect(publishedTutorials(items).map((item) => item.slug)).toEqual([
      "docker-complete",
      "express-modules",
    ]);
    expect(findTutorial(items, "docker-complete")?.title).toBe("Docker complete tutorial");
    expect(findTutorial(items, "draft-walkthrough")).toBeUndefined();
  });

  it("matches title, skill, and section names in search", () => {
    expect(items.filter((item) => matchesTutorialQuery(item, "docker")).map((item) => item.slug)).toEqual([
      "docker-complete",
      "draft-walkthrough",
    ]);
    expect(items.filter((item) => matchesTutorialQuery(item, "boundaries")).map((item) => item.slug)).toEqual([
      "express-modules",
    ]);
  });

  it("filters by difficulty, skill, access, and status", () => {
    expect(
      items
        .filter((item) =>
          matchesTutorialFilters(item, {
            query: "",
            difficulty: "Beginner",
            skill: "",
            access: "",
            status: "published",
          }),
        )
        .map((item) => item.slug),
    ).toEqual(["docker-complete"]);
    expect(
      items
        .filter((item) =>
          matchesTutorialFilters(item, {
            query: "",
            difficulty: "",
            skill: "Node.js",
            access: "",
            status: "",
          }),
        )
        .map((item) => item.slug),
    ).toEqual(["express-modules"]);
    expect(
      items
        .filter((item) =>
          matchesTutorialFilters(item, {
            query: "",
            difficulty: "",
            skill: "",
            access: "premium",
            status: "",
          }),
        )
        .map((item) => item.slug),
    ).toEqual(["draft-walkthrough"]);
  });

  it("prefers related tutorials with the same skill or difficulty", () => {
    const docker = items[0]!;
    expect(relatedTutorials(docker, items).map((item) => item.slug)).toEqual(["express-modules"]);
  });

  it("formats published dates for the public page", () => {
    expect(formatTutorialDate("2026-08-01")).toBe("1 Aug 2026");
    expect(formatTutorialDate("")).toBe("");
  });
});
