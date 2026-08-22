import { describe, expect, it } from "vitest";
import { newlyLiveItems } from "../../src/modules/follows/follows.fanout";

function live(item: { status: string }) {
  return item.status === "published";
}

describe("newlyLiveItems", () => {
  it("returns only slugs that became live", () => {
    const previous = [
      { slug: "kept", status: "published", publishedAt: "2026-01-01" },
      { slug: "draft", status: "draft", publishedAt: "" },
    ];
    const next = [
      { slug: "kept", status: "published", publishedAt: "2026-01-01" },
      { slug: "draft", status: "published", publishedAt: "2026-08-22" },
      { slug: "fresh", status: "published", publishedAt: "2026-08-22" },
    ];

    expect(newlyLiveItems(previous, next, live).map((item) => item.slug)).toEqual(["draft", "fresh"]);
  });

  it("does not treat an unpublish as a new live item", () => {
    const previous = [{ slug: "gone", status: "published", publishedAt: "2026-01-01" }];
    const next = [{ slug: "gone", status: "draft", publishedAt: "2026-01-01" }];
    expect(newlyLiveItems(previous, next, live)).toEqual([]);
  });
});
