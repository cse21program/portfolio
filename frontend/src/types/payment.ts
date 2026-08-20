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

export type BankTransferDetails = {
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch: string;
  routingNumber: string;
  swiftBic: string;
  instructions: string;
};

export type PaymentProvider = {
  id: PaymentProviderId;
  name: string;
  kind?: PaymentGatewayKind;
  methods: string[];
  hint: string;
  demo: boolean;
};

export type Payment = {
  id: string;
  userId: string;
  orderId: string;
  orderNumber: string;
  provider: PaymentProviderId;
  providerName: string;
  transactionId: string;
  amountCents: number;
  amountLabel: string;
  currency: string;
  method: string;
  status: PaymentStatus;
  paidAt: string | null;
  metadata: Record<string, unknown>;
  demo: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PaymentCredentialField = {
  key: string;
  label: string;
  hint: string;
  type: "password" | "text" | "textarea" | "select";
  options?: Array<{ value: string; label: string }>;
  required: boolean;
  configured: boolean;
  value?: string;
};

export type AdminPaymentProvider = {
  id: PaymentProviderId;
  name: string;
  kind?: PaymentGatewayKind;
  enabled: boolean;
  mode: "demo" | "live";
  webhookUrl: string;
  liveReady: boolean;
  fields: PaymentCredentialField[];
};

const bankDetailKeys = [
  "bankName",
  "accountName",
  "accountNumber",
  "branch",
  "routingNumber",
  "swiftBic",
  "instructions",
] as const;

export function bankDetailsFromUnknown(value: unknown): BankTransferDetails | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const record = value as Record<string, unknown>;
  const details = Object.fromEntries(
    bankDetailKeys.map((key) => [key, typeof record[key] === "string" ? record[key] : ""]),
  ) as BankTransferDetails;
  if (!details.bankName && !details.accountName && !details.accountNumber) {
    return null;
  }
  return details;
}

export function paymentStatusLabel(status: string) {
  if (status === "paid") {
    return "Paid";
  }
  if (status === "processing") {
    return "Processing";
  }
  if (status === "failed") {
    return "Failed";
  }
  if (status === "canceled") {
    return "Canceled";
  }
  if (status === "refunded") {
    return "Refunded";
  }
  if (status === "partially_refunded") {
    return "Partially refunded";
  }
  return "Pending";
}

export function defaultProviderForMethod(
  method: string,
  providers: PaymentProvider[] = [],
): PaymentProviderId | "" {
  if (providers.length > 0) {
    const matching = providers.filter((item) => item.methods.includes(method));
    const preferred = method === "card" ? "stripe" : method === "bank" ? "bank" : "paypal";
    return matching.find((item) => item.id === preferred)?.id ?? matching[0]?.id ?? providers[0]?.id ?? "";
  }
  if (method === "card") {
    return "stripe";
  }
  if (method === "bank") {
    return "bank";
  }
  return "paypal";
}
