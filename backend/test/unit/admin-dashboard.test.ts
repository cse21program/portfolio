import { describe, expect, it } from "vitest";
import { moneyLabel, orderStatusMeta } from "../../src/modules/admin/admin.types";

describe("admin dashboard labels", () => {
  it("formats paid totals in USD", () => {
    expect(moneyLabel(0)).toBe("$0");
    expect(moneyLabel(9900)).toBe("$99");
    expect(moneyLabel(132800)).toBe("$1,328");
    expect(moneyLabel(1299)).toBe("$12.99");
  });

  it("labels order statuses for the recent-orders list", () => {
    expect(orderStatusMeta("pending_payment")).toBe("Pending payment");
    expect(orderStatusMeta("processing")).toBe("Processing");
    expect(orderStatusMeta("paid")).toBe("Paid");
    expect(orderStatusMeta("failed")).toBe("Payment failed");
    expect(orderStatusMeta("canceled")).toBe("Canceled");
    expect(orderStatusMeta("refunded")).toBe("Refunded");
  });
});
