import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../src/app";
import { defaultProjects } from "../../src/modules/projects/projects.types";

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

const sampleProject = {
  title: "Talk Now",
  slug: "talk-now",
  shortDescription: "A TypeScript conversation product.",
  fullDescription: "Typed conversations from the start.",
  thumbnailUrl: null,
  images: [],
  demoVideoUrl: null,
  category: "Realtime product",
  technologies: ["TypeScript", "React"],
  features: ["Conversation threads"],
  architecture: "Typed client models.",
  problem: "Messaging UIs treat state as an afterthought.",
  requirements: "Keep the domain typed.",
  solution: "Model conversations as first-class entities.",
  challenges: ["Realtime UX without overbuilding."],
  solutions: ["Type the domain first."],
  lessons: ["Type the domain before the components."],
  status: "Shipped",
  startDate: "2025",
  endDate: "2025",
  githubUrl: "https://github.com/swe-rezaul-karim/talk-now",
  liveUrl: null,
  docsUrl: null,
  featured: true,
  seoTitle: "Talk Now",
  seoDescription: "A typed conversation product.",
};

describe("projects API", () => {
  it("seeds default records on the first public read", async () => {
    const response = await request(app).get("/api/v1/projects");

    expect(response.status).toBe(200);
    expect(response.body.data.projects).toHaveLength(defaultProjects.length);
    expect(response.body.data.projects[0].slug).toBe("portfolio-platform");
    expect(response.body.data.projects[0].featured).toBe(true);
  });

  it("returns a project and related case studies by slug", async () => {
    const response = await request(app).get("/api/v1/projects/portfolio-platform");

    expect(response.status).toBe(200);
    expect(response.body.data.project.title).toBe("Portfolio Platform");
    expect(response.body.data.related.length).toBeGreaterThan(0);
    expect(response.body.data.related.every((item: { slug: string }) => item.slug !== "portfolio-platform")).toBe(
      true,
    );
  });

  it("returns 404 for an unknown slug", async () => {
    const response = await request(app).get("/api/v1/projects/missing-case-study");
    expect(response.status).toBe(404);
  });

  it("rejects unauthenticated updates", async () => {
    const response = await request(app)
      .put("/api/v1/projects")
      .send({ projects: [sampleProject] });

    expect(response.status).toBe(401);
  });

  it("rejects customer updates", async () => {
    const agent = await registerCustomer();
    const response = await agent.put("/api/v1/projects").send({ projects: [sampleProject] });
    expect(response.status).toBe(403);
  });

  it("lets an admin replace the list in order", async () => {
    const agent = await registerAdmin();
    const updated = await agent.put("/api/v1/projects").send({
      projects: [
        sampleProject,
        {
          ...sampleProject,
          title: "Post App",
          slug: "postapp",
          featured: false,
          category: "Content product",
        },
      ],
    });

    expect(updated.status).toBe(200);
    expect(updated.body.data.projects).toHaveLength(2);
    expect(updated.body.data.projects[0].slug).toBe("talk-now");
    expect(updated.body.data.projects[0].sortOrder).toBe(0);
    expect(updated.body.data.projects[1].slug).toBe("postapp");

    const listed = await request(app).get("/api/v1/projects");
    expect(listed.body.data.projects.map((item: { slug: string }) => item.slug)).toEqual([
      "talk-now",
      "postapp",
    ]);
  });

  it("rejects duplicate slugs and javascript links", async () => {
    const agent = await registerAdmin();
    const duplicates = await agent.put("/api/v1/projects").send({
      projects: [sampleProject, { ...sampleProject, title: "Copy" }],
    });
    expect(duplicates.status).toBe(400);

    const unsafe = await agent.put("/api/v1/projects").send({
      projects: [{ ...sampleProject, githubUrl: "javascript:alert(1)" }],
    });
    expect(unsafe.status).toBe(400);
  });
});
