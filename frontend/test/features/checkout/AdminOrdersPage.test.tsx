import { MemoryRouter } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import { AdminOrdersPage } from "@/features/checkout/AdminOrdersPage";
import type { CommerceOrder } from "@/types/order";
import { expandFilters } from "../../helpers/expandFilters";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    apiGet: vi.fn(),
    apiPatch: vi.fn(),
    apiPost: vi.fn(),
  };
});

const get = vi.mocked(apiGet);
const patch = vi.mocked(apiPatch);
const post = vi.mocked(apiPost);

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
    adminNote: "",
    payment: null,
    createdAt: "2026-08-20T00:00:00.000Z",
    updatedAt: "2026-08-20T00:00:00.000Z",
    canceledAt: null,
    user: { id: "user-1", email: "ada@example.com", name: "Ada Lovelace" },
    ...overrides,
  };
}

describe("AdminOrdersPage", () => {
  let pending: CommerceOrder;
  let paid: CommerceOrder;

  beforeEach(() => {
    pending = order({ id: "ord-1", orderNumber: "RK-20260820-AAAA", status: "pending_payment" });
    paid = order({
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
    });
    get.mockReset();
    patch.mockReset();
    post.mockReset();
    get.mockResolvedValue({ orders: [pending, paid] });
    patch.mockImplementation(async (_path, body) => {
      const payload = body as { adminNote?: string; status?: string };
      if (payload.adminNote !== undefined) {
        pending = { ...pending, adminNote: payload.adminNote };
      }
      if (payload.status === "canceled") {
        pending = { ...pending, status: "canceled", canceledAt: "2026-08-20T01:00:00.000Z" };
      }
      get.mockResolvedValue({ orders: [pending, paid] });
      return { order: pending };
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads checkout orders, filters them, saves a note, and cancels an unpaid order", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AdminOrdersPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "RK-20260820-AAAA" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "RK-20260820-BBBB" })).not.toBeInTheDocument();

    await expandFilters(user);
    await user.click(screen.getByRole("button", { name: "All" }));
    expect(await screen.findByRole("heading", { name: "RK-20260820-BBBB" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Tutorials" }));
    expect(screen.queryByRole("heading", { name: "RK-20260820-AAAA" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "RK-20260820-BBBB" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "All products" }));
    await user.type(screen.getByLabelText("Search orders"), "ada@example.com");
    expect(screen.getByRole("heading", { name: "RK-20260820-AAAA" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "RK-20260820-BBBB" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear" }));
    await user.click(screen.getByRole("button", { name: "Awaiting payment" }));

    await user.click(screen.getByRole("button", { name: "Manage" }));
    await user.type(screen.getByLabelText("Studio note"), "Waiting on the transfer");
    await user.click(screen.getByRole("button", { name: "Save note" }));

    await waitFor(() => {
      expect(patch).toHaveBeenCalledWith("/orders/admin/RK-20260820-AAAA", {
        adminNote: "Waiting on the transfer",
      });
    });

    await user.click(screen.getByRole("button", { name: "Cancel order" }));
    await waitFor(() => {
      expect(patch).toHaveBeenCalledWith("/orders/admin/RK-20260820-AAAA", { status: "canceled" });
    });

    await user.click(screen.getByRole("button", { name: "Canceled" }));
    expect(await screen.findByRole("heading", { name: "RK-20260820-AAAA" })).toBeInTheDocument();
  });
});
