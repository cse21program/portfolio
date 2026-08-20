import { describe, expect, it } from "vitest";
import { asMediaKind, toMediaAssetRecord } from "../../src/modules/media/media.types";

describe("media types", () => {
  it("maps stored rows onto library records", () => {
    expect(asMediaKind("video")).toBe("video");
    expect(asMediaKind("document")).toBe("document");
    expect(asMediaKind("other")).toBe("image");

    const record = toMediaAssetRecord({
      id: "media-1",
      filename: "a.png",
      originalName: "headshot.png",
      kind: "image",
      contentType: "image/png",
      sizeBytes: 12,
      url: "/api/v1/media/files/a.png",
      alt: "Portrait",
      caption: "Home",
      createdAt: new Date("2026-08-20T00:00:00.000Z"),
      updatedAt: new Date("2026-08-20T00:00:00.000Z"),
    });

    expect(record.alt).toBe("Portrait");
    expect(record.createdAt).toBe("2026-08-20T00:00:00.000Z");
    expect(record.usedIn).toEqual([]);
  });
});
