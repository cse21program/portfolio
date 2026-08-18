import { describe, expect, it } from "vitest";
import {
  relatedBlogOptions,
  relatedCourseOptions,
  relatedTutorialOptions,
  searchRelated,
  suggestedRelated,
} from "@/features/skills/relatedOptions";

describe("related name suggestions", () => {
  it("suggests writing and courses that match the skill name", () => {
    expect(suggestedRelated(relatedBlogOptions, [], ["Docker"]).map((item) => item.slug)).toEqual([
      "docker-networking",
    ]);
    expect(suggestedRelated(relatedCourseOptions, [], ["Docker"]).map((item) => item.slug)).toEqual([
      "production-docker",
    ]);
    expect(suggestedRelated(relatedTutorialOptions, [], ["Docker"]).map((item) => item.slug)[0]).toBe(
      "docker-complete",
    );
  });

  it("searches by name instead of slug", () => {
    expect(searchRelated(relatedBlogOptions, [], "JWT").map((item) => item.slug)).toEqual([
      "jwt-authentication",
    ]);
    expect(searchRelated(relatedBlogOptions, ["jwt-authentication"], "JWT")).toEqual([]);
  });

  it("keeps the remaining catalog available after a name is chosen", () => {
    const leftover = searchRelated(relatedBlogOptions, ["jwt-authentication"], "");
    expect(leftover.map((item) => item.slug)).toContain("docker-networking");
    expect(leftover.map((item) => item.slug)).toContain("modular-monolith");
    expect(leftover.map((item) => item.slug)).not.toContain("jwt-authentication");
    expect(suggestedRelated(relatedTutorialOptions, [], ["Java", "OOP"])).toEqual([]);
    expect(searchRelated(relatedTutorialOptions, [], "").length).toBe(relatedTutorialOptions.length);
  });

  it("finds writing by slug as well as title", () => {
    expect(searchRelated(relatedBlogOptions, [], "jwt-authentication").map((item) => item.slug)).toEqual([
      "jwt-authentication",
    ]);
    expect(searchRelated(relatedBlogOptions, [], "modular-monolith")[0]?.name).toBe(
      "Start with a modular monolith",
    );
  });
});
