import request from "supertest";
import { describe, expect, it } from "vitest";
import { getOutbox } from "../../src/common/mailer/mailer";
import { createApp } from "../../src/app";

const app = createApp();

const billing = {
  billingName: "Ada Lovelace",
  billingEmail: "ada@example.com",
  billingPhone: "+44 20 7946 0958",
  country: "United Kingdom",
  address: "12 Analytical Engine Lane",
  city: "London",
  postal: "SW1A 1AA",
  paymentMethod: "card",
  termsAccepted: true,
};

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

async function registerCustomer(email = "student@example.com") {
  const agent = request.agent(app);
  const created = await agent.post("/api/v1/auth/register").send({
    name: "Ada",
    email,
    password: "password123",
  });
  expect(created.status).toBe(201);
  return agent;
}

async function payForCourse(agent: request.Agent) {
  await request(app).get("/api/v1/courses");
  const added = await agent.post("/api/v1/cart/items").send({
    kind: "course",
    slug: "spring-boot-masterclass",
  });
  expect(added.status).toBe(200);
  const placed = await agent.post("/api/v1/checkout").send(billing);
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
  return placed.body.data.order;
}

describe("reviews API", () => {
  it("lets a verified purchaser submit a review that Studio can approve", { timeout: 30000 }, async () => {
    const admin = await registerAdmin();
    const agent = await registerCustomer();
    await payForCourse(agent);

    const guest = await request(app).post("/api/v1/reviews").send({
      kind: "course",
      slug: "spring-boot-masterclass",
      rating: 5,
      comment: "Clear modules and a production-shaped Spring Boot syllabus.",
    });
    expect(guest.status).toBe(401);

    const eligible = await agent.get("/api/v1/reviews/eligible");
    expect(eligible.status).toBe(200);
    expect(eligible.body.data.products.some((item: { slug: string }) => item.slug === "spring-boot-masterclass")).toBe(
      true,
    );

    const created = await agent.post("/api/v1/reviews").send({
      kind: "course",
      slug: "spring-boot-masterclass",
      rating: 5,
      comment: "Clear modules and a production-shaped Spring Boot syllabus.",
    });
    expect(created.status).toBe(201);
    expect(created.body.data.review.status).toBe("pending");
    expect(created.body.data.review.verified).toBe(true);
    const reviewId = created.body.data.review.id as string;

    const hidden = await request(app).get(
      "/api/v1/reviews?kind=course&slug=spring-boot-masterclass",
    );
    expect(hidden.status).toBe(200);
    expect(hidden.body.data.reviews).toHaveLength(0);
    expect(hidden.body.data.summary.count).toBe(0);

    const twice = await agent.post("/api/v1/reviews").send({
      kind: "course",
      slug: "spring-boot-masterclass",
      rating: 4,
      comment: "Still a strong course after a second look at the modules.",
    });
    expect(twice.status).toBe(409);

    const approved = await admin.patch(`/api/v1/reviews/admin/${reviewId}`).send({ status: "approved" });
    expect(approved.status).toBe(200);
    expect(approved.body.data.review.status).toBe("approved");
    expect(getOutbox().some((item) => item.subject.includes("review of"))).toBe(true);

    const listed = await request(app).get(
      "/api/v1/reviews?kind=course&slug=spring-boot-masterclass",
    );
    expect(listed.status).toBe(200);
    expect(listed.body.data.reviews).toHaveLength(1);
    expect(listed.body.data.reviews[0].comment).toContain("Clear modules");
    expect(listed.body.data.reviews[0].user).toBeUndefined();
    expect(listed.body.data.summary.average).toBe(5);

    const locked = await agent.delete(`/api/v1/reviews/${reviewId}`);
    expect(locked.status).toBe(400);
  });

  it("rejects a review without a paid purchase", async () => {
    await registerAdmin();
    const agent = await registerCustomer();
    await request(app).get("/api/v1/courses");

    const denied = await agent.post("/api/v1/reviews").send({
      kind: "course",
      slug: "spring-boot-masterclass",
      rating: 5,
      comment: "I have not bought this course but I would like to leave a rating.",
    });
    expect(denied.status).toBe(403);
  });
});
