import { describe, expect, it } from "vitest";
import { estimateReadingTime, relatedBlogs } from "../../src/modules/blogs/blogs.types";

describe("blog helpers", () => {
  it("estimates reading time from word count", () => {
    expect(estimateReadingTime(["Hello world"])).toBe("1 min");
  });

  it("prefers related posts in the same category or skill", () => {
    const jwt = {
      id: "1",
      title: "JWT",
      slug: "jwt",
      excerpt: "Tokens.",
      content: ["Keep auth on the server."],
      featuredImageUrl: null,
      author: "Rezaul Karim",
      category: "Backend",
      tags: ["JWT"],
      skill: "Spring Boot",
      topic: "",
      readingTime: "8 min",
      publishedAt: "2026-07-12",
      status: "published",
      seoTitle: "",
      seoDescription: "",
      canonicalUrl: "",
      sortOrder: 0,
    };
    const related = relatedBlogs(jwt, [
      jwt,
      { ...jwt, id: "2", slug: "rest", title: "REST", skill: "Spring Boot" },
      { ...jwt, id: "3", slug: "docker", title: "Docker", category: "DevOps", skill: "Docker" },
      { ...jwt, id: "4", slug: "draft", title: "Draft", status: "draft" },
    ]);

    expect(related.map((item) => item.slug)).toEqual(["rest", "docker"]);
  });
});
