import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "@/features/auth/AuthContext";
import { CartProvider } from "@/features/cart/CartContext";
import { CartPage } from "@/features/cart/CartPage";
import { apiDelete, apiGet, apiPost } from "@/lib/api";
import type { AuthUser } from "@/types/auth";
import type { Cart } from "@/types/cart";

vi.mock("@/features/auth/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    apiGet: vi.fn(),
    apiPost: vi.fn(),
    apiDelete: vi.fn(),
    apiPatch: vi.fn(),
  };
});

const mockedAuth = vi.mocked(useAuth);
const get = vi.mocked(apiGet);
const post = vi.mocked(apiPost);
const del = vi.mocked(apiDelete);

const customer: AuthUser = {
  id: "user-1",
  email: "ada@example.com",
  name: "Ada",
  role: "CUSTOMER",
  emailVerified: true,
  status: "ACTIVE",
  hasPassword: true,
  googleLinked: false,
};

const filled: Cart = {
  items: [
    {
      id: "item-1",
      kind: "course",
      slug: "spring-boot-masterclass",
      title: "Production-grade Spring Boot",
      packageName: "",
      href: "/courses/spring-boot-masterclass",
      thumbnailUrl: null,
      unitLabel: "$99",
      unitCents: 9900,
      currency: "USD",
      quantity: 1,
      lineCents: 9900,
      lineLabel: "$99",
      available: true,
    },
  ],
  summary: {
    itemCount: 1,
    subtotalCents: 9900,
    subtotalLabel: "$99",
    discountCents: 0,
    discountLabel: "$0",
    taxCents: 0,
    taxLabel: "$0",
    totalCents: 9900,
    totalLabel: "$99",
    currency: "USD",
    couponCode: "",
    couponPercentOff: null,
  },
  checkoutReady: true,
};

describe("CartPage", () => {
  beforeEach(() => {
    mockedAuth.mockReturnValue({
      user: customer,
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      resendVerification: vi.fn(),
      changePassword: vi.fn(),
      updateProfile: vi.fn(),
      uploadAvatar: vi.fn(),
      removeAvatar: vi.fn(),
    });
    get.mockResolvedValue({ cart: filled });
    post.mockResolvedValue({ cart: filled });
    del.mockResolvedValue({
      cart: { ...filled, items: [], summary: { ...filled.summary, itemCount: 0, subtotalCents: 0, totalCents: 0, subtotalLabel: "$0", totalLabel: "$0" } },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lists cart lines and lets the customer remove one", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <CartProvider>
          <CartPage />
        </CartProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Production-grade Spring Boot" })).toBeInTheDocument();
    expect(screen.getByText("Total").closest("div")).toHaveTextContent("$99");
    expect(screen.getByRole("link", { name: "Checkout" })).toHaveAttribute("href", "/checkout");

    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(del).toHaveBeenCalledWith("/cart/items/item-1");
  });
});
