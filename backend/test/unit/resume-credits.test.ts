import { describe, expect, it } from "vitest";
import { parseCredits } from "../../src/modules/portfolio/resume.types";

describe("resume credits", () => {
  it("keeps named awards and drops empty titles", () => {
    expect(
      parseCredits([
        { title: "Best paper", detail: "IEEE", year: "2023", href: "https://example.com/paper" },
        { title: "  ", detail: "Nope" },
        { title: "Scholarship" },
      ]),
    ).toEqual([
      { title: "Best paper", detail: "IEEE", year: "2023", href: "https://example.com/paper" },
      { title: "Scholarship", detail: "", year: "", href: null },
    ]);
  });
});
