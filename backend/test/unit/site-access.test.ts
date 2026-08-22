import { describe, expect, it } from "vitest";
import { defaultPublicCatalogs, normalizePublicCatalogs } from "../../src/modules/site-access/site-access.types";

describe("public catalogs", () => {
  it("treats missing keys as live", () => {
    expect(normalizePublicCatalogs({})).toEqual(defaultPublicCatalogs);
    expect(normalizePublicCatalogs({ blogs: false }).blogs).toBe(false);
    expect(normalizePublicCatalogs({ blogs: false }).courses).toBe(true);
    expect(normalizePublicCatalogs({}).follow).toBe(true);
    expect(normalizePublicCatalogs({ follow: false }).follow).toBe(false);
    expect(normalizePublicCatalogs({}).testimonials).toBe(true);
    expect(normalizePublicCatalogs({ testimonials: false }).testimonials).toBe(false);
  });
});
