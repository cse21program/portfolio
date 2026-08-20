import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "@/features/auth/AuthContext";
import { CartProvider } from "@/features/cart/CartContext";
import { CheckoutPage } from "@/features/checkout/CheckoutPage";
import { apiGet, apiPost } from "@/lib/api";
import type { AuthUser } from "@/types/auth";
import type { Cart } from "@/types/cart";
import type { CommerceOrder } from "@/types/order";

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

const customer: AuthUser = {
  id: "user-1",
  email: "ada@example.com",
  name: "Ada",
  phone: "+44 20 7946 0958",
  country: "United Kingdom",
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

const placed: CommerceOrder = {
  id: "order-1",
  orderNumber: "RK-20260820-A1B2",
  userId: "user-1",
  status: "pending_payment",
  items: filled.items.map((item) => ({
    id: item.id,
    kind: item.kind,
    slug: item.slug,
    title: item.title,
    packageName: item.packageName,
    href: item.href,
    thumbnailUrl: item.thumbnailUrl,
    unitLabel: item.unitLabel,
    unitCents: item.unitCents,
    currency: item.currency,
    quantity: item.quantity,
    lineCents: item.lineCents,
    lineLabel: item.lineLabel,
  })),
  summary: filled.summary,
  billing: {
    name: "Ada",
    email: "ada@example.com",
    phone: "+44 20 7946 0958",
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
};

describe("CheckoutPage", () => {
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
    post.mockResolvedValue({ order: placed });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("places an order from the cart with billing, payment preference, and terms", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <CartProvider>
          <CheckoutPage />
        </CartProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Place order" })).toBeInTheDocument();
    expect(screen.getByText("Production-grade Spring Boot")).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toHaveValue("Ada");
    expect(screen.getByLabelText("Email")).toHaveValue("ada@example.com");

    await user.type(screen.getByLabelText("Street address"), "12 Analytical Engine Lane");
    await user.type(screen.getByLabelText("City"), "London");
    await user.type(screen.getByLabelText("Postal code"), "SW1A 1AA");
    await user.click(screen.getByRole("radio", { name: /Bank transfer/ }));
    await user.click(screen.getByRole("checkbox", { name: /I accept the terms for this order/ }));
    await user.click(screen.getByRole("button", { name: "Place order" }));

    await waitFor(() => {
      expect(post).toHaveBeenCalledWith("/checkout", {
        billingName: "Ada",
        billingEmail: "ada@example.com",
        billingPhone: "+44 20 7946 0958",
        country: "United Kingdom",
        address: "12 Analytical Engine Lane",
        city: "London",
        postal: "SW1A 1AA",
        paymentMethod: "bank",
        termsAccepted: true,
      });
    });
  });
});
