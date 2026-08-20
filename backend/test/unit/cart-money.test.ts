import { describe, expect, it } from "vitest";
import { formatUsd, parsePriceCents } from "../../src/modules/cart/cart.money";

describe("cart money", () => {
  it("parses catalog price labels", () => {
    expect(parsePriceCents("$149")).toBe(14900);
    expect(parsePriceCents("$1,200")).toBe(120000);
    expect(parsePriceCents("$99.50")).toBe(9950);
    expect(parsePriceCents("Free")).toBeNull();
    expect(parsePriceCents("$60 / hour")).toBeNull();
  });

  it("formats dollar amounts the way the catalog does", () => {
    expect(formatUsd(0)).toBe("$0");
    expect(formatUsd(9900)).toBe("$99");
    expect(formatUsd(120000)).toBe("$1,200");
    expect(formatUsd(9950)).toBe("$99.50");
  });
});
