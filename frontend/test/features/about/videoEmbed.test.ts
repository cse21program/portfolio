import { describe, expect, it } from "vitest";
import { toEmbedUrl, withAutoplay, youtubePosterUrl } from "@/features/about/videoEmbed";

describe("toEmbedUrl", () => {
  it("converts YouTube watch and short links", () => {
    expect(toEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
    );
    expect(toEmbedUrl("https://youtu.be/dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
    );
    expect(toEmbedUrl("https://www.youtube.com/watch?si=share&v=dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
    );
    expect(toEmbedUrl("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
    );
    expect(toEmbedUrl("https://m.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
    );
  });

  it("converts Vimeo links", () => {
    expect(toEmbedUrl("https://vimeo.com/123456789")).toBe(
      "https://player.vimeo.com/video/123456789",
    );
  });

  it("returns null for empty or unknown URLs", () => {
    expect(toEmbedUrl("")).toBeNull();
    expect(toEmbedUrl("https://example.com/video.mp4")).toBeNull();
  });
});

describe("embed helpers", () => {
  it("builds a YouTube poster and autoplay URL", () => {
    const embed = "https://www.youtube.com/embed/dQw4w9WgXcQ";
    expect(youtubePosterUrl(embed)).toBe("https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg");
    expect(withAutoplay(embed)).toContain("autoplay=1");
    expect(withAutoplay(embed)).toContain("rel=0");
    expect(withAutoplay(embed)).not.toContain("origin=");
  });

  it("returns null for non-YouTube posters", () => {
    expect(youtubePosterUrl("https://player.vimeo.com/video/123")).toBeNull();
  });
});
