import { describe, expect, it } from "vitest";
import { parseDurationMs } from "@common/utils/duration";
import { generateToken, hashToken } from "@common/utils/crypto";

describe("parseDurationMs", () => {
  it("parses minute and day values", () => {
    expect(parseDurationMs("15m")).toBe(15 * 60_000);
    expect(parseDurationMs("7d")).toBe(7 * 86_400_000);
  });

  it("rejects invalid input", () => {
    expect(() => parseDurationMs("15 minutes")).toThrow(/Invalid duration/);
  });
});

describe("token helpers", () => {
  it("hashes the same token consistently", () => {
    const token = generateToken();
    expect(hashToken(token)).toBe(hashToken(token));
    expect(hashToken(token)).not.toBe(hashToken(`${token}x`));
  });
});
