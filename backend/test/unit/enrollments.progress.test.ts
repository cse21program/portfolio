import { describe, expect, it } from "vitest";
import { computeCourseProgress, curriculumLessons } from "../../src/modules/enrollments/enrollments.progress";

describe("course progress helpers", () => {
  const modules = [
    {
      title: "Foundations",
      lessons: [{ title: "Status codes" }, { title: "Headers" }],
    },
  ];

  it("builds stable lesson keys from module and lesson titles", () => {
    expect(curriculumLessons(modules).map((item) => item.key)).toEqual([
      "foundations/status-codes",
      "foundations/headers",
    ]);
  });

  it("disambiguates duplicate titles in the same module", () => {
    expect(
      curriculumLessons([
        { title: "Foundations", lessons: [{ title: "Notes" }, { title: "Notes" }] },
      ]).map((item) => item.key),
    ).toEqual(["foundations/notes", "foundations/notes-2"]);
  });

  it("computes remaining lessons, percent, and the current lesson", () => {
    const progress = computeCourseProgress({
      modules,
      completedKeys: ["foundations/status-codes"],
      lastActivityAt: "2026-08-19T12:00:00.000Z",
    });
    expect(progress).toMatchObject({
      lessonsTotal: 2,
      lessonsCompleted: 1,
      lessonsRemaining: 1,
      percent: 50,
      completed: false,
      currentLesson: { key: "foundations/headers", title: "Headers" },
      completedKeys: ["foundations/status-codes"],
    });
  });
});
