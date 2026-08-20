import { describe, expect, it } from "vitest";
import {
  allowedMimeMessage,
  contentTypeFor,
  extensionFor,
  isSafeFilename,
  parseKind,
  publicFileUrl,
  s3ObjectKey,
  sanitizeDisplayName,
  sanitizeDownloadName,
  usesS3,
} from "../../src/modules/media/media.storage";

describe("media storage rules", () => {
  it("parses upload kind", () => {
    expect(parseKind("image")).toBe("image");
    expect(parseKind("video")).toBe("video");
    expect(parseKind("document")).toBe("document");
    expect(parseKind("audio")).toBeNull();
  });

  it("maps allowed mime types", () => {
    expect(extensionFor("image", "image/png")).toBe("png");
    expect(extensionFor("image", "image/jpeg")).toBe("jpg");
    expect(extensionFor("image", "image/jpg")).toBe("jpg");
    expect(extensionFor("image", "application/octet-stream", "photo.png")).toBe("png");
    expect(extensionFor("video", "video/mp4")).toBe("mp4");
    expect(extensionFor("document", "application/pdf")).toBe("pdf");
    expect(extensionFor("document", "", "cv.pdf")).toBe("pdf");
    expect(extensionFor("document", "application/octet-stream", "cv.pdf")).toBe("pdf");
    expect(extensionFor("document", "text/plain", "cv.pdf")).toBeNull();
    expect(extensionFor("image", "application/pdf")).toBeNull();
    expect(extensionFor("video", "image/png")).toBeNull();
    expect(allowedMimeMessage("image")).toMatch(/JPEG/);
  });

  it("rejects path traversal filenames", () => {
    expect(isSafeFilename("7f3c1b2a-4d5e-4f6a-8b9c-0d1e2f3a4b5c.png")).toBe(true);
    expect(isSafeFilename("7f3c1b2a-4d5e-4f6a-8b9c-0d1e2f3a4b5c.pdf")).toBe(true);
    expect(isSafeFilename("../secret.png")).toBe(false);
    expect(isSafeFilename("7f3c1b2a-4d5e-4f6a-8b9c-0d1e2f3a4b5c.png.exe")).toBe(false);
    expect(contentTypeFor("photo.webp")).toBe("image/webp");
    expect(publicFileUrl("file.png")).toBe("/api/v1/media/files/file.png");
    expect(s3ObjectKey("file.png")).toBe("media/file.png");
    expect(usesS3()).toBe(false);
  });

  it("keeps image download names and still forces a PDF extension for CVs", () => {
    expect(sanitizeDownloadName("headshot.png", "file.png")).toBe("headshot.png");
    expect(sanitizeDownloadName("Rezaul CV", "resume.pdf")).toBe("Rezaul CV.pdf");
  });

  it("renames the display name and keeps the stored extension", () => {
    const stored = "7f3c1b2a-4d5e-4f6a-8b9c-0d1e2f3a4b5c.png";
    expect(sanitizeDisplayName("portrait", stored)).toBe("portrait.png");
    expect(sanitizeDisplayName("portrait.JPG", stored)).toBe("portrait.png");
    expect(sanitizeDisplayName("headshot.png", stored)).toBe("headshot.png");
    expect(sanitizeDisplayName("hero shot", stored)).toBe("hero shot.png");
  });
});
