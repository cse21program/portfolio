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
  it("uses the apex host so PKCE cookies stay first-party", () => {
    expect(
      publicOrigin(req({ host: "www.rezaulkarim.dev", "x-forwarded-proto": "https" }), "https://rezaulkarim.dev"),
    ).toBe("https://rezaulkarim.dev");
  });

  it("builds the callback on the public site, not the api subdomain", () => {
    expect(
      googleCallbackUrl(req({ host: "www.rezaulkarim.dev", "x-forwarded-proto": "https" }), {
        apiPrefix: "/api/v1",
        fallbackOrigin: "https://rezaulkarim.dev",
      }),
    ).toBe("https://rezaulkarim.dev/api/v1/auth/google/callback");
  });

  it("keeps localhost callbacks on the same host", () => {
    expect(
      googleCallbackUrl(req({ host: "localhost:5173" }), {
        apiPrefix: "/api/v1",
        fallbackOrigin: "http://localhost:5173",
      }),
    ).toBe("http://localhost:5173/api/v1/auth/google/callback");
  });
});
