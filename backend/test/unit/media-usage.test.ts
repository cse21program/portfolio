import { describe, expect, it } from "vitest";
import { filenameFromMediaUrl } from "../../src/modules/media/media.usage";

describe("media usage", () => {
  it("extracts stored filenames from public and API media URLs", () => {
    const filename = "7f3c1b2a-4d5e-4f6a-8b9c-0d1e2f3a4b5c.png";
    expect(filenameFromMediaUrl(`/api/v1/media/files/${filename}`)).toBe(filename);
    expect(filenameFromMediaUrl(`https://example.com/api/v1/media/files/${filename}`)).toBe(filename);
    expect(filenameFromMediaUrl("https://cdn.example.com/other.png")).toBeNull();
    expect(filenameFromMediaUrl("../secret.png")).toBeNull();
    expect(filenameFromMediaUrl("")).toBeNull();
  });

  it("does not keep lastIndex across calls", () => {
    const filename = "8f3c1b2a-4d5e-4f6a-8b9c-0d1e2f3a4b5c.jpg";
    const url = `/media/files/${filename}`;
    expect(filenameFromMediaUrl(url)).toBe(filename);
    expect(filenameFromMediaUrl(url)).toBe(filename);
  });
});
