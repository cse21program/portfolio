import { describe, expect, it } from "vitest";
import {
  isEmbedRef,
  isLinkHref,
  isMediaRef,
  parseEtag,
  profileEtag,
} from "../../src/modules/portfolio/portfolio.media";

describe("portfolio media rules", () => {
  it("accepts https and site paths for media", () => {
    expect(isMediaRef("/images/profile.png")).toBe(true);
    expect(isMediaRef("https://cdn.example.com/cover.jpg")).toBe(true);
    expect(isMediaRef("http://cdn.example.com/cover.jpg")).toBe(false);
    expect(isMediaRef("javascript:alert(1)")).toBe(false);
    expect(isMediaRef("//evil.example/x")).toBe(false);
  });

  it("allows only YouTube and Vimeo embeds", () => {
    expect(isEmbedRef("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(true);
    expect(isEmbedRef("https://youtu.be/dQw4w9WgXcQ")).toBe(true);
    expect(isEmbedRef("https://vimeo.com/123456789")).toBe(true);
    expect(isEmbedRef("https://example.com/watch")).toBe(false);
    expect(isEmbedRef("/videos/intro.mp4")).toBe(false);
  });

  it("accepts mailto and https links", () => {
    expect(isLinkHref("mailto:hello@rezaul.dev")).toBe(true);
    expect(isLinkHref("https://github.com/swe-rezaul-karim")).toBe(true);
    expect(isLinkHref("javascript:alert(1)")).toBe(false);
  });

  it("parses version ETags", () => {
    expect(profileEtag(3)).toBe('"3"');
    expect(parseEtag('"3"')).toBe(3);
    expect(parseEtag('W/"3"')).toBe(3);
    expect(parseEtag(undefined)).toBeNull();
  });
});
