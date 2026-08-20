import { describe, expect, it } from "vitest";
import { dateValue, priceBandOf, yearFromDate } from "../../src/modules/search/search.filters";
import {
  haystackOf,
  matchesNeedle,
  rankMatch,
  sortCandidates,
  sortHits,
  takeGroup,
  type SearchHit,
} from "../../src/modules/search/search.types";

const hits: SearchHit[] = [
  {
    kind: "tutorial",
    title: "Docker complete tutorial",
    href: "/tutorials/docker-complete",
    summary: "Images and containers.",
    meta: "Docker",
  },
  {
    kind: "tutorial",
    title: "JWT access control",
    href: "/tutorials/jwt-api-security",
    summary: "Tokens.",
    meta: "Spring Boot",
  },
];

describe("search helpers", () => {
  it("matches a needle against a joined haystack", () => {
    expect(matchesNeedle(haystackOf(["Docker complete", ["Compose"], ""]), "docker")).toBe(true);
    expect(matchesNeedle(haystackOf(["JWT access control"]), "transport for claims")).toBe(false);
  });

  it("ranks exact and prefix title matches first", () => {
    expect(rankMatch("Docker", "docker")).toBe(4);
    expect(rankMatch("Docker complete tutorial", "docker")).toBe(3);
    const ranked = sortHits(hits, "docker");
    expect(ranked[0]?.href).toBe("/tutorials/docker-complete");
  });

  it("drops empty groups and keeps title matches first", () => {
    expect(takeGroup("blog", [], "docker")).toBeNull();
    const group = takeGroup("tutorial", hits, "docker");
    expect(group?.label).toBe("Tutorials");
    expect(group?.items.map((item) => item.href)).toEqual([
      "/tutorials/docker-complete",
      "/tutorials/jwt-api-security",
    ]);
  });

  it("reads years and paid price bands from catalog fields", () => {
    expect(yearFromDate("2025-11-18")).toBe("2025");
    expect(yearFromDate("2025")).toBe("2025");
    expect(priceBandOf(true, 0)).toBe("free");
    expect(priceBandOf(false, 2900)).toBe("under-50");
    expect(priceBandOf(false, 9900)).toBe("50-199");
    expect(priceBandOf(false, 40000)).toBe("200-plus");
  });

  it("can sort matches by date instead of title rank", () => {
    const dated = [
      { ...hits[0]!, publishedAt: "2026-06-02", popularity: 0 },
      { ...hits[1]!, publishedAt: "2026-08-01", popularity: 0 },
    ];
    expect(sortCandidates(dated, "docker", "newest")[0]?.href).toBe("/tutorials/jwt-api-security");
    expect(dateValue("2026-08-01") > dateValue("2026-06-02")).toBe(true);
  });
});
