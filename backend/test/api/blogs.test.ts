import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../src/app";
import { defaultBlogs } from "../../src/modules/blogs/blogs.types";

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

const sampleBlog = {
  title: "JWT authentication without painting yourself into a corner",
  slug: "jwt-authentication",
  excerpt: "Access tokens, refresh tokens, and why authorization still has to live on the server.",
  content: ["Keep authorization on the server.", "Rotate refresh tokens."],
  featuredImageUrl: null,
  author: "Rezaul Karim",
  category: "Backend",
  tags: ["JWT", "Security"],
  skill: "Spring Boot",
  topic: "",
  readingTime: "8 min",
  publishedAt: "2026-07-12",
  status: "published",
  seoTitle: "JWT authentication",
  seoDescription: "Access tokens and refresh tokens.",
  canonicalUrl: "",
};

describe("blogs API", () => {
  it("seeds default records on the first public read", async () => {
    const response = await request(app).get("/api/v1/blogs");

    expect(response.status).toBe(200);
    expect(response.body.data.blogs).toHaveLength(defaultBlogs.length);
    expect(response.body.data.blogs[0].slug).toBe("jwt-authentication");
    expect(response.body.data.blogs[0].status).toBe("published");
  });

  it("returns a published post and related articles by slug", async () => {
    const response = await request(app).get("/api/v1/blogs/jwt-authentication");

    expect(response.status).toBe(200);
    expect(response.body.data.blog.title).toContain("JWT");
    expect(response.body.data.related.length).toBeGreaterThan(0);
    expect(
      response.body.data.related.every((item: { slug: string }) => item.slug !== "jwt-authentication"),
    ).toBe(true);
  });

  it("returns 404 for an unknown slug", async () => {
    const response = await request(app).get("/api/v1/blogs/missing-post");
    expect(response.status).toBe(404);
  });

  it("rejects unauthenticated updates", async () => {
    const response = await request(app).put("/api/v1/blogs").send({ blogs: [sampleBlog] });
    expect(response.status).toBe(401);
  });

  it("rejects customer updates", async () => {
    const agent = await registerCustomer();
    const response = await agent.put("/api/v1/blogs").send({ blogs: [sampleBlog] });
    expect(response.status).toBe(403);
  });

  it("lets an admin replace the list in order", async () => {
    const agent = await registerAdmin();
    const updated = await agent.put("/api/v1/blogs").send({
      blogs: [
        sampleBlog,
        {
          ...sampleBlog,
          title: "Draft notes",
          slug: "draft-notes",
          excerpt: "Not ready for the public site yet.",
          status: "draft",
        },
      ],
    });

    expect(updated.status).toBe(200);
    expect(updated.body.data.blogs).toHaveLength(2);
    expect(updated.body.data.blogs[0].slug).toBe("jwt-authentication");
    expect(updated.body.data.blogs[1].status).toBe("draft");

    const listed = await request(app).get("/api/v1/blogs");
    expect(listed.body.data.blogs.map((item: { slug: string }) => item.slug)).toEqual([
      "jwt-authentication",
    ]);

    const hidden = await request(app).get("/api/v1/blogs/draft-notes");
    expect(hidden.status).toBe(404);

    const adminListed = await agent.get("/api/v1/blogs");
    expect(adminListed.body.data.blogs.map((item: { slug: string }) => item.slug)).toEqual([
      "jwt-authentication",
      "draft-notes",
    ]);

    const preview = await agent.get("/api/v1/blogs/draft-notes");
    expect(preview.status).toBe(200);
    expect(preview.body.data.blog.slug).toBe("draft-notes");
  });

  it("makes a scheduled post live once publishedAt has passed", async () => {
    const agent = await registerAdmin();
    const updated = await agent.put("/api/v1/blogs").send({
      blogs: [
        {
          ...sampleBlog,
          slug: "scheduled-note",
          title: "Scheduled note",
          status: "scheduled",
          publishedAt: "2020-01-01",
        },
      ],
    });
    expect(updated.status).toBe(200);

    const listed = await request(app).get("/api/v1/blogs");
    expect(listed.body.data.blogs.map((item: { slug: string }) => item.slug)).toEqual(["scheduled-note"]);
  });

  it("rejects duplicate slugs", async () => {
    const agent = await registerAdmin();
    const duplicates = await agent.put("/api/v1/blogs").send({
      blogs: [sampleBlog, { ...sampleBlog, title: "Copy" }],
    });
    expect(duplicates.status).toBe(400);
  });
});
