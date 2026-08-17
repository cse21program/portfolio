import { describe, expect, it } from "vitest";
import { googleCallbackUrl, publicOrigin } from "../../src/modules/auth/google.callback-url";

function req(headers: Record<string, string>, protocol = "http") {
  return {
    protocol,
    get(name: string) {
      return headers[name.toLowerCase()];
    },
  };
}

describe("google callback URL", () => {
  it("uses the browser host so PKCE cookies stay first-party", () => {
    expect(
      publicOrigin(req({ host: "www.rezaulkarim.dev", "x-forwarded-proto": "https" }), "https://www.rezaulkarim.dev"),
    ).toBe("https://www.rezaulkarim.dev");
  });

  it("ignores an api-subdomain callback when the user started on the public site", () => {
    expect(
      googleCallbackUrl(req({ host: "www.rezaulkarim.dev", "x-forwarded-proto": "https" }), {
        apiPrefix: "/api/v1",
        configured: "https://api.rezaulkarim.dev/api/v1/auth/google/callback",
        fallbackOrigin: "https://www.rezaulkarim.dev",
      }),
    ).toBe("https://www.rezaulkarim.dev/api/v1/auth/google/callback");
  });

  it("keeps the configured callback when the host already matches", () => {
    expect(
      googleCallbackUrl(req({ host: "localhost:5173" }), {
        apiPrefix: "/api/v1",
        configured: "http://localhost:5173/api/v1/auth/google/callback",
        fallbackOrigin: "http://localhost:5173",
      }),
    ).toBe("http://localhost:5173/api/v1/auth/google/callback");
  });
});
