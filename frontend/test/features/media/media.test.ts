import { describe, expect, it } from "vitest";
import { displayNameFor, formatBytes, kindForFile, maxBytesFor, sizeLimitMessage, sortMedia, summarizeLibrary } from "@/types/media";

describe("media helpers", () => {
  it("detects image, video, and PDF kinds", () => {
    expect(kindForFile(new File(["x"], "a.png", { type: "image/png" }))).toBe("image");
    expect(kindForFile(new File(["x"], "clip.mp4", { type: "video/mp4" }))).toBe("video");
    expect(kindForFile(new File(["x"], "cv.pdf", { type: "application/pdf" }))).toBe("document");
    expect(kindForFile(new File(["x"], "notes.txt", { type: "text/plain" }))).toBeNull();
  });

  it("formats sizes and limit copy", () => {
    expect(formatBytes(800)).toBe("800 B");
    expect(formatBytes(2048)).toBe("2 KB");
    expect(maxBytesFor("image")).toBe(5 * 1024 * 1024);
    expect(sizeLimitMessage("video")).toMatch(/40 MB/);
  });

  it("summarizes and sorts the library", () => {
    const assets = [
      {
        id: "a",
        filename: "a.png",
        originalName: "zeta.png",
        kind: "image" as const,
        contentType: "image/png",
        sizeBytes: 10,
        url: "/a.png",
        alt: "",
        caption: "",
        createdAt: "2026-08-20T00:00:00.000Z",
        updatedAt: "2026-08-20T00:00:00.000Z",
        usedIn: [],
      },
      {
        id: "b",
        filename: "b.pdf",
        originalName: "alpha.pdf",
        kind: "document" as const,
        contentType: "application/pdf",
        sizeBytes: 40,
        url: "/b.pdf",
        alt: "",
        caption: "",
        createdAt: "2026-08-21T00:00:00.000Z",
        updatedAt: "2026-08-21T00:00:00.000Z",
        usedIn: [],
      },
    ];

    expect(summarizeLibrary(assets)).toEqual({ totalBytes: 50, image: 1, video: 0, document: 1 });
    expect(sortMedia(assets, "name").map((item) => item.originalName)).toEqual(["alpha.pdf", "zeta.png"]);
    expect(sortMedia(assets, "largest")[0]?.id).toBe("b");
  });

  it("keeps the stored extension when renaming", () => {
    expect(displayNameFor("portrait", "a.png")).toBe("portrait.png");
    expect(displayNameFor("portrait.JPG", "a.png")).toBe("portrait.png");
    expect(displayNameFor("headshot.png", "a.png")).toBe("headshot.png");
  });
});
