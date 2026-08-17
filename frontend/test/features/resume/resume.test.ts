import { describe, expect, it } from "vitest";
import { normalizeCredits, normalizeResume, pdfDownloadHref } from "@/types/resume";

describe("resume helpers", () => {
  it("drops empty credit titles", () => {
    expect(
      normalizeCredits([
        { title: "Best paper", detail: "IEEE", year: "2023", href: "https://example.com" },
        { title: "  ", detail: "Nope" },
        { title: "Scholarship" },
      ]),
    ).toEqual([
      { title: "Best paper", detail: "IEEE", year: "2023", href: "https://example.com" },
      { title: "Scholarship", detail: "", year: "", href: null },
    ]);
  });

  it("normalizes a partial resume payload", () => {
    expect(
      normalizeResume({
        headline: "  Engineer  ",
        awards: [{ title: "Grant", detail: "", year: "", href: null }],
        version: 4,
      }),
    ).toMatchObject({
      headline: "Engineer",
      summary: null,
      awards: [{ title: "Grant", detail: "", year: "", href: null }],
      pdfUrl: null,
      version: 4,
    });
  });

  it("builds a download URL for a stored PDF", () => {
    expect(pdfDownloadHref("/api/v1/media/files/file.pdf", "rezaul-cv.pdf")).toBe(
      "/api/v1/media/files/file.pdf?download=1&name=rezaul-cv.pdf",
    );
  });
});
