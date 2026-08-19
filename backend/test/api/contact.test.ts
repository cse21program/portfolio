import request from "supertest";
import { describe, expect, it } from "vitest";
import { getOutbox } from "../../src/common/mailer/mailer";
import { createApp } from "../../src/app";

const app = createApp();

const sample = {
  name: "Ada",
  email: "ada@example.com",
  phone: "+1 202 555 0147",
  company: "Northwind",
  subject: "Need a production API review",
  message: "We have a Spring Boot service that fails closed on deploy and I want a written review this month.",
  budget: "$400",
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

describe("contact API", () => {
  it("stores a public inquiry and sends confirmation mail", async () => {
    await request(app).get("/api/v1/services");
    const created = await request(app).post("/api/v1/contact").send({
      ...sample,
      serviceSlug: "architecture-review",
    });
    expect(created.status).toBe(201);
    expect(created.body.data.inquiry.status).toBe("new");
    expect(created.body.data.inquiry.serviceTitle).toBe("Architecture review");
    expect(getOutbox().some((item) => item.subject === "I received your message")).toBe(true);
    expect(getOutbox().some((item) => item.subject === "Hire me: Need a production API review")).toBe(true);
  });

  it("rejects a short message", async () => {
    const created = await request(app).post("/api/v1/contact").send({
      name: "Ada",
      email: "ada@example.com",
      subject: "Hi",
      message: "Too short",
    });
    expect(created.status).toBe(400);
  });

  it("lets an admin list and update status", async () => {
    await request(app).post("/api/v1/contact").send(sample);
    const guest = await request(app).get("/api/v1/contact");
    expect(guest.status).toBe(401);

    const admin = await registerAdmin();
    const listed = await admin.get("/api/v1/contact");
    expect(listed.status).toBe(200);
    expect(listed.body.data.inquiries).toHaveLength(1);
    expect(listed.body.data.inquiries[0].status).toBe("new");

    const updated = await admin.patch(`/api/v1/contact/${listed.body.data.inquiries[0].id}`).send({
      status: "contacted",
      adminNote: "Replied from Studio.",
    });
    expect(updated.status).toBe(200);
    expect(updated.body.data.inquiry.status).toBe("contacted");
    expect(updated.body.data.inquiry.adminNote).toBe("Replied from Studio.");
    expect(updated.body.data.inquiry.readAt).toBeTruthy();
  });
});
