import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../src/app";
import { defaultPublicCatalogs } from "../../src/modules/site-access/site-access.types";

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

describe("site-access API", () => {
  it("defaults every catalog to live", async () => {
    const response = await request(app).get("/api/v1/site-access");
    expect(response.status).toBe(200);
    expect(response.body.data.catalogs).toEqual(defaultPublicCatalogs);
  });

  it("lets studio stop a catalog on the public site", async () => {
    const admin = await registerAdmin();
    const stopped = { ...defaultPublicCatalogs, blogs: false, courses: false };
    const saved = await admin.put("/api/v1/site-access").send({ catalogs: stopped });
    expect(saved.status).toBe(200);
    expect(saved.body.data.catalogs.blogs).toBe(false);

    const blogs = await request(app).get("/api/v1/blogs");
    expect(blogs.status).toBe(200);
    expect(blogs.body.data.blogs).toEqual([]);

    const post = await request(app).get("/api/v1/blogs/jwt-authentication");
    expect(post.status).toBe(404);

    const studio = await admin.get("/api/v1/blogs");
    expect(studio.status).toBe(200);
    expect(studio.body.data.blogs.length).toBeGreaterThan(0);
  });

  it("rejects catalog updates from guests", async () => {
    const response = await request(app).put("/api/v1/site-access").send({
      catalogs: { ...defaultPublicCatalogs, blogs: false },
    });
    expect(response.status).toBe(401);
  });
});
