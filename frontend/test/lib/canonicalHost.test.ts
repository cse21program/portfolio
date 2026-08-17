import { describe, expect, it } from "vitest";
import { wwwLocation } from "@/lib/canonicalHost";

describe("wwwLocation", () => {
  it("moves the apex site to www and keeps the path", () => {
    expect(wwwLocation("https://rezaulkarim.dev/admin/portfolio")).toBe(
      "https://www.rezaulkarim.dev/admin/portfolio",
    );
    expect(wwwLocation("https://rezaulkarim.dev/api/v1/media?kind=image")).toBe(
      "https://www.rezaulkarim.dev/api/v1/media?kind=image",
    );
  });

  it("leaves www, local, and preview hosts alone", () => {
    expect(wwwLocation("https://www.rezaulkarim.dev/admin")).toBeNull();
    expect(wwwLocation("http://localhost:5173/admin")).toBeNull();
    expect(wwwLocation("https://d111111abcdef8.cloudfront.net/")).toBeNull();
  });
});
