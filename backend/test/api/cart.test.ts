import request from "supertest";
import { describe, expect, it } from "vitest";
import { prisma } from "../../src/common/database/prisma";
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

async function seedCatalog() {
  await request(app).get("/api/v1/courses");
  await request(app).get("/api/v1/tutorials");
  await request(app).get("/api/v1/services");
}

describe("cart API", () => {
  it("lets a customer add paid catalog items and apply a coupon", async () => {
    await registerAdmin();
    const agent = await registerCustomer();
    await seedCatalog();
    await prisma.coupon.create({
      data: { code: "WELCOME10", percentOff: 10, active: true },
    });

    const course = await agent.post("/api/v1/cart/items").send({
      kind: "course",
      slug: "spring-boot-masterclass",
    });
    expect(course.status).toBe(200);
    expect(course.body.data.cart.items).toHaveLength(1);
    expect(course.body.data.cart.items[0].unitLabel).toBe("$99");
    expect(course.body.data.cart.summary.subtotalCents).toBe(9900);
    expect(course.body.data.cart.checkoutReady).toBe(true);

    const again = await agent.post("/api/v1/cart/items").send({
      kind: "course",
      slug: "spring-boot-masterclass",
    });
    expect(again.status).toBe(200);
    expect(again.body.data.cart.items).toHaveLength(1);

    const tutorial = await agent.post("/api/v1/cart/items").send({
      kind: "tutorial",
      slug: "jwt-api-security",
    });
    expect(tutorial.status).toBe(200);
    expect(tutorial.body.data.cart.items).toHaveLength(2);

    const service = await agent.post("/api/v1/cart/items").send({
      kind: "service",
      slug: "backend-development",
      packageName: "API slice",
    });
    expect(service.status).toBe(200);
    expect(service.body.data.cart.items).toHaveLength(3);
    expect(service.body.data.cart.summary.subtotalCents).toBe(9900 + 2900 + 120000);

    const coupon = await agent.post("/api/v1/cart/coupon").send({ code: "welcome10" });
    expect(coupon.status).toBe(200);
    expect(coupon.body.data.cart.summary.couponCode).toBe("WELCOME10");
    expect(coupon.body.data.cart.summary.discountCents).toBe(Math.round((9900 + 2900 + 120000) * 0.1));

    const listed = await agent.get("/api/v1/cart");
    expect(listed.status).toBe(200);
    expect(listed.body.data.cart.summary.itemCount).toBe(3);

    const removed = await agent.delete(`/api/v1/cart/items/${listed.body.data.cart.items[0].id}`);
    expect(removed.status).toBe(200);
    expect(removed.body.data.cart.items).toHaveLength(2);
  });

  it("rejects free courses, hourly services, and guests", async () => {
    const admin = await registerAdmin();
    const agent = await registerCustomer();
    await seedCatalog();

    await admin.put("/api/v1/courses").send({
      courses: [
        {
          title: "HTTP from zero",
          slug: "http-from-zero",
          subtitle: "Requests and status codes.",
          description: "A short free course.",
          overview: ["Read a request line."],
          difficulty: "Beginner",
          requirements: [],
          outcomes: ["Name the parts of an HTTP request"],
          audience: [],
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
          modules: [],
          publishedAt: "2026-08-01",
          status: "published",
          seoTitle: "",
          seoDescription: "",
          canonicalUrl: "",
        },
      ],
    });

    const free = await agent.post("/api/v1/cart/items").send({
      kind: "course",
      slug: "http-from-zero",
    });
    expect(free.status).toBe(400);

    const hourly = await agent.post("/api/v1/cart/items").send({
      kind: "service",
      slug: "technical-mentoring",
    });
    expect(hourly.status).toBe(400);

    const guest = await request(app).post("/api/v1/cart/items").send({
      kind: "course",
      slug: "spring-boot-masterclass",
    });
    expect(guest.status).toBe(401);
  });
});
