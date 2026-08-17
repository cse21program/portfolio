import { describe, expect, it } from "vitest";
import { isBlankResume, suggestedResumeDraft } from "@/features/resume/suggested";
import { fallbackResume } from "@/types/resume";

describe("suggested resume draft", () => {
  it("treats an unused resume as blank", () => {
    expect(isBlankResume(fallbackResume)).toBe(true);
    expect(isBlankResume({ ...fallbackResume, headline: "Engineer" })).toBe(false);
  });

  it("includes a headline and linked publications", () => {
    expect(suggestedResumeDraft.headline).toBe("Software Engineer");
    expect(suggestedResumeDraft.publications.length).toBeGreaterThan(0);
    expect(suggestedResumeDraft.publications[0]?.href).toMatch(/^\/blog\//);
  });
});
