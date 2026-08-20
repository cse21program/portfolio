import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "@/features/auth/AuthContext";
import { DemoPayPage } from "@/features/payments/DemoPayPage";
import { apiGet, apiPost } from "@/lib/api";
import type { AuthUser } from "@/types/auth";
import type { CommerceOrder } from "@/types/order";
import type { Payment } from "@/types/payment";

vi.mock("@/features/auth/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    apiGet: vi.fn(),
    apiPost: vi.fn(),
  };
});

const mockedAuth = vi.mocked(useAuth);
const get = vi.mocked(apiGet);
const post = vi.mocked(apiPost);

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

const payment: Payment = {
  id: "pay-1",
  userId: "user-1",
  orderId: "order-1",
  orderNumber: "RK-20260820-A1B2",
  provider: "stripe",
  providerName: "Stripe",
  transactionId: "demo_stripe_pay-1_abcd",
  amountCents: 9900,
  amountLabel: "$99",
  currency: "USD",
  method: "card",
  status: "processing",
  paidAt: null,
  metadata: {},
  demo: true,
  createdAt: "2026-08-20T00:00:00.000Z",
  updatedAt: "2026-08-20T00:00:00.000Z",
};

const order: CommerceOrder = {
  id: "order-1",
  orderNumber: "RK-20260820-A1B2",
  userId: "user-1",
  status: "processing",
  items: [],
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
  billing: {
    name: "Ada",
    email: "ada@example.com",
    phone: "",
    country: "United Kingdom",
    address: "12 Analytical Engine Lane",
    city: "London",
    postal: "SW1A 1AA",
  },
  paymentMethod: "card",
  paymentMethodLabel: "Card",
  termsAccepted: true,
  payment,
  createdAt: "2026-08-20T00:00:00.000Z",
  updatedAt: "2026-08-20T00:00:00.000Z",
  canceledAt: null,
};

describe("DemoPayPage", () => {
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
    get.mockResolvedValue({ payment, order });
    post.mockResolvedValue({
      payment: { ...payment, status: "paid" },
      order: { ...order, status: "paid" },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("pays through the demo gateway", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/pay/pay-1"]}>
        <Routes>
          <Route path="/pay/:paymentId" element={<DemoPayPage />} />
          <Route path="/checkout/thanks/:orderNumber" element={<p>Thanks</p>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Stripe" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Pay $99 (demo)" }));
    await waitFor(() => {
      expect(post).toHaveBeenCalledWith("/payments/pay-1/demo", { action: "succeed" });
    });
    expect(await screen.findByText("Thanks")).toBeInTheDocument();
  });

  it("reports a bank transfer without marking it paid", async () => {
    const user = userEvent.setup();
    const bankPayment: Payment = {
      ...payment,
      provider: "bank",
      providerName: "Bank transfer",
      method: "bank",
      demo: false,
      metadata: {
        bank: {
          bankName: "HSBC",
          accountName: "Rezaul Karim",
          accountNumber: "12345678",
          branch: "",
          routingNumber: "",
          swiftBic: "",
          instructions: "Use the order number as the reference.",
        },
      },
    };
    get.mockResolvedValue({
      payment: bankPayment,
      order: { ...order, paymentMethod: "bank", paymentMethodLabel: "Bank transfer", payment: bankPayment },
    });
    post.mockResolvedValue({
      payment: { ...bankPayment, metadata: { ...bankPayment.metadata, reported: true, reference: "TRX-9" } },
      order,
    });

    render(
      <MemoryRouter initialEntries={["/pay/pay-1"]}>
        <Routes>
          <Route path="/pay/:paymentId" element={<DemoPayPage />} />
          <Route path="/checkout/thanks/:orderNumber" element={<p>Thanks</p>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Bank transfer" })).toBeInTheDocument();
    expect(screen.getByText("12345678")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Pay/ })).not.toBeInTheDocument();
    await user.type(screen.getByLabelText(/transfer reference/i), "TRX-9");
    await user.click(screen.getByRole("button", { name: "I've transferred" }));
    await waitFor(() => {
      expect(post).toHaveBeenCalledWith("/payments/pay-1/report", { reference: "TRX-9" });
    });
    expect(await screen.findByText(/waiting for confirmation/i)).toBeInTheDocument();
  });
});
