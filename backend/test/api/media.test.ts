import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@common/database/prisma";
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
    expect(uploaded.body.data.asset).toMatchObject({
      kind: "image",
      originalName: "photo.png",
    });

    const library = await agent.get("/api/v1/media");
    expect(library.status).toBe(200);
    expect(library.body.data.assets.some((item: { url: string }) => item.url === uploaded.body.data.url)).toBe(true);
    expect(Array.isArray(library.body.data.assets[0]?.usedIn)).toBe(true);
    expect(library.body.data.summary).toEqual(
      expect.objectContaining({
        totalBytes: expect.any(Number),
        image: expect.any(Number),
        video: expect.any(Number),
        document: expect.any(Number),
      }),
    );

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

  it("lets an admin upload a PDF and serve it for preview or download", async () => {
    const agent = await registerAdmin();
    const pdf = Buffer.from("%PDF-1.1\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");

    const uploaded = await agent
      .post("/api/v1/media?kind=document")
      .attach("file", pdf, { filename: "resume.pdf", contentType: "application/pdf" });

    expect(uploaded.status).toBe(201);
    expect(uploaded.body.data.kind).toBe("document");
    expect(uploaded.body.data.url).toMatch(/^\/api\/v1\/media\/files\/.+\.pdf$/);

    const preview = await request(app).get(uploaded.body.data.url);
    expect(preview.status).toBe(200);
    expect(preview.headers["content-type"]).toMatch(/application\/pdf/);
    expect(preview.headers["content-disposition"]).toMatch(/inline/);

    const downloaded = await request(app).get(`${uploaded.body.data.url}?download=1&name=rezaul-cv.pdf`);
    expect(downloaded.status).toBe(200);
    expect(downloaded.headers["content-disposition"]).toMatch(/attachment/);
    expect(downloaded.headers["content-disposition"]).toMatch(/rezaul-cv\.pdf/);
  });

  it("accepts a PDF when the browser omits the mime type", async () => {
    const agent = await registerAdmin();
    const pdf = Buffer.from("%PDF-1.1\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");

    const uploaded = await agent
      .post("/api/v1/media?kind=document")
      .attach("file", pdf, { filename: "cv.pdf", contentType: "application/octet-stream" });

    expect(uploaded.status).toBe(201);
    expect(uploaded.body.data.url).toMatch(/\.pdf$/);
  });

  it("lets an admin update metadata and delete a file", async () => {
    const agent = await registerAdmin();

    const uploaded = await agent
      .post("/api/v1/media?kind=image")
      .attach("file", PNG_1X1, { filename: "photo.png", contentType: "image/png" });
    expect(uploaded.status).toBe(201);
    const id = uploaded.body.data.asset.id as string;
    const url = uploaded.body.data.url as string;

    const updated = await agent.patch(`/api/v1/media/${id}`).send({ alt: "Portrait", caption: "Home hero" });
    expect(updated.status).toBe(200);
    expect(updated.body.data.asset.alt).toBe("Portrait");
    expect(updated.body.data.asset.caption).toBe("Home hero");

    const renamed = await agent.patch(`/api/v1/media/${id}`).send({ originalName: "studio-portrait" });
    expect(renamed.status).toBe(200);
    expect(renamed.body.data.asset.originalName).toBe("studio-portrait.png");
    expect(renamed.body.data.asset.url).toBe(url);

    const removed = await agent.delete(`/api/v1/media/${id}`);
    expect(removed.status).toBe(200);

    const library = await agent.get("/api/v1/media");
    expect(library.body.data.assets.some((item: { id: string }) => item.id === id)).toBe(false);

    const served = await request(app).get(url);
    expect(served.status).toBe(404);
  });

  it("refuses to delete a file that is still in use", async () => {
    const agent = await registerAdmin();

    const uploaded = await agent
      .post("/api/v1/media?kind=image")
      .attach("file", PNG_1X1, { filename: "hero.png", contentType: "image/png" });
    expect(uploaded.status).toBe(201);
    const id = uploaded.body.data.asset.id as string;
    const url = uploaded.body.data.url as string;

    await prisma.course.create({
      data: {
        title: "In-use course",
        slug: `media-in-use-${Date.now()}`,
        description: "Uses the uploaded photo.",
        thumbnailUrl: url,
      },
    });

    const blocked = await agent.delete(`/api/v1/media/${id}`);
    expect(blocked.status).toBe(409);
    expect(blocked.body.error.message).toMatch(/In-use course/);

    const stillThere = await request(app).get(url);
    expect(stillThere.status).toBe(200);
  });

  it("forbids customers from listing the library", async () => {
    await registerAdmin();
    const agent = await registerCustomer();
    const listed = await agent.get("/api/v1/media");
    expect(listed.status).toBe(403);
  });
});
