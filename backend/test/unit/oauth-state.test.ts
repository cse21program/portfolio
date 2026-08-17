import { describe, expect, it } from "vitest";
import { rememberOAuth, takeOAuth } from "../../src/modules/auth/oauth-state";

describe("oauth pending state", () => {
  it("returns and consumes a stored verifier", () => {
    rememberOAuth("state-a", {
      verifier: "verifier-a",
      redirectUri: "https://www.example.com/api/v1/auth/google/callback",
      next: "/admin",
    });

    expect(takeOAuth("state-a")).toMatchObject({
      verifier: "verifier-a",
      next: "/admin",
    });
    expect(takeOAuth("state-a")).toBeUndefined();
  });
});
