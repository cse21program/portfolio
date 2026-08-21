import { describe, expect, it } from "vitest";
import { publicNav } from "@/config/navigation";
import {
  catalogForHref,
  defaultPublicCatalogs,
  normalizePublicCatalogs,
  visibleNavItems,
} from "@/types/siteAccess";

describe("public catalogs", () => {
  it("hides stopped catalogs from public navigation", () => {
    const catalogs = normalizePublicCatalogs({ blogs: false, courses: false });
    const items = visibleNavItems(publicNav, catalogs);
    expect(items.map((item) => item.href)).toEqual(["/about", "/projects", "/skills", "/services"]);
    expect(catalogForHref("/blog/jwt")).toBe("blogs");
    expect(catalogForHref("/course-certificates/abc")).toBeNull();
  });

  it("keeps catalogs live by default", () => {
    expect(normalizePublicCatalogs(undefined)).toEqual(defaultPublicCatalogs);
  });
});
