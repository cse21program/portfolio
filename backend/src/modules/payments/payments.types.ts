import { formatUsd } from "@modules/cart/cart.money";
import { paymentProviderCatalog, type PaymentProviderId } from "./gateways/gateway";
import type { PaymentStatus } from "./gateways/gateway";

export type PaymentRecord = {
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

const statuses: PaymentStatus[] = [
  "pending",
  "processing",
  "paid",
  "failed",
  "canceled",
  "refunded",
  "partially_refunded",
];

export function asPaymentStatus(value: string): PaymentStatus {
  return statuses.includes(value as PaymentStatus) ? (value as PaymentStatus) : "pending";
}

export function asPaymentProvider(value: string): PaymentProviderId {
  return paymentProviderCatalog.some((item) => item.id === value) ? (value as PaymentProviderId) : "stripe";
}

export function providerName(id: string) {
  return paymentProviderCatalog.find((item) => item.id === id)?.name ?? id;
}

export function toPaymentRecord(row: {
  id: string;
  userId: string;
  orderId: string;
  provider: string;
  transactionId: string;
  amountCents: number;
  currency: string;
  method: string;
  status: string;
  paidAt: Date | null;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
  order?: { orderNumber: string } | null;
}): PaymentRecord {
  const provider = asPaymentProvider(row.provider);
  const metadata =
    row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
      ? (row.metadata as Record<string, unknown>)
      : {};
  return {
    id: row.id,
    userId: row.userId,
    orderId: row.orderId,
    orderNumber: row.order?.orderNumber ?? "",
    provider,
    providerName: providerName(provider),
    transactionId: row.transactionId,
    amountCents: row.amountCents,
    amountLabel: formatUsd(row.amountCents),
    currency: row.currency,
    method: row.method,
    status: asPaymentStatus(row.status),
    paidAt: row.paidAt ? row.paidAt.toISOString() : null,
    metadata,
    demo: metadata.adapter !== "live",
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
