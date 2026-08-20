import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getMediaObject, putMediaObject, deleteMediaObject, setMediaS3Client } from "../../src/modules/media/media.s3";

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

const PNG = Buffer.from("png-bytes");

afterEach(() => {
  setMediaS3Client(undefined);
});

describe("media S3 store", () => {
  it("puts the staged file under media/", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "portfolio-s3-"));
    const filePath = path.join(dir, "photo.png");
    fs.writeFileSync(filePath, PNG);

    const send = vi.fn().mockResolvedValue({});
    setMediaS3Client({ send });

    await putMediaObject("7f3c1b2a-4d5e-4f6a-8b9c-0d1e2f3a4b5c.png", filePath, "image/png");

    expect(send).toHaveBeenCalledOnce();
    expect(send.mock.calls[0][0].input).toMatchObject({
      Bucket: "portfolio-uploads-test",
      Key: "media/7f3c1b2a-4d5e-4f6a-8b9c-0d1e2f3a4b5c.png",
      ContentType: "image/png",
      Body: PNG,
      ContentLength: PNG.length,
    });

    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("returns the object body for a stored file", async () => {
    const send = vi.fn().mockResolvedValue({
      Body: Readable.from(PNG),
      ContentType: "image/png",
      ContentLength: PNG.length,
    });
    setMediaS3Client({ send });

    const object = await getMediaObject("7f3c1b2a-4d5e-4f6a-8b9c-0d1e2f3a4b5c.png");
    expect(object?.contentType).toBe("image/png");
    expect(object?.contentLength).toBe(PNG.length);

    const chunks: Buffer[] = [];
    for await (const chunk of object!.body) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    expect(Buffer.concat(chunks)).toEqual(PNG);
  });

  it("gives up when S3 never answers", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "portfolio-s3-"));
    const filePath = path.join(dir, "photo.png");
    fs.writeFileSync(filePath, PNG);
    setMediaS3Client({ send: () => new Promise(() => undefined) });

    const started = Date.now();
    await expect(
      putMediaObject("7f3c1b2a-4d5e-4f6a-8b9c-0d1e2f3a4b5c.png", filePath, "image/png"),
    ).rejects.toThrow("s3_timeout");
    expect(Date.now() - started).toBeLessThan(1500);

    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("returns null when the object is missing", async () => {
    const missing = Object.assign(new Error("missing"), {
      name: "NoSuchKey",
      $metadata: { httpStatusCode: 404 },
    });
    setMediaS3Client({ send: vi.fn().mockRejectedValue(missing) });

    await expect(getMediaObject("7f3c1b2a-4d5e-4f6a-8b9c-0d1e2f3a4b5c.png")).resolves.toBeNull();
  });

  it("deletes an object from the bucket", async () => {
    const send = vi.fn().mockResolvedValue({});
    setMediaS3Client({ send });
    await deleteMediaObject("7f3c1b2a-4d5e-4f6a-8b9c-0d1e2f3a4b5c.png");
    expect(send).toHaveBeenCalledOnce();
    expect(send.mock.calls[0][0].input).toMatchObject({
      Bucket: "portfolio-uploads-test",
      Key: "media/7f3c1b2a-4d5e-4f6a-8b9c-0d1e2f3a4b5c.png",
    });
  });
});
