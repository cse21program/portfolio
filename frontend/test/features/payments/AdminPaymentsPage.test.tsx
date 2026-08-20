import { MemoryRouter } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet, apiPatch } from "@/lib/api";
import { AdminPaymentsPage } from "@/features/payments/AdminPaymentsPage";
import type { AdminPaymentProvider } from "@/types/payment";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    apiGet: vi.fn(),
    apiPatch: vi.fn(),
  };
});

const get = vi.mocked(apiGet);
const patch = vi.mocked(apiPatch);

const stripe: AdminPaymentProvider = {
  id: "stripe",
  name: "Stripe",
  enabled: true,
  mode: "demo",
  webhookUrl: "http://localhost:5173/api/v1/payments/webhooks/stripe",
  liveReady: false,
  fields: [
    {
      key: "secretKey",
      label: "Secret key",
      hint: "sk_test_…",
      type: "password",
      required: true,
      configured: false,
    },
    {
      key: "webhookSecret",
      label: "Webhook signing secret",
      hint: "whsec_…",
      type: "password",
      required: true,
      configured: false,
    },
  ],
};

describe("AdminPaymentsPage", () => {
  beforeEach(() => {
    get.mockReset();
    patch.mockReset();
    get.mockResolvedValue({ providers: [stripe] });
    patch.mockResolvedValue({
      provider: {
        ...stripe,
        mode: "live",
        liveReady: true,
        fields: stripe.fields.map((field) => ({ ...field, configured: true })),
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("saves Stripe credentials from Studio", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AdminPaymentsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Stripe" })).toBeInTheDocument();
    expect(screen.getByText(/Shown at checkout/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Configure" }));
    await user.selectOptions(screen.getByLabelText("Mode"), "live");
    await user.type(screen.getByLabelText("Secret key"), "sk_test_123");
    await user.type(screen.getByLabelText("Webhook signing secret"), "whsec_abc");
    await user.click(screen.getByRole("button", { name: "Save Stripe" }));

    await waitFor(() => {
      expect(patch).toHaveBeenCalledWith("/payments/admin/providers/stripe", {
        enabled: true,
        mode: "live",
        credentials: { secretKey: "sk_test_123", webhookSecret: "whsec_abc" },
      });
    });
    expect(await screen.findByText(/Saved/)).toBeInTheDocument();
  });

  it("saves bank account details without a webhook URL", async () => {
    const user = userEvent.setup();
    get.mockResolvedValue({
      providers: [
        {
          id: "bank",
          name: "Bank transfer",
          kind: "manual",
          enabled: true,
          mode: "demo",
          webhookUrl: "",
          liveReady: false,
          fields: [
            {
              key: "bankName",
              label: "Bank name",
              hint: "Shown to the customer",
              type: "text",
              required: true,
              configured: false,
              value: "",
            },
            {
              key: "accountName",
              label: "Account name",
              hint: "Receiving name",
              type: "text",
              required: true,
              configured: false,
              value: "",
            },
            {
              key: "accountNumber",
              label: "Account number",
              hint: "IBAN",
              type: "text",
              required: true,
              configured: false,
              value: "",
            },
            {
              key: "instructions",
              label: "Transfer notes",
              hint: "Use the order number",
              type: "textarea",
              required: false,
              configured: false,
              value: "",
            },
          ],
        },
      ],
    });
    patch.mockResolvedValue({
      provider: {
        id: "bank",
        name: "Bank transfer",
        kind: "manual",
        enabled: true,
        mode: "live",
        webhookUrl: "",
        liveReady: true,
        fields: [],
      },
    });

    render(
      <MemoryRouter>
        <AdminPaymentsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Bank transfer" })).toBeInTheDocument();
    expect(screen.getByText(/Account details needed/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Configure" }));
    expect(screen.queryByText("Webhook URL")).not.toBeInTheDocument();
    await user.type(screen.getByLabelText("Bank name"), "HSBC");
    await user.type(screen.getByLabelText("Account name"), "Rezaul Karim");
    await user.type(screen.getByLabelText("Account number"), "12345678");
    await user.selectOptions(screen.getByLabelText("Mode"), "live");
    await user.click(screen.getByRole("button", { name: "Save Bank transfer" }));

    await waitFor(() => {
      expect(patch).toHaveBeenCalledWith("/payments/admin/providers/bank", {
        enabled: true,
        mode: "live",
        credentials: {
          bankName: "HSBC",
          accountName: "Rezaul Karim",
          accountNumber: "12345678",
          instructions: "",
        },
      });
    });
  });

  it("expands one gateway card at a time", async () => {
    const user = userEvent.setup();
    get.mockResolvedValue({
      providers: [
        stripe,
        {
          ...stripe,
          id: "paypal",
          name: "PayPal",
          webhookUrl: "http://localhost:5173/api/v1/payments/webhooks/paypal",
        },
      ],
    });
    render(
      <MemoryRouter>
        <AdminPaymentsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "PayPal" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Mode")).not.toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "Configure" })[0]!);
    expect(screen.getByLabelText("Mode")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Collapse" })).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "Configure" })[0]!);
    expect(screen.getByRole("heading", { name: "PayPal" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save PayPal" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save Stripe" })).not.toBeInTheDocument();
  });
});
