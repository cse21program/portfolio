import request from "supertest";
import { describe, expect, it } from "vitest";
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

async function seedCatalog() {
  await request(app).get("/api/v1/courses");
  await request(app).get("/api/v1/tutorials");
  await request(app).get("/api/v1/services");
  await request(app).get("/api/v1/blogs");
}

async function pay(
  agent: request.Agent,
  item: { kind: string; slug: string; packageName?: string },
) {
  const added = await agent.post("/api/v1/cart/items").send(item);
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
  return placed.body.data.order as { orderNumber: string };
}

describe("admin dashboard API", () => {
  it("is private to Studio administrators", async () => {
    const guest = await request(app).get("/api/v1/admin/dashboard");
    expect(guest.status).toBe(401);

    await registerAdmin();
    const customer = await registerCustomer();
    const forbidden = await customer.get("/api/v1/admin/dashboard");
    expect(forbidden.status).toBe(403);
  });

  it("returns live visitors, commerce, and popularity metrics", { timeout: 30000 }, async () => {
    const admin = await registerAdmin();
    const customer = await registerCustomer();
    await seedCatalog();

    const courses = await request(app).get("/api/v1/courses");
    expect(courses.status).toBe(200);
    const publishedCourses = courses.body.data.courses.length as number;

    await request(app)
      .post("/api/v1/analytics/pageview")
      .set("User-Agent", "Mozilla/5.0 DashboardTest")
      .set("X-Forwarded-For", "198.51.100.20")
      .send({ path: "/" });
    await request(app)
      .post("/api/v1/analytics/pageview")
      .set("User-Agent", "Mozilla/5.0 DashboardTest")
      .set("X-Forwarded-For", "198.51.100.20")
      .send({ path: "/courses" });
    await request(app)
      .post("/api/v1/analytics/pageview")
      .set("User-Agent", "Mozilla/5.0 OtherBrowser")
      .set("X-Forwarded-For", "198.51.100.21")
      .send({ path: "/blog" });
    await request(app)
      .post("/api/v1/analytics/pageview")
      .set("User-Agent", "Mozilla/5.0 DashboardTest")
      .set("X-Forwarded-For", "198.51.100.20")
      .send({ path: "/admin" });

    const courseOrder = await pay(customer, { kind: "course", slug: "spring-boot-masterclass" });
    await pay(customer, { kind: "tutorial", slug: "jwt-api-security" });
    await pay(customer, {
      kind: "service",
      slug: "backend-development",
      packageName: "API slice",
    });

    const pendingCart = await customer.post("/api/v1/cart/items").send({
      kind: "course",
      slug: "production-docker",
    });
    expect(pendingCart.status).toBe(200);
    const unpaid = await customer.post("/api/v1/checkout").send({ ...billing, paymentMethod: "bank" });
    expect(unpaid.status).toBe(201);

    const serviceRequest = await customer.post("/api/v1/service-orders").send({
      serviceSlug: "architecture-review",
      requirements: "Please review the API error contract and the deploy path.",
      budget: "$400",
    });
    expect(serviceRequest.status).toBe(201);

    const lead = await request(app).post("/api/v1/contact").send({
      name: "Ada",
      email: "ada@example.com",
      subject: "Need a production API review",
      message: "We have a Spring Boot service that fails closed on deploy and I want a written review this month.",
      budget: "$400",
    });
    expect(lead.status).toBe(201);

    const review = await customer.post("/api/v1/reviews").send({
      kind: "course",
      slug: "spring-boot-masterclass",
      rating: 5,
      comment: "Clear modules and a production-shaped Spring Boot syllabus.",
    });
    expect(review.status).toBe(201);

    const liked = await customer.post("/api/v1/blogs/jwt-authentication/like");
    expect(liked.status).toBe(200);

    const listed = await admin.get("/api/v1/admin/dashboard");
    expect(listed.status).toBe(200);
    expect(listed.headers["cache-control"]).toMatch(/no-store/);

    const dashboard = listed.body.data.dashboard;
    expect(dashboard.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(dashboard.metrics).toMatchObject({
      visitors: 2,
      pageviews: 3,
      users: 2,
      courses: publishedCourses,
      students: 1,
      orders: 4,
      revenueCents: 132800,
      revenueLabel: "$1,328",
      courseRevenueCents: 12800,
      courseRevenueLabel: "$128",
      serviceRevenueCents: 120000,
      serviceRevenueLabel: "$1,200",
    });

    expect(dashboard.attention).toEqual(
      expect.arrayContaining([
        { label: "Awaiting payment", count: 1, href: "/admin/orders" },
        { label: "Pending service requests", count: 1, href: "/admin/service-orders" },
        { label: "Reviews to moderate", count: 1, href: "/admin/reviews" },
        { label: "New leads", count: 1, href: "/admin/leads" },
      ]),
    );

    expect(dashboard.recentOrders[0]?.title).toBe(unpaid.body.data.order.orderNumber);
    expect(dashboard.recentOrders.some((item: { title: string }) => item.title === courseOrder.orderNumber)).toBe(
      true,
    );
    expect(dashboard.pendingServiceOrders[0]).toMatchObject({
      title: "Architecture review",
      href: "/admin/service-orders",
    });
    expect(dashboard.popularCourses[0]).toMatchObject({
      meta: "1 student",
      href: "/admin/courses#spring-boot-masterclass",
    });
    expect(dashboard.popularTutorials[0]).toMatchObject({
      title: "JWT access control for Spring APIs",
      meta: "1 sale",
      href: "/admin/tutorials#jwt-api-security",
    });
    expect(dashboard.popularBlogs[0]).toMatchObject({
      meta: "1 engagement",
      href: "/admin/blogs#jwt-authentication",
    });
  });
});
