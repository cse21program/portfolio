import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../src/app";
import { defaultServices } from "../../src/modules/services/services.types";

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

async function registerCustomer() {
  const agent = request.agent(app);
  const created = await agent.post("/api/v1/auth/register").send({
    name: "Client",
    email: "customer@example.com",
    password: "password123",
  });
  expect(created.status).toBe(201);
  return agent;
}

const sampleService = {
  title: "Architecture review",
  slug: "architecture-review",
  shortDescription: "A structured look at an existing backend.",
  description: "I read the code, the deploy path, and the failure modes, then write a short list of changes.",
  thumbnailUrl: null,
  category: "Review",
  startingPrice: "$400",
  pricingType: "Fixed price",
  deliveryTime: "5–10 days",
  features: ["Code and infra review"],
  requirements: ["Repo access"],
  technologies: ["Backend"],
  faq: [{ question: "What do you need?", answer: "Repo access and a short walkthrough." }],
  packages: [],
  available: true,
  featured: false,
  status: "published",
  publishedAt: "2026-08-01",
  seoTitle: "",
  seoDescription: "",
  canonicalUrl: "",
};

describe("services API", () => {
  it("seeds default records on the first public read", async () => {
    const response = await request(app).get("/api/v1/services");
    expect(response.status).toBe(200);
    expect(response.body.data.services).toHaveLength(defaultServices.length);
    expect(response.body.data.services[0].slug).toBe("backend-development");
    expect(response.body.data.services[0].featured).toBe(true);
  });

  it("returns a service and related items by slug", async () => {
    const response = await request(app).get("/api/v1/services/backend-development");
    expect(response.status).toBe(200);
    expect(response.body.data.service.title).toBe("Backend API development");
    expect(response.body.data.service.packages.length).toBeGreaterThan(0);
    expect(response.body.data.related.every((item: { slug: string }) => item.slug !== "backend-development")).toBe(
      true,
    );
  });

  it("hides drafts from the public catalog", async () => {
    const admin = await registerAdmin();
    await admin.put("/api/v1/services").send({
      services: [{ ...sampleService, status: "draft" }],
    });

    const listed = await request(app).get("/api/v1/services");
    expect(listed.body.data.services).toHaveLength(0);

    const missing = await request(app).get("/api/v1/services/architecture-review");
    expect(missing.status).toBe(404);

    const asAdmin = await admin.get("/api/v1/services");
    expect(asAdmin.body.data.services).toHaveLength(1);
  });

  it("lets an admin replace the list", async () => {
    const admin = await registerAdmin();
    const updated = await admin.put("/api/v1/services").send({
      services: [sampleService, { ...sampleService, title: "Mentoring", slug: "technical-mentoring", featured: true }],
    });
    expect(updated.status).toBe(200);
    expect(updated.body.data.services).toHaveLength(2);
    expect(updated.body.data.services[0].slug).toBe("architecture-review");
  });

  it("rejects customer updates", async () => {
    const customer = await registerCustomer();
    const response = await customer.put("/api/v1/services").send({ services: [sampleService] });
    expect(response.status).toBe(403);
  });
});
