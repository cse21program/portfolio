import { paymentProviderCatalog, type PaymentProviderId } from "../gateways/gateway";

export const paymentProviderModes = ["demo", "live"] as const;
export type PaymentProviderMode = (typeof paymentProviderModes)[number];

export type CredentialFieldType = "password" | "text" | "textarea" | "select";

export type CredentialFieldSpec = {
  key: string;
  label: string;
  hint: string;
  type: CredentialFieldType;
  options?: Array<{ value: string; label: string }>;
  required: boolean;
};

export type BankTransferDetails = {
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch: string;
  routingNumber: string;
  swiftBic: string;
  instructions: string;
};

const sandboxOrLive = [
  { value: "sandbox", label: "Sandbox" },
  { value: "live", label: "Live" },
];

const bankDetailKeys = [
  "bankName",
  "accountName",
  "accountNumber",
  "branch",
  "routingNumber",
  "swiftBic",
  "instructions",
] as const;

export const gatewayCredentialFields: Record<PaymentProviderId, CredentialFieldSpec[]> = {
  stripe: [
    {
      key: "secretKey",
      label: "Secret key",
      hint: "sk_test_… or sk_live_… from Stripe Developers.",
      type: "password",
      required: true,
    },
    {
      key: "publishableKey",
      label: "Publishable key",
      hint: "pk_… Optional for Checkout Sessions.",
      type: "password",
      required: false,
    },
    {
      key: "webhookSecret",
      label: "Webhook signing secret",
      hint: "whsec_… from the Stripe webhook endpoint.",
      type: "password",
      required: true,
    },
  ],
  paypal: [
    { key: "clientId", label: "Client ID", hint: "REST app client id.", type: "password", required: true },
    { key: "clientSecret", label: "Client secret", hint: "REST app secret.", type: "password", required: true },
    {
      key: "environment",
      label: "Environment",
      hint: "Sandbox for testing, live for real charges.",
      type: "select",
      options: sandboxOrLive,
      required: true,
    },
  ],
  sslcommerz: [
    { key: "storeId", label: "Store ID", hint: "SSLCommerz store id.", type: "text", required: true },
    { key: "storePassword", label: "Store password", hint: "Store passwd from the merchant panel.", type: "password", required: true },
    {
      key: "environment",
      label: "Environment",
      hint: "Sandbox for testing, live for real charges.",
      type: "select",
      options: sandboxOrLive,
      required: true,
    },
  ],
  bkash: [
    { key: "appKey", label: "App key", hint: "Tokenized checkout app key.", type: "password", required: true },
    { key: "appSecret", label: "App secret", hint: "Tokenized checkout app secret.", type: "password", required: true },
    { key: "username", label: "Username", hint: "bKash merchant username.", type: "text", required: true },
    { key: "password", label: "Password", hint: "bKash merchant password.", type: "password", required: true },
    {
      key: "environment",
      label: "Environment",
      hint: "Sandbox for testing, live for real charges.",
      type: "select",
      options: sandboxOrLive,
      required: true,
    },
  ],
  nagad: [
    { key: "merchantId", label: "Merchant ID", hint: "Nagad merchant id.", type: "text", required: true },
    { key: "publicKey", label: "Merchant public key", hint: "PEM public key from Nagad.", type: "password", required: true },
    { key: "privateKey", label: "Merchant private key", hint: "PEM private key from Nagad.", type: "password", required: true },
    {
      key: "environment",
      label: "Environment",
      hint: "Sandbox for testing, live for real charges.",
      type: "select",
      options: sandboxOrLive,
      required: true,
    },
  ],
  bank: [
    { key: "bankName", label: "Bank name", hint: "Shown to the customer at checkout.", type: "text", required: true },
    {
      key: "accountName",
      label: "Account name",
      hint: "The name on the receiving account.",
      type: "text",
      required: true,
    },
    {
      key: "accountNumber",
      label: "Account number",
      hint: "IBAN or local account number.",
      type: "text",
      required: true,
    },
    { key: "branch", label: "Branch", hint: "Optional branch or district.", type: "text", required: false },
    {
      key: "routingNumber",
      label: "Routing / sort code",
      hint: "Optional routing number, sort code, or routing no.",
      type: "text",
      required: false,
    },
    { key: "swiftBic", label: "SWIFT / BIC", hint: "Optional for international transfers.", type: "text", required: false },
    {
      key: "instructions",
      label: "Transfer notes",
      hint: "Ask the customer to use the order number as the reference.",
      type: "textarea",
      required: false,
    },
  ],
};

export function requiredCredentialKeys(id: PaymentProviderId) {
  return gatewayCredentialFields[id].filter((field) => field.required).map((field) => field.key);
}

export function hasLiveCredentials(id: PaymentProviderId, credentials: Record<string, string>) {
  return requiredCredentialKeys(id).every((key) => Boolean(credentials[key]?.trim()));
}

export function isPaymentProviderId(value: string): value is PaymentProviderId {
  return paymentProviderCatalog.some((item) => item.id === value);
}

export function isSecretField(field: CredentialFieldSpec) {
  return field.type === "password";
}

export function publicBankDetails(credentials: Record<string, string>): BankTransferDetails | null {
  const details = {
    bankName: credentials.bankName?.trim() ?? "",
    accountName: credentials.accountName?.trim() ?? "",
    accountNumber: credentials.accountNumber?.trim() ?? "",
    branch: credentials.branch?.trim() ?? "",
    routingNumber: credentials.routingNumber?.trim() ?? "",
    swiftBic: credentials.swiftBic?.trim() ?? "",
    instructions: credentials.instructions?.trim() ?? "",
  };
  if (!details.bankName && !details.accountName && !details.accountNumber) {
    return null;
  }
  return details;
}

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

export function mergeCredentials(
  existing: Record<string, string>,
  incoming: Record<string, string> | undefined,
  secretKeys: string[] = [],
) {
  const next = { ...existing };
  const secrets = new Set(secretKeys);
  for (const [key, value] of Object.entries(incoming ?? {})) {
    if (value === "") {
      if (secrets.has(key)) {
        continue;
      }
      delete next[key];
      continue;
    }
    next[key] = value.trim();
  }
  return next;
}
