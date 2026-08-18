import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../src/app";
import { defaultFields } from "../../src/modules/fields/fields.types";

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

const sampleField = {
  name: "Backend Development",
  slug: "backend-development",
  summary: "APIs, domain models, and services that stay stable as systems grow.",
  overview: "Clear boundaries and APIs that stay readable.",
  iconUrl: null,
  thumbnailUrl: null,
  bannerUrl: null,
  videoUrl: null,
  embedVideoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  featured: true,
  published: true,
  seoTitle: "Backend Development",
  seoDescription: "Backend field overview.",
};

describe("fields API", () => {
  it("seeds default records on the first public read", async () => {
    const response = await request(app).get("/api/v1/fields");

    expect(response.status).toBe(200);
    expect(response.body.data.fields).toHaveLength(defaultFields.length);
    expect(response.body.data.fields[0].slug).toBe("backend-development");
    expect(response.body.data.fields[0].name).toBe("Backend Development");
  });

  it("returns a field by slug", async () => {
    const response = await request(app).get("/api/v1/fields/backend-development");

    expect(response.status).toBe(200);
    expect(response.body.data.field.name).toBe("Backend Development");
    expect(response.body.data.field.slug).toBe("backend-development");
  });

  it("returns 404 for an unknown slug", async () => {
    const response = await request(app).get("/api/v1/fields/missing-field");
    expect(response.status).toBe(404);
  });

  it("rejects unauthenticated updates", async () => {
    const response = await request(app).put("/api/v1/fields").send({ fields: [sampleField] });
    expect(response.status).toBe(401);
  });

  it("rejects customer updates", async () => {
    const agent = await registerCustomer();
    const response = await agent.put("/api/v1/fields").send({ fields: [sampleField] });
    expect(response.status).toBe(403);
  });

  it("lets an admin replace the list in order", async () => {
    const agent = await registerAdmin();
    const updated = await agent.put("/api/v1/fields").send({
      fields: [
        sampleField,
        {
          ...sampleField,
          name: "DevOps",
          slug: "devops",
          featured: false,
          embedVideoUrl: null,
        },
      ],
    });

    expect(updated.status).toBe(200);
    expect(updated.body.data.fields).toHaveLength(2);
    expect(updated.body.data.fields[0].slug).toBe("backend-development");
    expect(updated.body.data.fields[0].embedVideoUrl).toBe(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    );
    expect(updated.body.data.fields[1].slug).toBe("devops");

    const listed = await request(app).get("/api/v1/fields");
    expect(listed.body.data.fields.map((item: { slug: string }) => item.slug)).toEqual([
      "backend-development",
      "devops",
    ]);
  });

  it("rejects duplicate field slugs", async () => {
    const agent = await registerAdmin();
    const duplicates = await agent.put("/api/v1/fields").send({
      fields: [sampleField, { ...sampleField, name: "Copy" }],
    });
    expect(duplicates.status).toBe(400);
  });
});
