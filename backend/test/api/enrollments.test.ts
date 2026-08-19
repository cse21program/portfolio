import request from "supertest";
import { describe, expect, it } from "vitest";
import { getOutbox } from "../../src/common/mailer/mailer";
import { createApp } from "../../src/app";

const app = createApp();

async function registerAdmin() {
  const agent = request.agent(app);
  const created = await agent.post("/api/v1/auth/register").send({
    name: "Owner",
    email: "admin@example.com",
    password: "password123",
  });
  expect(created.status).toBe(201);
  return agent;
}

async function registerCustomer(email = "customer@example.com") {
  const agent = request.agent(app);
  const created = await agent.post("/api/v1/auth/register").send({
    name: "Student",
    email,
    password: "password123",
  });
  expect(created.status).toBe(201);
  return agent;
}

const catalogCourse = {
  title: "HTTP from zero",
  slug: "http-from-zero",
  subtitle: "Requests, status codes, and APIs.",
  description: "A short free course that covers how HTTP actually works on the wire.",
  overview: ["Read a request line and know what a 400 means."],
  difficulty: "Beginner",
  requirements: [],
  outcomes: ["Name the parts of an HTTP request"],
  audience: ["Anyone starting backend"],
  duration: "3 hours",
  thumbnailUrl: null,
  promoVideoUrl: null,
  instructor: "Rezaul Karim",
  category: "Backend",
  skill: "HTTP",
  language: "English",
  relatedSkillSlugs: [],
  relatedTutorialSlugs: [],
  relatedCourseSlugs: [],
  price: "Free",
  salePrice: "",
  currency: "USD",
  free: true,
  featured: false,
  certificateAvailable: false,
  modules: [
    {
      title: "Foundations",
      summary: "The request and the response.",
      lessons: [
        {
          title: "Status codes",
          summary: "4xx is the client; 5xx is the server.",
          kind: "text",
          body: ["A 404 means the resource is missing, not that the process crashed."],
          videoUrl: null,
          images: [],
          codeSnippets: [],
          resources: [],
          downloads: [],
        },
        {
          title: "Headers",
          summary: "Host and Content-Type.",
          kind: "text",
          body: ["Name the headers you actually rely on."],
          videoUrl: null,
          images: [],
          codeSnippets: [],
          resources: [],
          downloads: [],
        },
      ],
    },
  ],
  publishedAt: "2026-08-01",
  status: "published",
  seoTitle: "",
  seoDescription: "",
  canonicalUrl: "",
};

const premiumCourse = {
  ...catalogCourse,
  title: "Production-grade Spring Boot",
  slug: "spring-boot-masterclass",
  description: "A structured course for building Spring Boot services that survive real traffic.",
  free: false,
  price: "$149",
  salePrice: "$99",
  featured: true,
  modules: [
    {
      title: "Fundamentals",
      summary: "Packages and configuration.",
      lessons: [
        {
          title: "Application structure",
          summary: "Packages that match how the service changes.",
          kind: "text",
          body: ["Controllers stay thin. Services own the use case."],
          videoUrl: null,
          images: [],
          codeSnippets: [{ label: "Controller", language: "java", code: "class Api {}" }],
          resources: [],
          downloads: [],
          quiz: {
            passingScore: 70,
            questions: [
              {
                prompt: "Missing id?",
                choices: ["404", "500"],
                answerIndex: 0,
                explanation: "Missing is 404.",
              },
            ],
          },
        },
      ],
    },
  ],
};

async function publishCatalog(admin: ReturnType<typeof request.agent>) {
  await request(app).get("/api/v1/courses");
  const updated = await admin.put("/api/v1/courses").send({
    courses: [catalogCourse, premiumCourse],
  });
  expect(updated.status).toBe(200);
}

