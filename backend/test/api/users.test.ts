import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../src/app";

const app = createApp();

const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

describe("users API", () => {
  it("updates the signed-in profile", async () => {
    const agent = request.agent(app);
    const created = await agent.post("/api/v1/auth/register").send({
      name: "Ada",
      email: "ada@example.com",
      password: "password123",
    });
    expect(created.status).toBe(201);
    expect(created.body.data.user.phone).toBe("");
    expect(created.body.data.user.imageUrl).toBeNull();
    expect(created.body.data.user.notifyProduct).toBe(true);

    const updated = await agent.patch("/api/v1/users/me").send({
      name: "Ada Lovelace",
      phone: "+1 202 555 0147",
      country: "United Kingdom",
      notifyProduct: true,
      notifyMarketing: true,
    });
    expect(updated.status).toBe(200);
    expect(updated.body.data.user.name).toBe("Ada Lovelace");
    expect(updated.body.data.user.phone).toBe("+1 202 555 0147");
    expect(updated.body.data.user.country).toBe("United Kingdom");
    expect(updated.body.data.user.notifyMarketing).toBe(true);
    expect(updated.body.data.user.email).toBe("ada@example.com");

    const me = await agent.get("/api/v1/users/me");
    expect(me.status).toBe(200);
    expect(me.body.data.user.country).toBe("United Kingdom");

    const session = await agent.get("/api/v1/auth/me");
    expect(session.body.data.user.country).toBe("United Kingdom");
  });

  it("lets a customer upload and remove a profile photo", async () => {
    const agent = request.agent(app);
    await agent.post("/api/v1/auth/register").send({
      name: "Ada",
      email: "ada-photo@example.com",
      password: "password123",
    });

    const uploaded = await agent
      .post("/api/v1/users/me/avatar")
      .attach("file", PNG_1X1, { filename: "photo.png", contentType: "image/png" });
    expect(uploaded.status).toBe(200);
    expect(uploaded.body.data.user.imageUrl).toMatch(/^\/api\/v1\/media\/files\/.+\.png$/);

    const removed = await agent.delete("/api/v1/users/me/avatar");
    expect(removed.status).toBe(200);
    expect(removed.body.data.user.imageUrl).toBeNull();
  });

  it("rejects an invalid phone number", async () => {
    const agent = request.agent(app);
    await agent.post("/api/v1/auth/register").send({
      name: "Ada",
      email: "ada2@example.com",
      password: "password123",
    });
    const updated = await agent.patch("/api/v1/users/me").send({
      name: "Ada",
      phone: "nope",
    });
    expect(updated.status).toBe(400);
  });

  it("requires authentication", async () => {
    const updated = await request(app).patch("/api/v1/users/me").send({ name: "Ada" });
    expect(updated.status).toBe(401);
  });
});
