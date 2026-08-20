import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet } from "@/lib/api";
import { DashboardPurchasesPage } from "@/features/dashboard/DashboardPurchasesPage";
import type { CommerceOrder } from "@/types/order";
import { expandFilters } from "../../helpers/expandFilters";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    apiGet: vi.fn(),
    apiDelete: vi.fn(),
  };
});

const get = vi.mocked(apiGet);

function order(overrides: Partial<CommerceOrder> & Pick<CommerceOrder, "id" | "orderNumber" | "status">): CommerceOrder {
  return {
    userId: "user-1",
    items: [
      {
        id: `${overrides.id}-item`,
        kind: "course",
        slug: "spring-boot-masterclass",
        title: "Spring Boot masterclass",
        packageName: "",
        href: "/courses/spring-boot-masterclass",
        thumbnailUrl: null,
        unitLabel: "$99.00",
        unitCents: 9900,
        currency: "USD",
        quantity: 1,
        lineCents: 9900,
        lineLabel: "$99.00",
      },
    ],
    summary: {
      itemCount: 1,
      subtotalCents: 9900,
      subtotalLabel: "$99.00",
      discountCents: 0,
      discountLabel: "$0.00",
      taxCents: 0,
      taxLabel: "$0.00",
      totalCents: 9900,
      totalLabel: "$99.00",
      currency: "USD",
      couponCode: "",
      couponPercentOff: null,
    },
    billing: {
      name: "Ada Lovelace",
      email: "ada@example.com",
      phone: "",
      country: "United Kingdom",
      address: "12 Analytical Engine Lane",
      city: "London",
      postal: "SW1A 1AA",
    },
    paymentMethod: "bank",
    paymentMethodLabel: "Bank transfer",
    termsAccepted: true,
    createdAt: "2026-08-20T00:00:00.000Z",
    updatedAt: "2026-08-20T00:00:00.000Z",
    canceledAt: null,
    ...overrides,
  };
}

describe("DashboardPurchasesPage", () => {
  beforeEach(() => {
    get.mockReset();
    get.mockResolvedValue({
      orders: [
        order({ id: "ord-1", orderNumber: "RK-20260820-AAAA", status: "pending_payment" }),
        order({
          id: "ord-2",
          orderNumber: "RK-20260820-BBBB",
          status: "paid",
          items: [
            {
              id: "ord-2-item",
              kind: "tutorial",
              slug: "jwt-api-security",
              title: "JWT API security",
              packageName: "",
              href: "/tutorials/jwt-api-security",
              thumbnailUrl: null,
              unitLabel: "$29.00",
              unitCents: 2900,
              currency: "USD",
              quantity: 1,
              lineCents: 2900,
              lineLabel: "$29.00",
            },
          ],
        }),
      ],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("filters purchases by status and search without mixing in service inquiries", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <DashboardPurchasesPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Purchases" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "RK-20260820-AAAA" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "RK-20260820-BBBB" })).toBeInTheDocument();
    expect(screen.getByText(/Service inquiries live under Orders/)).toBeInTheDocument();

    await expandFilters(user);
    await user.click(screen.getByRole("button", { name: "Paid" }));
    expect(screen.queryByRole("heading", { name: "RK-20260820-AAAA" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "RK-20260820-BBBB" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "All" }));
    await user.type(screen.getByLabelText("Search purchases"), "JWT");
    expect(screen.queryByRole("heading", { name: "RK-20260820-AAAA" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "RK-20260820-BBBB" })).toBeInTheDocument();
  });
});
