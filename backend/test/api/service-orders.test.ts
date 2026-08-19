import request from "supertest";
import { describe, expect, it } from "vitest";
import { getOutbox } from "../../src/common/mailer/mailer";
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

async function registerCustomer(email = "customer@example.com") {
  const agent = request.agent(app);
  const created = await agent.post("/api/v1/auth/register").send({
    name: "Client",
    email,
    password: "password123",
  });
  expect(created.status).toBe(201);
  return agent;
}

describe("service orders API", () => {
  it("lets a signed-in customer request a published service", async () => {
    await request(app).get("/api/v1/services");
    const customer = await registerCustomer();
    const created = await customer.post("/api/v1/service-orders").send({
      serviceSlug: "architecture-review",
      requirements: "Please review the API error contract and the deploy path.",
      budget: "$400",
      timeline: "This month",
    });
    expect(created.status).toBe(201);
    expect(created.body.data.order.status).toBe("pending");
    expect(created.body.data.order.serviceTitle).toBe("Architecture review");
    expect(getOutbox().some((item) => item.subject.startsWith("Request received"))).toBe(true);

    const listed = await customer.get("/api/v1/service-orders");
    expect(listed.body.data.orders).toHaveLength(1);

    const duplicate = await customer.post("/api/v1/service-orders").send({
      serviceSlug: "architecture-review",
      requirements: "Please review the API error contract and the deploy path.",
    });
    expect(duplicate.status).toBe(200);
    expect(duplicate.body.data.order.id).toBe(created.body.data.order.id);
  });

  it("lets a customer cancel a pending request", async () => {
    await request(app).get("/api/v1/services");
    const customer = await registerCustomer();
    const created = await customer.post("/api/v1/service-orders").send({
      serviceSlug: "technical-mentoring",
      requirements: "Four sessions on Spring Boot interviews and a portfolio project.",
    });
    const canceled = await customer.delete(`/api/v1/service-orders/${created.body.data.order.id}`);
    expect(canceled.status).toBe(200);
    expect(canceled.body.data.order.status).toBe("cancelled");
  });

  it("lets an admin grant and update status", async () => {
    await request(app).get("/api/v1/services");
    const admin = await registerAdmin();
    await registerCustomer();
    const granted = await admin.post("/api/v1/service-orders/admin").send({
      email: "customer@example.com",
      serviceSlug: "devops-consulting",
      packageName: "Standard",
    });
    expect(granted.status).toBe(201);
    expect(granted.body.data.order.status).toBe("confirmed");
    expect(granted.body.data.order.packageName).toBe("Standard");

    const updated = await admin.patch(`/api/v1/service-orders/admin/${granted.body.data.order.id}`).send({
      status: "in_progress",
      adminNote: "Compose file first.",
    });
    expect(updated.status).toBe(200);
    expect(updated.body.data.order.status).toBe("in_progress");
    expect(updated.body.data.order.adminNote).toBe("Compose file first.");
    expect(getOutbox().some((item) => item.subject.includes("in progress"))).toBe(true);
  });
});
