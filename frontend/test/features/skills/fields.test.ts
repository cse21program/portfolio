import { describe, expect, it } from "vitest";
import { fieldIntroFromField, findField, normalizeFieldList, publishedFields } from "@/types/fields";

describe("field helpers", () => {
  it("normalizes order, slugs, and publication", () => {
    const items = normalizeFieldList([
      {
        name: "  Backend Development  ",
        slug: " Backend-Development ",
        summary: " APIs and services. ",
        overview: " Clear boundaries. ",
        featured: true,
        published: true,
      },
    ]);

    expect(items[0]?.name).toBe("Backend Development");
    expect(items[0]?.slug).toBe("backend-development");
    expect(items[0]?.sortOrder).toBe(0);
    expect(publishedFields([{ ...items[0]!, published: false }])).toEqual([]);
    expect(findField(items, "backend-development")?.name).toBe("Backend Development");
    expect(
      fieldIntroFromField({
        ...items[0]!,
        embedVideoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      })?.title,
    ).toBe("Backend Development introduction");
  });
});
