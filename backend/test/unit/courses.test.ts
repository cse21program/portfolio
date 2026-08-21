import { describe, expect, it } from "vitest";
import { defaultCourses } from "../../src/modules/courses/courses.seed";
import {
  parseCourseModules,
  relatedCourses,
  stripLessonContent,
  type CourseRecord,
} from "../../src/modules/courses/courses.types";

const spring: CourseRecord = {
  id: "1",
  title: "Production-grade Spring Boot",
  slug: "spring-boot-masterclass",
  subtitle: "APIs and deployment.",
  description: "Spring services that leave a laptop.",
  overview: [],
  thumbnailUrl: null,
  promoVideoUrl: null,
  instructor: "Rezaul Karim",
  category: "Backend",
  skill: "Spring Boot",
  difficulty: "Intermediate",
  language: "English",
  duration: "18 hours",
  requirements: [],
  outcomes: [],
  audience: [],
  price: "$149",
  salePrice: "$99",
  currency: "USD",
  free: false,
  featured: true,
  certificateAvailable: true,
  relatedSkillSlugs: [],
  relatedTutorialSlugs: [],
  relatedCourseSlugs: [],
  modules: [],
  status: "published",
  publishedAt: "2026-04-12",
  seoTitle: "",
  seoDescription: "",
  canonicalUrl: "",
  sortOrder: 0,
};

describe("course helpers", () => {
  it("seeds every lesson with type-appropriate content", () => {
    expect(defaultCourses.map((item) => item.slug)).toEqual([
      "spring-boot-masterclass",
      "production-docker",
    ]);
    const kinds = new Set<string>();
    for (const course of defaultCourses) {
      expect(course.modules.length).toBeGreaterThan(0);
      for (const courseModule of course.modules) {
        expect(courseModule.lessons.length, `${course.slug} / ${courseModule.title}`).toBeGreaterThan(0);
        for (const lesson of courseModule.lessons) {
          kinds.add(lesson.kind);
          if (lesson.kind === "quiz") {
            expect(lesson.quiz.questions.length, `${course.slug} / ${lesson.title}`).toBeGreaterThan(0);
          } else if (lesson.kind === "assignment") {
            expect(lesson.assignment.brief.length, `${course.slug} / ${lesson.title}`).toBeGreaterThan(0);
          } else if (lesson.kind === "pdf") {
            expect(lesson.pdfs.length, `${course.slug} / ${lesson.title}`).toBeGreaterThan(0);
          } else {
            expect(lesson.body.length, `${course.slug} / ${lesson.title}`).toBeGreaterThan(0);
          }
        }
      }
    }
    expect(kinds.has("quiz")).toBe(true);
    expect(kinds.has("assignment")).toBe(true);
    expect(kinds.has("pdf")).toBe(true);
    expect(
      defaultCourses[0]?.modules.some((courseModule) =>
        courseModule.lessons.some((lesson) => lesson.codeSnippets.length > 0),
      ),
    ).toBe(true);
    expect(defaultCourses[0]?.modules[0]?.lessons[0]?.body[0]).toContain(
      "A Spring Boot service that will last more than a weekend",
    );
  });

  it("parses modules from title-only lessons", () => {
    expect(
      parseCourseModules([{ title: "Foundations", lessons: ["Images", "Containers"] }]),
    ).toEqual([
      {
        title: "Foundations",
        summary: "",
        lessons: [
          {
            kind: "text",
            title: "Images",
            summary: "",
            body: [],
            videoUrl: null,
            images: [],
            codeSnippets: [],
            resources: [],
            downloads: [],
            pdfs: [],
            quiz: { passingScore: 70, questions: [] },
            assignment: { brief: [], requirements: [], submission: "none", dueNote: "" },
            published: true,
          },
          {
            kind: "text",
            title: "Containers",
            summary: "",
            body: [],
            videoUrl: null,
            images: [],
            codeSnippets: [],
            resources: [],
            downloads: [],
            pdfs: [],
            quiz: { passingScore: 70, questions: [] },
            assignment: { brief: [], requirements: [], submission: "none", dueNote: "" },
            published: true,
          },
        ],
      },
    ]);
  });

  it("infers quiz, pdf, and assignment kinds from stored JSON", () => {
    const parsed = parseCourseModules([
      {
        title: "Checks",
        lessons: [
          {
            title: "Status codes",
            quiz: {
              questions: [
                {
                  prompt: "Missing id?",
                  choices: ["404", "500"],
                  answerIndex: 0,
                },
              ],
            },
          },
          {
            title: "Runbook",
            pdfs: [{ label: "Notes", url: "https://example.com/notes.pdf" }],
          },
          {
            title: "Ship it",
            assignment: { brief: ["Write the deny test."], submission: "link" },
          },
        ],
      },
    ]);
    expect(parsed[0]?.lessons.map((lesson) => lesson.kind)).toEqual(["quiz", "pdf", "assignment"]);
  });

  it("prefers related courses with the same skill, category, or difficulty", () => {
    const related = relatedCourses(spring, [
      spring,
      { ...spring, id: "2", slug: "jpa-workshop", title: "JPA", skill: "Spring Boot" },
      { ...spring, id: "3", slug: "docker", title: "Docker", difficulty: "Beginner", skill: "Docker", category: "DevOps" },
      { ...spring, id: "4", slug: "draft", title: "Draft", status: "draft" },
    ]);

    expect(related.map((item) => item.slug)).toEqual(["jpa-workshop", "docker"]);
  });

  it("strips lesson bodies, media, and quiz answers for catalog views", () => {
    const stripped = stripLessonContent({
      ...spring,
      modules: [
        {
          title: "Fundamentals",
          summary: "Packages.",
          lessons: [
            {
              kind: "quiz",
              title: "API errors",
              summary: "Status codes.",
              body: ["Secret notes"],
              videoUrl: "https://example.com/video.mp4",
              images: ["https://example.com/a.png"],
              codeSnippets: [{ label: "App", language: "java", code: "class App {}" }],
              resources: [{ label: "Docs", url: "https://example.com" }],
              downloads: [],
              pdfs: [{ label: "PDF", url: "https://example.com/a.pdf", fileName: "a.pdf" }],
              quiz: {
                passingScore: 70,
                questions: [{ prompt: "Q", choices: ["A", "B"], answerIndex: 1, explanation: "B" }],
              },
              assignment: { brief: ["Do the work"], requirements: ["Tests"], submission: "link", dueNote: "" },
            },
          ],
        },
      ],
    });

    expect(stripped.modules[0]?.lessons[0]).toMatchObject({
      kind: "quiz",
      title: "API errors",
      summary: "Status codes.",
      body: [],
      videoUrl: null,
      images: [],
      codeSnippets: [],
      pdfs: [],
      quiz: { questions: [] },
      assignment: { brief: [], requirements: [] },
    });
  });
});
