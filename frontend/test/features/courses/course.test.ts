import { describe, expect, it } from "vitest";
import {
  findCourse,
  flattenLessons,
  inferLessonKind,
  lessonAnchor,
  matchesCourseFilters,
  matchesCourseQuery,
  normalizeCourseList,
  parseRichBody,
  publishedCourses,
  relatedCourses,
} from "@/types/course";

const items = normalizeCourseList([
  {
    title: "Production-grade Spring Boot",
    slug: "spring-boot-masterclass",
    subtitle: "APIs, security, persistence, and deployment.",
    description: "A structured course for building Spring Boot services.",
    difficulty: "Intermediate",
    duration: "18 hours",
    price: "$149",
    salePrice: "$99",
    free: false,
    featured: true,
    skill: "Spring Boot",
    outcomes: ["Design REST resources"],
    modules: [
      {
        title: "Fundamentals",
        lessons: [{ title: "Application structure", summary: "Packages that match the work." }],
      },
    ],
    status: "published",
  },
  {
    title: "Production Docker",
    slug: "production-docker",
    subtitle: "From laptop Compose files to images you can promote.",
    description: "Learn the Docker habits that keep APIs reproducible.",
    difficulty: "Beginner",
    duration: "8 hours",
    price: "$79",
    free: false,
    featured: true,
    skill: "Docker",
    outcomes: ["Write Dockerfiles you are willing to ship"],
    modules: [{ title: "Foundations", lessons: [{ title: "Images", summary: "Layers and tagging." }] }],
    status: "published",
  },
  {
    title: "Draft catalog item",
    slug: "draft-catalog-item",
    subtitle: "Not ready.",
    description: "Not ready for the public site yet.",
    difficulty: "Beginner",
    duration: "1 hour",
    price: "$29",
    free: false,
    featured: false,
    skill: "Docker",
    outcomes: [],
    modules: [{ title: "Notes", lessons: [{ title: "Outline", summary: "Still writing." }] }],
    status: "draft",
  },
]);

describe("course helpers", () => {
  it("hides drafts from public listings and detail lookup", () => {
    expect(publishedCourses(items).map((item) => item.slug)).toEqual([
      "spring-boot-masterclass",
      "production-docker",
    ]);
    expect(findCourse(items, "spring-boot-masterclass")?.title).toBe("Production-grade Spring Boot");
    expect(findCourse(items, "draft-catalog-item")).toBeUndefined();
  });

  it("matches title, skill, and lesson names in search", () => {
    expect(items.filter((item) => matchesCourseQuery(item, "docker")).map((item) => item.slug)).toEqual([
      "production-docker",
      "draft-catalog-item",
    ]);
    expect(items.filter((item) => matchesCourseQuery(item, "packages")).map((item) => item.slug)).toEqual([
      "spring-boot-masterclass",
    ]);
  });

  it("filters by difficulty, skill, access, and featured", () => {
    expect(
      items
        .filter((item) =>
          matchesCourseFilters(item, {
            query: "",
            difficulty: "Beginner",
            skill: "",
            access: "",
            featured: "",
            status: "published",
          }),
        )
        .map((item) => item.slug),
    ).toEqual(["production-docker"]);
    expect(
      items
        .filter((item) =>
          matchesCourseFilters(item, {
            query: "",
            difficulty: "",
            skill: "Spring Boot",
            access: "",
            featured: "",
            status: "",
          }),
        )
        .map((item) => item.slug),
    ).toEqual(["spring-boot-masterclass"]);
    expect(
      items
        .filter((item) =>
          matchesCourseFilters(item, {
            query: "",
            difficulty: "",
            skill: "",
            access: "premium",
            featured: "featured",
            status: "published",
          }),
        )
        .map((item) => item.slug),
    ).toEqual(["spring-boot-masterclass", "production-docker"]);
  });

  it("prefers related courses with the same skill or difficulty", () => {
    const spring = items[0]!;
    expect(relatedCourses(spring, items).map((item) => item.slug)).toEqual(["production-docker"]);
  });

  it("flattens lessons and builds stable anchors", () => {
    const flat = flattenLessons(items[0]!.modules);
    expect(flat).toHaveLength(1);
    expect(flat[0]?.key).toBe("fundamentals/application-structure");
    expect(lessonAnchor(flat[0]!.globalIndex, flat[0]!.lesson.title)).toBe(
      "lesson-1-application-structure",
    );
  });

  it("parses editorial marks in lesson text", () => {
    expect(
      parseRichBody([
        "## What belongs where",
        "- Controllers stay thin\n- Services own use cases",
        "> Fail closed.",
        "A normal paragraph.",
      ]),
    ).toEqual([
      { type: "heading", text: "What belongs where" },
      { type: "list", items: ["Controllers stay thin", "Services own use cases"] },
      { type: "callout", text: "Fail closed." },
      { type: "paragraph", text: "A normal paragraph." },
    ]);
  });

  it("infers lesson kinds from stored content", () => {
    expect(inferLessonKind({ quiz: { passingScore: 70, questions: [{ prompt: "Q", choices: ["A", "B"], answerIndex: 0 }] } })).toBe(
      "quiz",
    );
    expect(inferLessonKind({ pdfs: [{ label: "Notes", url: "https://example.com/a.pdf" }] })).toBe("pdf");
    expect(inferLessonKind({ assignment: { brief: ["Do the work."], requirements: [], submission: "link" } })).toBe(
      "assignment",
    );
    expect(inferLessonKind({ body: ["Hello"] })).toBe("text");
  });
});
