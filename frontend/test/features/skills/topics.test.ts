import { describe, expect, it } from "vitest";
import {
  findUniqueTopicBySlug,
  groupTopicsBySkill,
  matchesTopicFilters,
  matchesTopicQuery,
  normalizeTopicList,
  topicBodyParagraphs,
  topicCanonicalPath,
} from "@/types/topics";

describe("topic helpers", () => {
  it("groups published topics by skill", () => {
    const items = normalizeTopicList([
      {
        skill: "Java",
        skillSlug: "java",
        field: "Backend Development",
        fieldSlug: "backend-development",
        title: "OOP",
        slug: "oop",
        summary: "Encapsulation, composition, and domain modeling.",
        overview: "",
        relatedBlogSlugs: [],
        relatedTutorialSlugs: [],
        relatedCourseSlugs: [],
        published: true,
      },
      {
        skill: "Java",
        skillSlug: "java",
        field: "Backend Development",
        fieldSlug: "backend-development",
        title: "Collections",
        slug: "collections",
        summary: "Lists, maps, and data shaping at the service layer.",
        overview: "",
        relatedBlogSlugs: [],
        relatedTutorialSlugs: [],
        relatedCourseSlugs: [],
        published: true,
      },
    ]);

    const chapters = groupTopicsBySkill(items);
    expect(chapters).toHaveLength(1);
    expect(chapters[0]?.skillSlug).toBe("java");
    expect(chapters[0]?.topics.map((item) => item.slug)).toEqual(["oop", "collections"]);
  });

  it("matches title, skill, and slug in search", () => {
    const items = normalizeTopicList([
      {
        skill: "Java",
        skillSlug: "java",
        field: "Backend Development",
        fieldSlug: "backend-development",
        title: "OOP",
        slug: "oop",
        summary: "Encapsulation, composition, and domain modeling.",
        overview: "",
        relatedBlogSlugs: [],
        relatedTutorialSlugs: [],
        relatedCourseSlugs: [],
        published: true,
      },
      {
        skill: "React",
        skillSlug: "react",
        field: "Frontend Development",
        fieldSlug: "frontend-development",
        title: "Hooks",
        slug: "hooks",
        summary: "State and effects in function components.",
        overview: "",
        relatedBlogSlugs: [],
        relatedTutorialSlugs: [],
        relatedCourseSlugs: [],
        published: true,
      },
    ]);

    expect(items.filter((item) => matchesTopicQuery(item, "java"))).toHaveLength(1);
    expect(items.filter((item) => matchesTopicQuery(item, "hooks"))[0]?.slug).toBe("hooks");
    expect(items.filter((item) => matchesTopicQuery(item, "frontend"))).toHaveLength(1);
    expect(items.filter((item) => matchesTopicQuery(item, "xyz"))).toHaveLength(0);
    expect(items.filter((item) => matchesTopicQuery(item, "  "))).toHaveLength(2);
  });

  it("filters by skill and publication status", () => {
    const items = normalizeTopicList([
      {
        skill: "Java",
        skillSlug: "java",
        field: "Backend Development",
        fieldSlug: "backend-development",
        title: "OOP",
        slug: "oop",
        summary: "Encapsulation, composition, and domain modeling.",
        overview: "",
        relatedBlogSlugs: [],
        relatedTutorialSlugs: [],
        relatedCourseSlugs: [],
        published: true,
      },
      {
        skill: "Docker",
        skillSlug: "docker",
        field: "DevOps",
        fieldSlug: "devops",
        title: "Images",
        slug: "images",
        summary: "Lean Dockerfiles and reproducible builds.",
        overview: "",
        relatedBlogSlugs: [],
        relatedTutorialSlugs: [],
        relatedCourseSlugs: [],
        published: false,
      },
    ]);

    expect(
      items.filter((item) => matchesTopicFilters(item, { query: "", skill: "Docker", status: "all" })),
    ).toHaveLength(1);
    expect(
      items.filter((item) =>
        matchesTopicFilters(item, { query: "", skill: "", status: "draft" }),
      )[0]?.slug,
    ).toBe("images");
    expect(
      items.filter((item) =>
        matchesTopicFilters(item, { query: "oop", skill: "Docker", status: "all" }),
      ),
    ).toHaveLength(0);
  });

  it("resolves a unique published slug and splits body text", () => {
    const items = normalizeTopicList([
      {
        skill: "Java",
        skillSlug: "java",
        field: "Backend Development",
        fieldSlug: "backend-development",
        title: "OOP",
        slug: "oop",
        summary: "Encapsulation, composition, and domain modeling.",
        overview: "",
        body: "Keep invariants on the entity.\n\nControllers translate HTTP.",
        relatedBlogSlugs: [],
        relatedTutorialSlugs: [],
        relatedCourseSlugs: [],
        published: true,
      },
      {
        skill: "Java",
        skillSlug: "java",
        field: "Backend Development",
        fieldSlug: "backend-development",
        title: "Draft",
        slug: "draft",
        summary: "Not public yet.",
        overview: "",
        relatedBlogSlugs: [],
        relatedTutorialSlugs: [],
        relatedCourseSlugs: [],
        published: false,
      },
    ]);

    expect(findUniqueTopicBySlug(items, "oop")?.title).toBe("OOP");
    expect(findUniqueTopicBySlug(items, "draft")).toBeUndefined();
    expect(topicCanonicalPath(items[0]!)).toBe("/topics/java/oop");
    expect(topicBodyParagraphs(items[0]!.body ?? "")).toEqual([
      "Keep invariants on the entity.",
      "Controllers translate HTTP.",
    ]);
  });
});
