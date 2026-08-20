import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../src/app";
import { defaultTutorials } from "../../src/modules/tutorials/tutorials.types";

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

const sampleTutorial = {
  title: "Docker complete tutorial",
  slug: "docker-complete",
  description: "From images and containers to a deployable API stack.",
  difficulty: "Beginner",
  prerequisites: ["Docker Desktop"],
  duration: "4 hours",
  thumbnailUrl: null,
  skill: "Docker",
  relatedSkillSlugs: [],
  relatedCourseSlugs: ["production-docker"],
  price: "Free",
  free: true,
  sections: [
    {
      title: "Introduction",
      summary: "Why containers, and what problem they actually solve.",
      body: ["Containers package an app with its runtime."],
      videoUrl: null,
      images: [],
      codeSnippets: [],
      resources: [],
      downloads: [],
    },
  ],
  publishedAt: "2026-06-02",
  status: "published",
  seoTitle: "Docker complete",
  seoDescription: "Images, containers, Compose.",
  canonicalUrl: "",
};

describe("tutorials API", () => {
  it("seeds default records on the first public read", async () => {
    const response = await request(app).get("/api/v1/tutorials");

    expect(response.status).toBe(200);
    expect(response.body.data.tutorials).toHaveLength(defaultTutorials.length);
    expect(response.body.data.tutorials[0].slug).toBe("docker-complete");
    expect(response.body.data.tutorials[0].status).toBe("published");
    expect(response.body.data.tutorials[0].sections[0].title).toBe("Introduction");
    expect(response.body.data.tutorials[0].sections[0].body[0]).toContain(
      "Containers package an app with its runtime",
    );
    expect(
      response.body.data.tutorials[0].sections.some(
        (section: { codeSnippets: unknown[] }) => section.codeSnippets.length > 0,
      ),
    ).toBe(true);
    expect(response.body.data.tutorials[2]).toMatchObject({
      slug: "jwt-api-security",
      free: false,
      price: "$29",
    });
    expect(response.body.data.tutorials[2].sections[0].title).toBeTruthy();
    expect(response.body.data.tutorials[2].sections[0].body).toEqual([]);
    expect(response.body.data.tutorials[2].sections[0].codeSnippets).toEqual([]);
  });

  it("returns a published tutorial and related walkthroughs by slug", async () => {
    const response = await request(app).get("/api/v1/tutorials/docker-complete");

    expect(response.status).toBe(200);
    expect(response.body.data.tutorial.title).toContain("Docker");
    expect(response.body.data.access).toEqual({
      purchased: false,
      canReadSections: true,
    });
    expect(response.body.data.tutorial.sections[0].body[0]).toContain("Containers package");
    expect(response.body.data.related.length).toBeGreaterThan(0);
    expect(
      response.body.data.related.every((item: { slug: string }) => item.slug !== "docker-complete"),
    ).toBe(true);
  });

  it("returns 404 for an unknown slug", async () => {
    const response = await request(app).get("/api/v1/tutorials/missing-walkthrough");
    expect(response.status).toBe(404);
  });

  it("rejects unauthenticated updates", async () => {
    const response = await request(app).put("/api/v1/tutorials").send({ tutorials: [sampleTutorial] });
    expect(response.status).toBe(401);
  });

  it("rejects customer updates", async () => {
    const agent = await registerCustomer();
    const response = await agent.put("/api/v1/tutorials").send({ tutorials: [sampleTutorial] });
    expect(response.status).toBe(403);
  });

  it("lets an admin replace the list in order", async () => {
    const agent = await registerAdmin();
    const updated = await agent.put("/api/v1/tutorials").send({
      tutorials: [
        sampleTutorial,
        {
          ...sampleTutorial,
          title: "Draft walkthrough",
          slug: "draft-walkthrough",
          description: "Not ready for the public site yet.",
          status: "draft",
        },
      ],
    });

    expect(updated.status).toBe(200);
    expect(updated.body.data.tutorials).toHaveLength(2);
    expect(updated.body.data.tutorials[0].slug).toBe("docker-complete");
    expect(updated.body.data.tutorials[1].status).toBe("draft");

    const listed = await request(app).get("/api/v1/tutorials");
    expect(listed.body.data.tutorials.map((item: { slug: string }) => item.slug)).toEqual([
      "docker-complete",
      "draft-walkthrough",
    ]);

    const hidden = await request(app).get("/api/v1/tutorials/draft-walkthrough");
    expect(hidden.status).toBe(404);
  });

  it("rejects duplicate slugs", async () => {
    const agent = await registerAdmin();
    const duplicates = await agent.put("/api/v1/tutorials").send({
      tutorials: [sampleTutorial, { ...sampleTutorial, title: "Copy" }],
    });
    expect(duplicates.status).toBe(400);
  });

  it("hides premium section bodies from guests and customers who have not purchased", async () => {
    const guest = await request(app).get("/api/v1/tutorials/jwt-api-security");
    expect(guest.status).toBe(200);
    expect(guest.body.data.access).toEqual({
      purchased: false,
      canReadSections: false,
    });
    expect(guest.body.data.tutorial.sections[0].title).toBeTruthy();
    expect(guest.body.data.tutorial.sections[0].summary).toBeTruthy();
    expect(guest.body.data.tutorial.sections[0].body).toEqual([]);
    expect(guest.body.data.tutorial.sections[0].codeSnippets).toEqual([]);
    expect(guest.body.data.tutorial.sections[0].resources).toEqual([]);

    const customer = await registerCustomer();
    const signedIn = await customer.get("/api/v1/tutorials/jwt-api-security");
    expect(signedIn.status).toBe(200);
    expect(signedIn.body.data.access.canReadSections).toBe(false);
    expect(signedIn.body.data.tutorial.sections[0].body).toEqual([]);
  });

  it("lets an admin and a purchaser read premium tutorial sections", { timeout: 30000 }, async () => {
    const admin = await registerAdmin();
    const asAdmin = await admin.get("/api/v1/tutorials/jwt-api-security");
    expect(asAdmin.status).toBe(200);
    expect(asAdmin.body.data.access.canReadSections).toBe(true);
    expect(asAdmin.body.data.tutorial.sections[0].body[0]).toContain("JWTs are a transport for claims");

    const listed = await admin.get("/api/v1/tutorials");
    const premium = listed.body.data.tutorials.find((item: { slug: string }) => item.slug === "jwt-api-security");
    expect(premium.sections[0].body.length).toBeGreaterThan(0);

    const agent = await registerCustomer();
    const added = await agent.post("/api/v1/cart/items").send({
      kind: "tutorial",
      slug: "jwt-api-security",
    });
    expect(added.status).toBe(200);
    const placed = await agent.post("/api/v1/checkout").send({
      billingName: "Ada Lovelace",
      billingEmail: "ada@example.com",
      billingPhone: "+44 20 7946 0958",
      country: "United Kingdom",
      address: "12 Analytical Engine Lane",
      city: "London",
      postal: "SW1A 1AA",
      paymentMethod: "card",
      termsAccepted: true,
    });
    expect(placed.status).toBe(201);
    const started = await agent.post("/api/v1/payments").send({
      orderNumber: placed.body.data.order.orderNumber,
      provider: "stripe",
    });
    expect(started.status).toBe(201);
    const paid = await agent.post(`/api/v1/payments/${started.body.data.payment.id}/demo`).send({
      action: "succeed",
    });
    expect(paid.status).toBe(200);

    const unlocked = await agent.get("/api/v1/tutorials/jwt-api-security");
    expect(unlocked.status).toBe(200);
    expect(unlocked.body.data.access).toEqual({
      purchased: true,
      canReadSections: true,
    });
    expect(unlocked.body.data.tutorial.sections[0].body[0]).toContain("JWTs are a transport for claims");
  });
});