describe("enrollments API", () => {
  it("lets a signed-in customer self-enroll in a published free course", async () => {
    const admin = await registerAdmin();
    await publishCatalog(admin);
    const customer = await registerCustomer();

    const created = await customer.post("/api/v1/enrollments").send({ courseSlug: "http-from-zero" });
    expect(created.status).toBe(201);
    expect(created.body.data.enrollment).toMatchObject({
      courseSlug: "http-from-zero",
      status: "active",
      source: "self",
      course: { slug: "http-from-zero", free: true },
    });
    expect(getOutbox().some((item) => item.subject === "Enrolled in HTTP from zero")).toBe(true);

    const again = await customer.post("/api/v1/enrollments").send({ courseSlug: "http-from-zero" });
    expect(again.status).toBe(200);
    expect(again.body.data.enrollment.id).toBe(created.body.data.enrollment.id);

    const mine = await customer.get("/api/v1/enrollments");
    expect(mine.status).toBe(200);
    expect(mine.body.data.enrollments).toHaveLength(1);

    const detail = await customer.get("/api/v1/courses/http-from-zero");
    expect(detail.body.data.access).toEqual({
      enrolled: true,
      canReadLessons: true,
      status: "active",
    });
    expect(detail.body.data.course.modules[0].lessons[0].body[0]).toContain("A 404 means the resource is missing");
    expect(detail.body.data.progress).toMatchObject({
      lessonsTotal: 2,
      lessonsCompleted: 0,
      lessonsRemaining: 2,
      percent: 0,
      completed: false,
      currentLesson: { key: "foundations/status-codes", title: "Status codes" },
    });
  });

  it("rejects premium self-enroll and keeps lesson bodies off the public payload", async () => {
    const admin = await registerAdmin();
    await publishCatalog(admin);
    const customer = await registerCustomer();

    const denied = await customer.post("/api/v1/enrollments").send({ courseSlug: "spring-boot-masterclass" });
    expect(denied.status).toBe(400);
    expect(denied.body.error.message).toMatch(/cannot be self-enrolled/i);

    const guest = await request(app).get("/api/v1/courses/spring-boot-masterclass");
    expect(guest.body.data.access.canReadLessons).toBe(false);
    expect(guest.body.data.course.modules[0].lessons[0].body).toEqual([]);
    expect(guest.body.data.course.modules[0].lessons[0].codeSnippets).toEqual([]);
    expect(guest.body.data.course.modules[0].lessons[0].quiz.questions).toEqual([]);

    const signedIn = await customer.get("/api/v1/courses/spring-boot-masterclass");
    expect(signedIn.body.data.access.canReadLessons).toBe(false);
    expect(signedIn.body.data.course.modules[0].lessons[0].body).toEqual([]);
  });

  it("lets an admin grant a premium seat and revoke it", async () => {
    const admin = await registerAdmin();
    await publishCatalog(admin);
    const customer = await registerCustomer();

    const granted = await admin.post("/api/v1/enrollments/admin").send({
      email: "customer@example.com",
      courseSlug: "spring-boot-masterclass",
    });
    expect(granted.status).toBe(201);
    expect(granted.body.data.enrollment).toMatchObject({
      courseSlug: "spring-boot-masterclass",
      source: "admin",
      status: "active",
      user: { email: "customer@example.com" },
    });
    expect(getOutbox().some((item) => item.subject === "Your seat in Production-grade Spring Boot")).toBe(true);

    const detail = await customer.get("/api/v1/courses/spring-boot-masterclass");
    expect(detail.body.data.access.canReadLessons).toBe(true);
    expect(detail.body.data.course.modules[0].lessons[0].body[0]).toContain("Controllers stay thin");
    expect(detail.body.data.course.modules[0].lessons[0].quiz.questions[0].answerIndex).toBe(0);

    const listed = await admin.get("/api/v1/enrollments/admin");
    expect(listed.body.data.enrollments).toHaveLength(1);

    const revoked = await admin.delete(`/api/v1/enrollments/admin/${granted.body.data.enrollment.id}`);
    expect(revoked.status).toBe(200);
    expect(revoked.body.data.enrollment.status).toBe("canceled");

    const locked = await customer.get("/api/v1/courses/spring-boot-masterclass");
    expect(locked.body.data.access).toEqual({
      enrolled: false,
      canReadLessons: false,
      status: "canceled",
    });
    expect(locked.body.data.course.modules[0].lessons[0].body).toEqual([]);
  });

  it("lets a customer leave a free course and locks the reader again", async () => {
    const admin = await registerAdmin();
    await publishCatalog(admin);
    const customer = await registerCustomer();

    await customer.post("/api/v1/enrollments").send({ courseSlug: "http-from-zero" });
    const left = await customer.delete("/api/v1/enrollments/http-from-zero");
    expect(left.status).toBe(200);
    expect(left.body.data.enrollment.status).toBe("canceled");

    const detail = await customer.get("/api/v1/courses/http-from-zero");
    expect(detail.body.data.access.canReadLessons).toBe(false);
    expect(detail.body.data.course.modules[0].lessons[0].body).toEqual([]);

    const again = await customer.post("/api/v1/enrollments").send({ courseSlug: "http-from-zero" });
    expect(again.status).toBe(201);
    expect(again.body.data.enrollment.status).toBe("active");
  });

  it("rejects unauthenticated enroll and unknown or unpublished courses", async () => {
    const admin = await registerAdmin();
    await publishCatalog(admin);
    await admin.put("/api/v1/courses").send({
      courses: [
        catalogCourse,
        { ...catalogCourse, slug: "draft-http", title: "Draft HTTP", status: "draft", description: "Not ready yet." },
      ],
    });

    const guest = await request(app).post("/api/v1/enrollments").send({ courseSlug: "http-from-zero" });
    expect(guest.status).toBe(401);

    const customer = await registerCustomer();
    const missing = await customer.post("/api/v1/enrollments").send({ courseSlug: "missing-course" });
    expect(missing.status).toBe(404);

    const draft = await customer.post("/api/v1/enrollments").send({ courseSlug: "draft-http" });
    expect(draft.status).toBe(404);

    const forbidden = await customer.get("/api/v1/enrollments/admin");
    expect(forbidden.status).toBe(403);
  });

  it("lets an admin read premium lesson bodies without an enrollment", async () => {
    const admin = await registerAdmin();
    await publishCatalog(admin);

    const detail = await admin.get("/api/v1/courses/spring-boot-masterclass");
    expect(detail.body.data.access.canReadLessons).toBe(true);
    expect(detail.body.data.access.enrolled).toBe(false);
    expect(detail.body.data.course.modules[0].lessons[0].body[0]).toContain("Controllers stay thin");
  });

  it("lets an enrolled student mark lessons complete and updates dashboard progress", async () => {
    const admin = await registerAdmin();
    await publishCatalog(admin);
    const customer = await registerCustomer();
    await customer.post("/api/v1/enrollments").send({ courseSlug: "http-from-zero" });

    const guest = await request(app)
      .put("/api/v1/enrollments/http-from-zero/progress")
      .send({ lessonKey: "foundations/status-codes", completed: true });
    expect(guest.status).toBe(401);

    const locked = await customer
      .put("/api/v1/enrollments/spring-boot-masterclass/progress")
      .send({ lessonKey: "fundamentals/application-structure", completed: true });
    expect(locked.status).toBe(403);

    const unknown = await customer
      .put("/api/v1/enrollments/http-from-zero/progress")
      .send({ lessonKey: "foundations/missing", completed: true });
    expect(unknown.status).toBe(400);

    const saved = await customer
      .put("/api/v1/enrollments/http-from-zero/progress")
      .send({ lessonKey: "foundations/status-codes", completed: true });
    expect(saved.status).toBe(200);
    expect(saved.body.data.enrollment.progress).toMatchObject({
      lessonsCompleted: 1,
      lessonsRemaining: 1,
      percent: 50,
      completed: false,
      completedKeys: ["foundations/status-codes"],
      currentLesson: { key: "foundations/headers", title: "Headers" },
    });

    const again = await customer
      .put("/api/v1/enrollments/http-from-zero/progress")
      .send({ lessonKey: "foundations/status-codes", completed: true });
    expect(again.status).toBe(200);
    expect(again.body.data.enrollment.progress.lessonsCompleted).toBe(1);

    const detail = await customer.get("/api/v1/courses/http-from-zero");
    expect(detail.body.data.progress.percent).toBe(50);
    expect(detail.body.data.progress.currentLesson.title).toBe("Headers");

    await customer
      .put("/api/v1/enrollments/http-from-zero/progress")
      .send({ lessonKey: "foundations/headers", completed: true });
    const done = await customer.get("/api/v1/enrollments");
    expect(done.body.data.enrollments[0].progress).toMatchObject({
      lessonsCompleted: 2,
      lessonsRemaining: 0,
      percent: 100,
      completed: true,
    });

    const undone = await customer
      .put("/api/v1/enrollments/http-from-zero/progress")
      .send({ lessonKey: "foundations/headers", completed: false });
    expect(undone.body.data.enrollment.progress.percent).toBe(50);
  });
});
