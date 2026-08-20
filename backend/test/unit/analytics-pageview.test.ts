import { describe, expect, it } from "vitest";
import { isAutomatedClient, sanitizeViewPath } from "../../src/modules/analytics/analytics.service";

describe("pageview path sanitization", () => {
  it("accepts site paths and rejects URLs", () => {
    expect(sanitizeViewPath("/")).toBe("/");
    expect(sanitizeViewPath("/courses/spring-boot-masterclass")).toBe("/courses/spring-boot-masterclass");
    expect(sanitizeViewPath("https://example.com/")).toBeNull();
    expect(sanitizeViewPath("//evil.example")).toBeNull();
    expect(sanitizeViewPath("../secret")).toBeNull();
    expect(sanitizeViewPath("courses")).toBeNull();
  });

  it("ignores studio, account, and API paths", () => {
    expect(sanitizeViewPath("/admin")).toBeNull();
    expect(sanitizeViewPath("/admin/orders")).toBeNull();
    expect(sanitizeViewPath("/dashboard")).toBeNull();
    expect(sanitizeViewPath("/login")).toBeNull();
    expect(sanitizeViewPath("/register")).toBeNull();
    expect(sanitizeViewPath("/forgot-password")).toBeNull();
    expect(sanitizeViewPath("/reset-password")).toBeNull();
    expect(sanitizeViewPath("/verify-email")).toBeNull();
    expect(sanitizeViewPath("/api/v1/courses")).toBeNull();
  });
});

describe("automated clients", () => {
  it("skips crawlers and leaves browsers through", () => {
    expect(isAutomatedClient("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)")).toBe(false);
    expect(isAutomatedClient("Googlebot/2.1")).toBe(true);
    expect(isAutomatedClient("facebookexternalhit/1.1")).toBe(true);
    expect(isAutomatedClient("Slackbot-LinkExpanding 1.0")).toBe(true);
    expect(isAutomatedClient("curl/8.0")).toBe(true);
    expect(isAutomatedClient("HeadlessChrome")).toBe(true);
  });
});
