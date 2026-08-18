import request from "supertest";
import { describe, expect, it } from "vitest";
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

const sampleTopic = {
  skill: "Java",
  title: "OOP",
  slug: "oop",
  summary: "Encapsulation, composition, and domain modeling.",
  overview: "Keep business rules close to the model.",
  body: "Prefer composition over deep inheritance.",
  images: [],
  videoUrl: null,
  embedVideoUrl: null,
  codeSnippets: [{ label: "Record", language: "java", code: "record User(String id) {}" }],
  resources: [{ label: "Oracle OOP", url: "https://docs.oracle.com/javase/tutorial/java/concepts/" }],
  externalLinks: [],
  relatedBlogSlugs: ["jwt-authentication"],
  relatedTutorialSlugs: [],
  relatedCourseSlugs: [],
  relatedProjectSlugs: ["portfolio-platform"],
  relatedCertificateSlugs: [],
  published: true,
  seoTitle: "OOP",
  seoDescription: "Object-oriented design notes.",
};

describe("topics API", () => {
  it("seeds default records on the first public read", async () => {
    const response = await request(app).get("/api/v1/topics");

    expect(response.status).toBe(200);
    expect(response.body.data.topics.length).toBeGreaterThan(0);
    expect(response.body.data.topics[0].slug).toBe("oop");
    expect(response.body.data.topics[0].skillSlug).toBe("java");
    expect(response.body.data.topics[0].skill).toBe("Java");
  });

  it("returns a topic by skill and topic slug", async () => {
    const response = await request(app).get("/api/v1/topics/java/oop");

    expect(response.status).toBe(200);
    expect(response.body.data.topic.title).toBe("OOP");
    expect(response.body.data.topic.skillSlug).toBe("java");
    expect(response.body.data.topic.body).toContain("Keep invariants");
    expect(response.body.data.topic.codeSnippets[0].language).toBe("java");
  });

  it("returns a unique topic slug", async () => {
    const response = await request(app).get("/api/v1/topics/oop");

    expect(response.status).toBe(200);
    expect(response.body.data.topic.slug).toBe("oop");
    expect(response.body.data.topic.skillSlug).toBe("java");
  });

  it("returns 404 for an unknown slug", async () => {
    const response = await request(app).get("/api/v1/topics/java/missing-topic");
    expect(response.status).toBe(404);
  });

  it("rejects unauthenticated updates", async () => {
    const response = await request(app).put("/api/v1/topics").send({ topics: [sampleTopic] });
    expect(response.status).toBe(401);
  });

  it("rejects customer updates", async () => {
    const agent = await registerCustomer();
    const response = await agent.put("/api/v1/topics").send({ topics: [sampleTopic] });
    expect(response.status).toBe(403);
  });

  it("lets an admin replace the list in order", async () => {
    const agent = await registerAdmin();
    await request(app).get("/api/v1/skills");

    const updated = await agent.put("/api/v1/topics").send({
      topics: [
        sampleTopic,
        {
          ...sampleTopic,
          skill: "Docker",
          title: "Images",
          slug: "images",
          summary: "Lean Dockerfiles and reproducible builds.",
          codeSnippets: [],
          resources: [],
          relatedBlogSlugs: [],
          relatedProjectSlugs: [],
        },
      ],
    });

    expect(updated.status).toBe(200);
    expect(updated.body.data.topics).toHaveLength(2);
    expect(updated.body.data.topics[0].slug).toBe("oop");
    expect(updated.body.data.topics[0].codeSnippets[0].language).toBe("java");
    expect(updated.body.data.topics[1].slug).toBe("images");
    expect(updated.body.data.topics[1].skillSlug).toBe("docker");

    const listed = await request(app).get("/api/v1/topics");
    expect(listed.body.data.topics.map((item: { slug: string }) => item.slug)).toEqual([
      "oop",
      "images",
    ]);
  });

  it("rejects duplicate topic slugs within a skill", async () => {
    const agent = await registerAdmin();
    await request(app).get("/api/v1/skills");
    const duplicates = await agent.put("/api/v1/topics").send({
      topics: [sampleTopic, { ...sampleTopic, title: "Copy" }],
    });
    expect(duplicates.status).toBe(400);
  });

  it("hides unpublished topics from public detail reads", async () => {
    const agent = await registerAdmin();
    await request(app).get("/api/v1/skills");
    const hidden = await agent.put("/api/v1/topics").send({
      topics: [{ ...sampleTopic, published: false }],
    });
    expect(hidden.status).toBe(200);

    const response = await request(app).get("/api/v1/topics/java/oop");
    expect(response.status).toBe(404);
  });
});
