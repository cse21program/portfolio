import { describe, expect, it } from "vitest";
import {
  estimateReadingTime,
  findArticle,
  formatBlogDate,
  matchesArticleFilters,
  matchesArticleQuery,
  normalizeArticleList,
  publishedArticles,
  readingLabel,
  relatedArticles,
} from "@/types/blog";

const items = normalizeArticleList([
  {
    title: "JWT authentication",
    slug: "jwt-authentication",
    excerpt: "Access tokens and refresh tokens.",
    content: ["Keep authorization on the server."],
    category: "Backend",
    tags: ["JWT", "Security"],
    skill: "Spring Boot",
    author: "Rezaul Karim",
    publishedAt: "2026-07-12",
    readingTime: "8 min",
    status: "published",
  },
  {
    title: "Docker networking",
    slug: "docker-networking",
    excerpt: "Bridge networks and published ports.",
    content: ["Containers do not share localhost."],
    category: "DevOps",
    tags: ["Docker"],
    skill: "Docker",
    topic: "Images",
    author: "Rezaul Karim",
    publishedAt: "2026-06-02",
    readingTime: "6 min",
    status: "published",
  },
  {
    title: "Draft notes",
    slug: "draft-notes",
    excerpt: "Not ready for the public site yet.",
    content: ["Still writing."],
    category: "Backend",
    tags: ["Draft"],
    skill: "Spring Boot",
    author: "Rezaul Karim",
    publishedAt: "2026-08-01",
    readingTime: "2 min",
    status: "draft",
  },
]);

describe("blog helpers", () => {
  it("hides drafts from public listings and detail lookup", () => {
    expect(publishedArticles(items).map((item) => item.slug)).toEqual([
      "jwt-authentication",
      "docker-networking",
    ]);
    expect(findArticle(items, "jwt-authentication")?.title).toBe("JWT authentication");
    expect(findArticle(items, "draft-notes")).toBeUndefined();
  });

  it("matches title, skill, and tags in search", () => {
    expect(items.filter((item) => matchesArticleQuery(item, "jwt")).map((item) => item.slug)).toEqual([
      "jwt-authentication",
    ]);
    expect(items.filter((item) => matchesArticleQuery(item, "docker")).map((item) => item.slug)).toEqual([
      "docker-networking",
    ]);
  });

  it("filters by category, skill, tag, and status", () => {
    expect(
      items
        .filter((item) =>
          matchesArticleFilters(item, {
            query: "",
            category: "Backend",
            skill: "",
            tag: "",
            status: "published",
          }),
        )
        .map((item) => item.slug),
    ).toEqual(["jwt-authentication"]);
    expect(
      items
        .filter((item) =>
          matchesArticleFilters(item, {
            query: "",
            category: "",
            skill: "",
            tag: "Docker",
            status: "",
          }),
        )
        .map((item) => item.slug),
    ).toEqual(["docker-networking"]);
    expect(
      items
        .filter((item) =>
          matchesArticleFilters(item, {
            query: "",
            category: "",
            skill: "",
            tag: "",
            status: "draft",
          }),
        )
        .map((item) => item.slug),
    ).toEqual(["draft-notes"]);
    expect(
      items
        .filter((item) =>
          matchesArticleFilters(item, {
            query: "",
            category: "",
            skill: "",
            tag: "",
            status: "published",
            topic: "Images",
          }),
        )
        .map((item) => item.slug),
    ).toEqual(["docker-networking"]);
  });

  it("prefers related posts in the same category or skill", () => {
    const jwt = items[0]!;
    expect(relatedArticles(jwt, items).map((item) => item.slug)).toEqual(["docker-networking"]);
  });

  it("estimates reading time from word count", () => {
    expect(estimateReadingTime(["Hello world"])).toBe("1 min");
  });

  it("formats dates and reading labels for the public page", () => {
    expect(formatBlogDate("2026-07-12")).toBe("12 Jul 2026");
    expect(formatBlogDate("")).toBe("");
    expect(readingLabel("8 min")).toBe("8 min read");
    expect(readingLabel("8 min read")).toBe("8 min read");
  });
});
