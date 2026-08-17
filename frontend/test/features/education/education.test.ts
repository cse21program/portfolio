import { describe, expect, it } from "vitest";
import {
  displayEducationEndDate,
  listFromLines,
  normalizeEducation,
  normalizeEducationList,
} from "@/types/education";

describe("education helpers", () => {
  it("treats current study as Present when the end date is blank", () => {
    expect(
      displayEducationEndDate({
        institution: "LU",
        degree: "B.Sc.",
        field: "CSE",
        startDate: "2021",
        endDate: "",
        current: true,
        grade: "",
        location: "",
        description: "",
        achievements: [],
      }),
    ).toBe("Present");
  });

  it("normalizes list order and trims fields", () => {
    const items = normalizeEducationList([
      {
        institution: "  Acme University  ",
        degree: " B.Sc. ",
        field: " CS ",
        startDate: "2021",
        endDate: "",
        current: true,
        grade: " 3.8 ",
        location: "Remote",
        description: " Software ",
        achievements: [" Ship ", ""],
      },
    ]);

    expect(items[0]?.institution).toBe("Acme University");
    expect(items[0]?.field).toBe("CS");
    expect(items[0]?.description).toBe("Software");
    expect(items[0]?.achievements).toEqual(["Ship"]);
    expect(items[0]?.grade).toBe("3.8");
    expect(items[0]?.sortOrder).toBe(0);
  });

  it("splits editor lines and keeps an institution website", () => {
    expect(listFromLines("Dean list\nLab work\n")).toEqual(["Dean list", "Lab work"]);
    expect(
      normalizeEducation({
        institution: "LU",
        degree: "B.Sc.",
        field: "CSE",
        website: " https://www.lus.ac.bd/ ",
      }).website,
    ).toBe("https://www.lus.ac.bd/");
  });
});
