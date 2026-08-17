import { describe, expect, it } from "vitest";
import {
  displayEndDate,
  listFromLines,
  normalizeExperience,
  normalizeExperienceList,
} from "@/types/experience";

describe("experience helpers", () => {
  it("treats current roles as Present when the end date is blank", () => {
    expect(
      displayEndDate({
        company: "Independent",
        position: "Engineer",
        type: "Freelance",
        location: "",
        startDate: "2024",
        endDate: "",
        current: true,
        description: "",
        responsibilities: [],
        achievements: [],
        technologies: [],
      }),
    ).toBe("Present");
  });

  it("normalizes list order and trims fields", () => {
    const items = normalizeExperienceList([
      {
        company: "  Acme  ",
        position: " Engineer ",
        type: "Full-time",
        location: "Remote",
        startDate: "2025",
        endDate: "",
        current: true,
        description: " APIs ",
        responsibilities: [" Ship ", ""],
        achievements: [],
        technologies: [" TypeScript "],
      },
    ]);

    expect(items[0]?.company).toBe("Acme");
    expect(items[0]?.description).toBe("APIs");
    expect(items[0]?.responsibilities).toEqual(["Ship"]);
    expect(items[0]?.technologies).toEqual(["TypeScript"]);
    expect(items[0]?.sortOrder).toBe(0);
  });

  it("splits editor lines and keeps a company website", () => {
    expect(listFromLines("React\nExpress\n")).toEqual(["React", "Express"]);
    expect(normalizeExperience({ company: "LU", position: "CS", website: " https://www.lus.ac.bd/ " }).website).toBe(
      "https://www.lus.ac.bd/",
    );
  });
});
