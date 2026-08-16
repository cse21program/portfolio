import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../../src/app";

const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

const uploadDir = fs.mkdtempSync(path.join(os.tmpdir(), "portfolio-uploads-"));
process.env.UPLOAD_DIR = uploadDir;

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

describe("media upload API", () => {
  beforeAll(() => {
    fs.mkdirSync(uploadDir, { recursive: true });
  });

  afterAll(() => {
    fs.rmSync(uploadDir, { recursive: true, force: true });
  });

  it("lets an admin upload an image and serve it", async () => {
    const agent = await registerAdmin();

    const uploaded = await agent
      .post("/api/v1/media?kind=image")
      .attach("file", PNG_1X1, { filename: "photo.png", contentType: "image/png" });

    expect(uploaded.status).toBe(201);
    expect(uploaded.body.data.kind).toBe("image");
    expect(uploaded.body.data.url).toMatch(/^\/api\/v1\/media\/files\/.+\.png$/);

    const served = await request(app).get(uploaded.body.data.url);
    expect(served.status).toBe(200);
    expect(served.headers["content-type"]).toMatch(/image\/png/);
    expect(served.body).toEqual(PNG_1X1);
  });

  it("forbids customers from uploading", async () => {
    await registerAdmin();
    const agent = await registerCustomer();

    const uploaded = await agent
      .post("/api/v1/media?kind=image")
      .attach("file", PNG_1X1, { filename: "photo.png", contentType: "image/png" });

    expect(uploaded.status).toBe(403);
  });

  it("rejects unsupported types and missing kind", async () => {
    const agent = await registerAdmin();

    const missingKind = await agent
      .post("/api/v1/media")
      .attach("file", PNG_1X1, { filename: "photo.png", contentType: "image/png" });
    expect(missingKind.status).toBe(400);

    const text = await agent
      .post("/api/v1/media?kind=image")
      .attach("file", Buffer.from("hello"), { filename: "notes.txt", contentType: "text/plain" });
    expect(text.status).toBe(400);
    expect(text.body.error.message).toMatch(/JPEG/);
  });

  it("returns 404 for unknown files", async () => {
    const response = await request(app).get(
      "/api/v1/media/files/00000000-0000-4000-8000-000000000000.png",
    );
    expect(response.status).toBe(404);
  });
});
