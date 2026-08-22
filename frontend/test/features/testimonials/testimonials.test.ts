import { describe, expect, it } from "vitest";
import {
  attribution,
  featuredTestimonials,
  normalizeTestimonial,
} from "@/types/testimonials";

describe("testimonial helpers", () => {
  it("keeps featured quotes first and falls back to the first three", () => {
    const quotes = [
      normalizeTestimonial({ name: "Ada", comment: "A long enough comment.", featured: false }),
      normalizeTestimonial({ name: "Ben", comment: "Another long comment.", featured: true }),
      normalizeTestimonial({ name: "Cara", comment: "A third long comment.", featured: false }),
      normalizeTestimonial({ name: "Drew", comment: "A fourth long comment.", featured: false }),
    ];
    expect(featuredTestimonials(quotes).map((item) => item.name)).toEqual(["Ben"]);
    expect(featuredTestimonials(quotes.map((item) => ({ ...item, featured: false }))).map((item) => item.name)).toEqual([
      "Ada",
      "Ben",
      "Cara",
    ]);
  });

  it("joins position and company when both are present", () => {
    expect(attribution({ position: "Founder", company: "Studio" })).toBe("Founder, Studio");
    expect(attribution({ position: "Founder", company: "" })).toBe("Founder");
  });
});
