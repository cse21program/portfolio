import request from "supertest";
import { describe, expect, it } from "vitest";
import { getOutbox } from "../../src/common/mailer/mailer";
import { createApp } from "../../src/app";

const app = createApp();

function uniqueEmail() {
  return `user-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`;
}

describe("auth API", () => {
  it("lists providers without enabling Google by default", async () => {
    const response = await request(app).get("/api/v1/auth/providers");

    expect(response.status).toBe(200);
    expect(response.body.data.google).toBe(false);
  });

  it("rejects invalid registration payloads", async () => {
    const response = await request(app).post("/api/v1/auth/register").send({
      name: "A",
      email: "not-an-email",
      password: "short",
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("registers, reads the current user, and logs out", async () => {
    const agent = request.agent(app);
    const email = uniqueEmail();

    const created = await agent.post("/api/v1/auth/register").send({
      name: "Test User",
      email,
      password: "password123",
    });

    expect(created.status).toBe(201);
    expect(created.body.data.user.email).toBe(email);
    expect(created.body.data.user.role).toBe("CUSTOMER");
    expect(created.body.data.user.hasPassword).toBe(true);
    expect(getOutbox().some((item) => item.to === email && item.subject === "Verify your email")).toBe(true);

    const me = await agent.get("/api/v1/auth/me");
    expect(me.status).toBe(200);
    expect(me.body.data.user.email).toBe(email);

    const logout = await agent.post("/api/v1/auth/logout");
    expect(logout.status).toBe(200);

    const afterLogout = await agent.get("/api/v1/auth/me");
    expect(afterLogout.status).toBe(401);
  });

  it("logs in with email and password", async () => {
    const email = uniqueEmail();
    await request(app).post("/api/v1/auth/register").send({
      name: "Login User",
      email,
      password: "password123",
    });

    const agent = request.agent(app);
    const login = await agent.post("/api/v1/auth/login").send({
      email,
      password: "password123",
    });

    expect(login.status).toBe(200);
    expect(login.body.data.user.email).toBe(email);

    const me = await agent.get("/api/v1/auth/me");
    expect(me.status).toBe(200);
  });

  it("rejects the wrong password", async () => {
    const email = uniqueEmail();
    await request(app).post("/api/v1/auth/register").send({
      name: "Login User",
      email,
      password: "password123",
    });

    const response = await request(app).post("/api/v1/auth/login").send({
      email,
      password: "wrong-password",
    });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });

  it("promotes the bootstrap admin email on register", async () => {
    const agent = request.agent(app);
    const created = await agent.post("/api/v1/auth/register").send({
      name: "Owner",
      email: "admin@example.com",
      password: "password123",
    });

    expect(created.status).toBe(201);
    expect(created.body.data.user.role).toBe("ADMIN");
  });

  it("promotes an existing bootstrap email on login", async () => {
    const bcrypt = await import("bcryptjs");
    const { prisma } = await import("../../src/common/database/prisma");
    const email = "admin@example.com";
    await prisma.user.create({
      data: {
        email,
        name: "Owner",
        passwordHash: await bcrypt.hash("password123", 12),
        role: "CUSTOMER",
      },
    });

    const agent = request.agent(app);
    const login = await agent.post("/api/v1/auth/login").send({
      email,
      password: "password123",
    });

    expect(login.status).toBe(200);
    expect(login.body.data.user.role).toBe("ADMIN");

    const me = await agent.get("/api/v1/auth/me");
    expect(me.status).toBe(200);
    expect(me.body.data.user.role).toBe("ADMIN");
  });

  it("promotes the bootstrap email on /auth/me without a new login", async () => {
    const { prisma } = await import("../../src/common/database/prisma");
    const agent = request.agent(app);
    const created = await agent.post("/api/v1/auth/register").send({
      name: "Owner",
      email: uniqueEmail(),
      password: "password123",
    });
    expect(created.body.data.user.role).toBe("CUSTOMER");

    await prisma.user.update({
      where: { id: created.body.data.user.id },
      data: { email: "admin@example.com" },
    });

    const me = await agent.get("/api/v1/auth/me");
    expect(me.status).toBe(200);
    expect(me.body.data.user.role).toBe("ADMIN");
  });

  it("conflicts when the email is already registered", async () => {
    const email = uniqueEmail();
    const payload = { name: "Dup", email, password: "password123" };
    await request(app).post("/api/v1/auth/register").send(payload);

    const response = await request(app).post("/api/v1/auth/register").send(payload);
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("CONFLICT");
  });
});
