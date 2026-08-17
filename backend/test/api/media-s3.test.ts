import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../../src/app";
import { setMediaS3Client } from "../../src/modules/media/media.s3";

vi.mock("@common/config/env", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../../src/common/config/env")>();
  return {
    ...mod,
    env: {
      ...mod.env,
      S3_UPLOADS_BUCKET: "portfolio-uploads-test",
    },
  };
});

const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

const uploadDir = fs.mkdtempSync(path.join(os.tmpdir(), "portfolio-s3-uploads-"));
process.env.UPLOAD_DIR = uploadDir;

const objects = new Map<string, Buffer>();

async function bodyToBuffer(body: unknown) {
  if (Buffer.isBuffer(body)) {
    return body;
  }
  if (body instanceof Readable) {
    const chunks: Buffer[] = [];
    for await (const chunk of body) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }
  throw new Error("unknown s3 body");
}

function installMemoryS3() {
  objects.clear();
  setMediaS3Client({
    send: async (command) => {
      const input = (command as { constructor: { name: string }; input: { Key?: string; Body?: unknown } }).input;
      const name = (command as { constructor: { name: string } }).constructor.name;
      const key = String(input.Key ?? "");
      if (name === "PutObjectCommand") {
        objects.set(key, await bodyToBuffer(input.Body));
        return {};
      }
      if (name === "GetObjectCommand") {
        const stored = objects.get(key);
        if (!stored) {
          throw Object.assign(new Error("missing"), {
            name: "NoSuchKey",
            $metadata: { httpStatusCode: 404 },
          });
        }
        return {
          Body: Readable.from(stored),
          ContentLength: stored.length,
          ContentType: "image/png",
        };
      }
      throw new Error(`unexpected command ${name}`);
    },
  });
}

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

describe("media S3 upload API", () => {
  beforeAll(() => {
    fs.mkdirSync(uploadDir, { recursive: true });
  });

  beforeEach(() => {
    installMemoryS3();
    for (const name of fs.readdirSync(uploadDir)) {
      fs.rmSync(path.join(uploadDir, name), { force: true });
    }
  });

  afterAll(() => {
    setMediaS3Client(undefined);
    fs.rmSync(uploadDir, { recursive: true, force: true });
  });

  it("stores an admin upload in S3 and serves it from there", async () => {
    const agent = await registerAdmin();

    const uploaded = await agent
      .post("/api/v1/media?kind=image")
      .attach("file", PNG_1X1, { filename: "photo.png", contentType: "image/png" });

    expect(uploaded.status).toBe(201);
    expect(uploaded.body.data.url).toMatch(/^\/api\/v1\/media\/files\/.+\.png$/);
    await vi.waitFor(() => {
      expect(objects.size).toBe(1);
    });
    expect([...objects.keys()][0]).toMatch(/^media\/.+\.png$/);
    await vi.waitFor(() => {
      expect(fs.readdirSync(uploadDir)).toEqual([]);
    });

    const served = await request(app).get(uploaded.body.data.url);
    expect(served.status).toBe(200);
    expect(served.headers["content-type"]).toMatch(/image\/png/);
    expect(served.body).toEqual(PNG_1X1);
  });

  it("still returns JSON when S3 never answers", async () => {
    setMediaS3Client({
      send: () => new Promise(() => undefined),
    });

    const agent = await registerAdmin();
    const started = Date.now();
    const uploaded = await agent
      .post("/api/v1/media?kind=image")
      .attach("file", PNG_1X1, { filename: "photo.png", contentType: "image/png" });

    expect(uploaded.status).toBe(201);
    expect(uploaded.headers["content-type"]).toMatch(/json/);
    expect(uploaded.body.success).toBe(true);
    expect(fs.readdirSync(uploadDir)).toHaveLength(1);
    expect(Date.now() - started).toBeLessThan(2000);

    const served = await request(app).get(uploaded.body.data.url);
    expect(served.status).toBe(200);
    expect(served.body).toEqual(PNG_1X1);
  });

  it("keeps the upload on disk when S3 put fails", async () => {
    setMediaS3Client({
      send: async (command) => {
        const name = (command as { constructor: { name: string } }).constructor.name;
        if (name === "PutObjectCommand") {
          throw Object.assign(new Error("NoSuchBucket"), { name: "NoSuchBucket" });
        }
        throw Object.assign(new Error("missing"), {
          name: "NoSuchKey",
          $metadata: { httpStatusCode: 404 },
        });
      },
    });

    const agent = await registerAdmin();
    const uploaded = await agent
      .post("/api/v1/media?kind=image")
      .attach("file", PNG_1X1, { filename: "photo.png", contentType: "image/png" });

    expect(uploaded.status).toBe(201);
    expect(fs.readdirSync(uploadDir)).toHaveLength(1);

    const served = await request(app).get(uploaded.body.data.url);
    expect(served.status).toBe(200);
    expect(served.body).toEqual(PNG_1X1);
  });
});
