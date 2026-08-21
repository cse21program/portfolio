import { describe, expect, it } from "vitest";
import { isLiveContent, parseScheduleInstant } from "../../src/common/publishing";

describe("publishing", () => {
  it("treats published records as live", () => {
    expect(isLiveContent({ status: "published", publishedAt: "" })).toBe(true);
  });

  it("hides drafts and archived records", () => {
    expect(isLiveContent({ status: "draft", publishedAt: "2020-01-01" })).toBe(false);
    expect(isLiveContent({ status: "archived", publishedAt: "2020-01-01" })).toBe(false);
  });

  it("makes a scheduled date-only stamp live from the start of that day", () => {
    expect(parseScheduleInstant("2020-01-01")?.toISOString()).toBe(new Date("2020-01-01T00:00:00").toISOString());
    expect(isLiveContent({ status: "scheduled", publishedAt: "2020-01-01" })).toBe(true);
    expect(isLiveContent({ status: "scheduled", publishedAt: "2099-01-01" })).toBe(false);
  });
});
