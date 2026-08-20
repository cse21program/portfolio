import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { decryptCredentials, encryptCredentials } from "../../src/modules/payments/providers/crypto";
import { hasLiveCredentials, mergeCredentials } from "../../src/modules/payments/providers/catalog";
import { verifyStripeSignature } from "../../src/modules/payments/gateways/stripe-signature";

describe("payment credentials", () => {
  it("round-trips encrypted secrets", () => {
    const stored = encryptCredentials({ secretKey: "sk_test_123", webhookSecret: "whsec_abc" });
    expect(stored).toContain(":");
    expect(decryptCredentials(stored)).toEqual({ secretKey: "sk_test_123", webhookSecret: "whsec_abc" });
  });

  it("keeps existing secrets when a PATCH field is blank", () => {
    expect(
      mergeCredentials(
        { secretKey: "sk_live_old", webhookSecret: "whsec_old" },
        { secretKey: "", publishableKey: "pk_new" },
        ["secretKey", "webhookSecret"],
      ),
    ).toEqual({
      secretKey: "sk_live_old",
      webhookSecret: "whsec_old",
      publishableKey: "pk_new",
    });
  });

  it("clears optional bank text when a PATCH field is blank", () => {
    expect(
      mergeCredentials(
        { bankName: "HSBC", accountName: "Rezaul", accountNumber: "123", branch: "Canary Wharf" },
        { branch: "" },
      ),
    ).toEqual({
      bankName: "HSBC",
      accountName: "Rezaul",
      accountNumber: "123",
    });
  });

  it("requires Stripe live keys", () => {
    expect(hasLiveCredentials("stripe", { secretKey: "sk_test", webhookSecret: "whsec" })).toBe(true);
    expect(hasLiveCredentials("stripe", { secretKey: "sk_test" })).toBe(false);
  });

  it("requires bank account details for live", () => {
    expect(
      hasLiveCredentials("bank", {
        bankName: "HSBC",
        accountName: "Rezaul Karim",
        accountNumber: "12345678",
      }),
    ).toBe(true);
    expect(hasLiveCredentials("bank", { bankName: "HSBC" })).toBe(false);
  });
});

describe("Stripe webhook signatures", () => {
  it("accepts a fresh signed payload", () => {
    const secret = "whsec_test";
    const rawBody = '{"id":"evt_1"}';
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
    expect(() => verifyStripeSignature(rawBody, `t=${timestamp},v1=${signature}`, secret)).not.toThrow();
  });

  it("rejects a missing header", () => {
    expect(() => verifyStripeSignature("{}", undefined, "whsec_test")).toThrow(/Missing Stripe signature/);
  });
});
