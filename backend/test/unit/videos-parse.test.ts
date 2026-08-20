import { describe, expect, it } from "vitest";
import {
  isDirectVideoUrl,
  isLibraryVideoUrl,
  parseVideoSource,
  vimeoVideoId,
  youtubeVideoId,
} from "../../src/modules/videos/videos.parse";

describe("video source parsing", () => {
  it("normalizes YouTube watch, short, and embed URLs", () => {
    expect(youtubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(youtubeVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(parseVideoSource("https://www.youtube.com/embed/dQw4w9WgXcQ")).toMatchObject({
      provider: "youtube",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    });
    expect(parseVideoSource("https://www.youtube.com/shorts/dQw4w9WgXcQ")?.url).toBe(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    );
  });

  it("normalizes Vimeo URLs", () => {
    expect(vimeoVideoId("https://vimeo.com/123456789")).toBe("123456789");
    expect(parseVideoSource("https://player.vimeo.com/video/123456789")).toMatchObject({
      provider: "vimeo",
      url: "https://vimeo.com/123456789",
      embedUrl: "https://player.vimeo.com/video/123456789",
    });
  });

  it("accepts a direct MP4 or WebM link and rejects library files and pages", () => {
    expect(isDirectVideoUrl("https://cdn.example.com/promo.mp4")).toBe(true);
    expect(parseVideoSource("https://cdn.example.com/promo.mp4")?.provider).toBe("url");
    expect(isLibraryVideoUrl("/api/v1/media/files/7f3c1b2a-4d5e-4f6a-8b9c-0d1e2f3a4b5c.mp4")).toBe(true);
    expect(parseVideoSource("/api/v1/media/files/7f3c1b2a-4d5e-4f6a-8b9c-0d1e2f3a4b5c.mp4")).toBeNull();
    expect(parseVideoSource("https://example.com/about")).toBeNull();
  });
});
