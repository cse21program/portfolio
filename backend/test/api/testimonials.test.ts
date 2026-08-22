import request from "supertest";
import { describe, expect, it } from "vitest";
import { prisma } from "../../src/common/database/prisma";
import { createApp } from "../../src/app";
import { defaultTestimonials } from "../../src/modules/testimonials/testimonials.types";

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
  return { agent, userId: created.body.data.user.id as string };
}

async function registerCustomer() {
  const agent = request.agent(app);
  const created = await agent.post("/api/v1/auth/register").send({
    name: "Student",
    email: "customer@example.com",
    password: "password123",
  });
  expect(created.status).toBe(201);
  return agent;
}

const sampleQuote = {
  name: "Aisha Rahman",
  position: "Product engineer",
  company: "Early-stage SaaS",
  imageUrl: null,
  rating: 5,
  featured: true,
  comment: "Rezaul turned a messy API into something the frontend could trust.",
};

describe("testimonials API", () => {
  it("seeds default quotes on the first public read", async () => {
    const response = await request(app).get("/api/v1/testimonials");

    expect(response.status).toBe(200);
    expect(response.body.data.testimonials).toHaveLength(defaultTestimonials.length);
    expect(response.body.data.testimonials[0].name).toBe("Aisha Rahman");
    expect(response.body.data.testimonials[0].featured).toBe(true);
    expect(response.body.data.testimonials[0].rating).toBe(5);
  });

  it("rejects unauthenticated updates", async () => {
    const response = await request(app)
      .put("/api/v1/testimonials")
      .send({ testimonials: [sampleQuote] });

    expect(response.status).toBe(401);
  });

  it("rejects customer updates", async () => {
    const agent = await registerCustomer();
    const response = await agent.put("/api/v1/testimonials").send({ testimonials: [sampleQuote] });

    expect(response.status).toBe(403);
  });

  it("lets an admin replace the list in order", async () => {
    const { agent } = await registerAdmin();
    const updated = await agent.put("/api/v1/testimonials").send({
      testimonials: [
        sampleQuote,
        {
          ...sampleQuote,
          name: "Daniel Cole",
          position: "Founder",
          company: "Internal tools",
          featured: false,
          comment: "The Compose setup and a real health check saved us a month.",
        },
      ],
    });

    expect(updated.status).toBe(200);
    expect(updated.body.data.testimonials).toHaveLength(2);
    expect(updated.body.data.testimonials[0].name).toBe("Aisha Rahman");
    expect(updated.body.data.testimonials[0].sortOrder).toBe(0);
    expect(updated.body.data.testimonials[1].name).toBe("Daniel Cole");
    expect(updated.body.data.testimonials[1].featured).toBe(false);

    const listed = await request(app).get("/api/v1/testimonials");
    expect(listed.body.data.testimonials.map((item: { name: string }) => item.name)).toEqual([
      "Aisha Rahman",
      "Daniel Cole",
    ]);
  });

  it("rejects javascript image URLs and short comments", async () => {
    const { agent } = await registerAdmin();
    const unsafe = await agent.put("/api/v1/testimonials").send({
      testimonials: [{ ...sampleQuote, imageUrl: "javascript:alert(1)" }],
    });
    expect(unsafe.status).toBe(400);

    const short = await agent.put("/api/v1/testimonials").send({
      testimonials: [{ ...sampleQuote, comment: "Too short" }],
    });
    expect(short.status).toBe(400);
  });

  it("promotes an approved review once", async () => {
    const { agent, userId } = await registerAdmin();
    const review = await prisma.review.create({
      data: {
        userId,
        kind: "course",
        slug: "spring-boot",
        title: "Spring Boot",
        href: "/courses/spring-boot",
        rating: 5,
        comment: "Clear production guidance with a real checkout path.",
        status: "approved",
        publishedAt: new Date(),
      },
    });

    const admin = await agent.get("/api/v1/testimonials/admin");
    expect(admin.status).toBe(200);
    expect(admin.body.data.sources.some((item: { reviewId: string }) => item.reviewId === review.id)).toBe(
      true,
    );

    const created = await agent.post("/api/v1/testimonials/from-review").send({ reviewId: review.id });
    expect(created.status).toBe(200);
    expect(created.body.data.testimonial.reviewId).toBe(review.id);
    expect(created.body.data.testimonial.name).toBe("Owner");
    expect(created.body.data.testimonial.company).toBe("Spring Boot");

    const again = await agent.post("/api/v1/testimonials/from-review").send({ reviewId: review.id });
    expect(again.status).toBe(200);
    expect(again.body.data.testimonial.id).toBe(created.body.data.testimonial.id);

    const pending = await prisma.review.create({
      data: {
        userId,
        kind: "tutorial",
        slug: "docker",
        title: "Docker",
        href: "/tutorials/docker",
        rating: 4,
        comment: "Still waiting for Studio to approve this review.",
        status: "pending",
      },
    });
    const rejected = await agent.post("/api/v1/testimonials/from-review").send({ reviewId: pending.id });
    expect(rejected.status).toBe(404);
  });
});
