export const paymentProviders = ["stripe", "paypal", "sslcommerz", "bkash", "nagad", "bank"] as const;
export type PaymentProviderId = (typeof paymentProviders)[number];

export const paymentStatuses = [
  "pending",
  "processing",
  "paid",
  "failed",
  "canceled",
  "refunded",
  "partially_refunded",
] as const;
export type PaymentStatus = (typeof paymentStatuses)[number];

export type PaymentGatewayKind = "hosted" | "manual";

export type GatewayCheckoutInput = {
  paymentId: string;
  orderNumber: string;
  amountCents: number;
  currency: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  returnUrl: string;
  cancelUrl: string;
};

export type GatewayCheckoutSession = {
  provider: PaymentProviderId;
  transactionId: string;
  checkoutUrl: string;
  metadata: Record<string, unknown>;
};

export type GatewayWebhookEvent = {
  provider: PaymentProviderId;
  transactionId: string;
  status: Extract<PaymentStatus, "processing" | "paid" | "failed" | "canceled" | "refunded">;
  amountCents: number;
  currency: string;
  paidAt: string | null;
  metadata: Record<string, unknown>;
};

export type PaymentGateway = {
  id: PaymentProviderId;
  name: string;
  demo: boolean;
  methods: string[];
  createCheckout(input: GatewayCheckoutInput): Promise<GatewayCheckoutSession>;
  parseWebhook(headers: Record<string, string | undefined>, rawBody: string): Promise<GatewayWebhookEvent | null>;
  refund(
    transactionId: string,
    amountCents: number,
    metadata?: Record<string, unknown>,
  ): Promise<{ transactionId: string }>;
  reconcile(transactionId: string): Promise<GatewayWebhookEvent | null>;
};

export const paymentProviderCatalog: Array<{
  id: PaymentProviderId;
  name: string;
  kind: PaymentGatewayKind;
  methods: string[];
  demoHint: string;
  liveHint: string;
}> = [
  {
    id: "stripe",
    name: "Stripe",
    kind: "hosted",
    methods: ["card"],
    demoHint: "On-site demo checkout. No card number is stored.",
    liveHint: "Card checkout on Stripe. Cards stay with Stripe.",
  },
  {
    id: "paypal",
    name: "PayPal",
    kind: "hosted",
    methods: ["card", "invoice"],
    demoHint: "On-site demo PayPal checkout.",
    liveHint: "PayPal Checkout. The customer finishes on PayPal.",
  },
  {
    id: "sslcommerz",
    name: "SSLCommerz",
    kind: "hosted",
    methods: ["card", "bank"],
    demoHint: "On-site demo checkout for card or bank in Bangladesh.",
    liveHint: "SSLCommerz hosted checkout for card or bank.",
  },
  {
    id: "bkash",
    name: "bKash",
    kind: "hosted",
    methods: ["bank"],
    demoHint: "On-site demo bKash checkout.",
    liveHint: "bKash tokenized checkout. The customer finishes in bKash.",
  },
  {
    id: "nagad",
    name: "Nagad",
    kind: "hosted",
    methods: ["bank"],
    demoHint: "On-site demo Nagad checkout.",
    liveHint: "Nagad hosted checkout. The customer finishes in Nagad.",
  },
  {
    id: "bank",
    name: "Bank transfer",
    kind: "manual",
    methods: ["bank"],
    demoHint: "On-site demo bank transfer. Confirm from Studio or simulate payment.",
    liveHint: "Customer pays to your account. You confirm the transfer in Purchases.",
  },
];

export type PublicPaymentProvider = {
  id: PaymentProviderId;
  name: string;
  kind: PaymentGatewayKind;
  methods: string[];
  hint: string;
  demo: boolean;
};
