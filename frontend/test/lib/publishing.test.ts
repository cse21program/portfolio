import { describe, expect, it } from "vitest";
import { parseRichBody } from "@/lib/richText";
import { previewHref, isLiveContent } from "@/lib/publishing";

describe("rich text", () => {
  it("parses headings, lists, quotes, code, tables, images, and video", () => {
    const blocks = parseRichBody([
      "## Heading",
      "A paragraph with **bold**.",
      "- One\n- Two",
      "1. First\n2. Second",
      "> Quoted",
      "```ts\nconst ok = true;\n```",
      "| A | B |\n| --- | --- |\n| 1 | 2 |",
      "![Diagram](/media/diagram.png)",
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "video: https://vimeo.com/123",
    ]);

    expect(blocks.map((block) => block.type)).toEqual([
      "heading",
      "paragraph",
      "list",
      "ordered-list",
      "callout",
      "code",
      "table",
      "image",
      "video",
      "video",
    ]);
  });
});

describe("publishing helpers", () => {
  it("appends preview=1 without dropping a hash", () => {
    expect(previewHref("/blog/draft")).toBe("/blog/draft?preview=1");
    expect(previewHref("/tutorials/docker#intro")).toBe("/tutorials/docker?preview=1#intro");
  });

  it("treats scheduled content as live after the stamp", () => {
    expect(isLiveContent({ status: "scheduled", publishedAt: "2020-01-01" })).toBe(true);
    expect(isLiveContent({ status: "draft" })).toBe(false);
  });
});
