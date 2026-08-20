import { describe, expect, it } from "vitest";
import { hostedSourcesFromUsage } from "../../src/modules/videos/videos.discover";

describe("hosted video discovery", () => {
  it("indexes YouTube, Vimeo, and CDN URLs from usage keys without duplicating lowercased YouTube ids", () => {
    const urls = new Map([
      [
        "https://youtu.be/dqw4w9wgxcq",
        [{ label: "Course", href: "/admin/courses" }],
      ],
      ["youtube:dQw4w9WgXcQ", [{ label: "Course", href: "/admin/courses" }]],
      ["https://vimeo.com/123456789", [{ label: "Tutorial", href: "/admin/tutorials" }]],
      ["vimeo:123456789", [{ label: "Tutorial", href: "/admin/tutorials" }]],
      ["https://cdn.example.com/promo.mp4", [{ label: "About", href: "/admin/portfolio" }]],
      ["https://example.com/about", [{ label: "Blog", href: "/admin/blogs" }]],
    ]);

    const found = hostedSourcesFromUsage(urls);
    expect(found.map((item) => item.source.url).sort()).toEqual([
      "https://cdn.example.com/promo.mp4",
      "https://vimeo.com/123456789",
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    ]);
    expect(found.find((item) => item.source.provider === "youtube")?.usedIn).toEqual([
      { label: "Course", href: "/admin/courses" },
    ]);
  });
});
