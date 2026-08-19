import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../src/app";
import { defaultCourses } from "../../src/modules/courses/courses.types";

const app = createApp();

async function registerAdmin() {
  const agent = request.agent(app);
  const created = await agent.post("/api/v1/auth/register").send({
    name: "Owner",
    email: "admin@example.com",
    password: "password123",
  });
  expect(created.status).toBe(201);
  expect(created.body.data.user.role).toBe("ADMIN");
  return agent;
}

async function registerCustomer() {
  const agent = request.agent(app);
  const created = await agent.post("/api/v1/auth/register").send({
    name: "Student",
    email: "customer@example.com",
    password: "password123",
  });
  expect(created.status).toBe(201);
  expect(created.body.data.user.role).toBe("CUSTOMER");
  return agent;
}

const sampleCourse = {
  title: "Production-grade Spring Boot",
  slug: "spring-boot-masterclass",
  subtitle: "APIs, security, persistence, and deployment.",
  description: "A structured course for building Spring Boot services that survive real traffic.",
  overview: ["Design resources, reject bad input, and ship an image with health checks."],
  difficulty: "Intermediate",
  requirements: ["Java 21"],
  outcomes: ["Design REST resources with consistent errors"],
  audience: ["Backend engineers"],
  duration: "18 hours",
  thumbnailUrl: null,
  promoVideoUrl: null,
  instructor: "Rezaul Karim",
  category: "Backend",
  skill: "Spring Boot",
  language: "English",
  relatedSkillSlugs: [],
  relatedTutorialSlugs: [],
  relatedCourseSlugs: [],
  price: "$149",
  salePrice: "$99",
  currency: "USD",
  free: false,
  featured: true,
  certificateAvailable: true,
  modules: [
    {
      title: "Fundamentals",
      summary: "Packages and configuration.",
      lessons: [
        {
          title: "Application structure",
          summary: "Packages that match how the service changes.",
          body: ["A Spring Boot service that will last needs a package layout people can find."],
          videoUrl: null,
          images: [],
          codeSnippets: [],
          resources: [],
          downloads: [],
        },
      ],
    },
  ],
  publishedAt: "2026-04-12",
  status: "published",
  seoTitle: "Production-grade Spring Boot",
  seoDescription: "APIs, security, persistence, and deployment.",
  canonicalUrl: "",
};

describe("courses API", () => {
  it("seeds default records on the first public read", async () => {
    const response = await request(app).get("/api/v1/courses");

    expect(response.status).toBe(200);
    expect(response.body.data.courses).toHaveLength(defaultCourses.length);
    expect(response.body.data.courses[0].slug).toBe("spring-boot-masterclass");
    expect(response.body.data.courses[0].status).toBe("published");
    expect(response.body.data.courses[0].featured).toBe(true);
    expect(response.body.data.courses[0].salePrice).toBe("$99");
    expect(response.body.data.courses[0].modules[0].title).toBe("Fundamentals");
    expect(response.body.data.courses[0].modules[0].lessons[0].title).toBe("Application structure");
    expect(response.body.data.courses[0].modules[0].lessons[0].body).toEqual([]);
    expect(
      response.body.data.courses[0].modules.some((courseModule: { lessons: Array<{ kind: string; quiz?: { questions: unknown[] } }> }) =>
        courseModule.lessons.some((lesson) => lesson.kind === "quiz" && lesson.quiz?.questions.length === 0),
      ),
    ).toBe(true);
    expect(response.body.data.courses[1]).toMatchObject({
      slug: "production-docker",
      free: false,
      price: "$79",
    });
  });

  it("returns a published course and related catalog items by slug", async () => {
    const response = await request(app).get("/api/v1/courses/spring-boot-masterclass");

    expect(response.status).toBe(200);
    expect(response.body.data.course.title).toContain("Spring Boot");
    expect(response.body.data.related.length).toBeGreaterThan(0);
    expect(
      response.body.data.related.every((item: { slug: string }) => item.slug !== "spring-boot-masterclass"),
    ).toBe(true);
    expect(response.body.data.access).toEqual({
      enrolled: false,
      canReadLessons: false,
      status: null,
    });
    expect(response.body.data.progress).toBeNull();
    expect(response.body.data.course.modules[0].lessons[0].body).toEqual([]);
  });

  it("returns 404 for an unknown slug", async () => {
    const response = await request(app).get("/api/v1/courses/missing-course");
    expect(response.status).toBe(404);
  });

  it("rejects unauthenticated updates", async () => {
    const response = await request(app).put("/api/v1/courses").send({ courses: [sampleCourse] });
    expect(response.status).toBe(401);
  });

  it("rejects customer updates", async () => {
    const agent = await registerCustomer();
    const response = await agent.put("/api/v1/courses").send({ courses: [sampleCourse] });
    expect(response.status).toBe(403);
  });

  it("lets an admin replace the list in order", async () => {
    const agent = await registerAdmin();
    const updated = await agent.put("/api/v1/courses").send({
      courses: [
        sampleCourse,
        {
          ...sampleCourse,
          title: "Draft catalog item",
          slug: "draft-catalog-item",
          description: "Not ready for the public site yet.",
          status: "draft",
          featured: false,
        },
      ],
    });

    expect(updated.status).toBe(200);
    expect(updated.body.data.courses).toHaveLength(2);
    expect(updated.body.data.courses[0].slug).toBe("spring-boot-masterclass");
    expect(updated.body.data.courses[1].status).toBe("draft");

    const listed = await request(app).get("/api/v1/courses");
    expect(listed.body.data.courses.map((item: { slug: string }) => item.slug)).toEqual([
      "spring-boot-masterclass",
    ]);

    const studio = await agent.get("/api/v1/courses");
    expect(studio.body.data.courses.map((item: { slug: string }) => item.slug)).toEqual([
      "spring-boot-masterclass",
      "draft-catalog-item",
    ]);
    expect(studio.body.data.courses[0].modules[0].lessons[0].body[0]).toContain(
      "A Spring Boot service that will last needs a package layout",
    );

    const hidden = await request(app).get("/api/v1/courses/draft-catalog-item");
    expect(hidden.status).toBe(404);
  });

  it("rejects duplicate slugs", async () => {
    const agent = await registerAdmin();
    const duplicates = await agent.put("/api/v1/courses").send({
      courses: [sampleCourse, { ...sampleCourse, title: "Copy" }],
    });
    expect(duplicates.status).toBe(400);
  });
});
