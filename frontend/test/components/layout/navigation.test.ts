import { describe, expect, it } from "vitest";
import { groupHasPath, isNavItemActive, morePages } from "@/config/navigation";

describe("navigation helpers", () => {
  it("treats nested paths as active unless the item is exact", () => {
    expect(isNavItemActive("/admin/projects", "/admin/projects/new")).toBe(true);
    expect(isNavItemActive("/admin", "/admin/projects", true)).toBe(false);
    expect(isNavItemActive("/admin", "/admin", true)).toBe(true);
  });

  it("keeps Search out of the More list", () => {
    expect(
      morePages([
        { label: "Search", href: "/search" },
        { label: "Resume", href: "/resume" },
      ]).map((item) => item.href),
    ).toEqual(["/resume"]);
  });

  it("marks a group current when a child matches", () => {
    const items = [
      { label: "Projects", href: "/admin/projects" },
      { label: "About", href: "/admin/portfolio" },
    ];
    expect(groupHasPath(items, "/admin/projects/alpha")).toBe(true);
    expect(groupHasPath(items, "/admin/courses")).toBe(false);
  });
});
