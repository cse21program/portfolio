import { describe, expect, it } from "vitest";
import { allowedOrigins, cookieDomainFromFrontend, stripWwwHost } from "../../src/common/utils/origins";

describe("origins", () => {
  it("strips www from public hosts", () => {
    expect(stripWwwHost("www.rezaulkarim.dev")).toBe("rezaulkarim.dev");
    expect(stripWwwHost("rezaulkarim.dev")).toBe("rezaulkarim.dev");
    expect(stripWwwHost("localhost:5173")).toBe("localhost:5173");
  });

  it("allows the apex and www sibling from a single CORS origin", () => {
    expect(allowedOrigins("https://rezaulkarim.dev")).toEqual([
      "https://rezaulkarim.dev",
      "https://www.rezaulkarim.dev",
    ]);
    expect(allowedOrigins("https://www.rezaulkarim.dev")).toEqual([
      "https://www.rezaulkarim.dev",
      "https://rezaulkarim.dev",
    ]);
    expect(allowedOrigins("http://localhost:5173")).toEqual(["http://localhost:5173"]);
  });

  it("sets a parent cookie domain from the public site", () => {
    expect(cookieDomainFromFrontend("https://rezaulkarim.dev")).toBe(".rezaulkarim.dev");
    expect(cookieDomainFromFrontend("https://www.rezaulkarim.dev")).toBe(".rezaulkarim.dev");
    expect(cookieDomainFromFrontend("http://localhost:5173")).toBeUndefined();
  });
});
