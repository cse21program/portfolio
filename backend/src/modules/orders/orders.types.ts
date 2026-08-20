export const orderStatuses = [
  "pending_payment",
  "processing",
  "paid",
  "failed",
  "canceled",
  "refunded",
] as const;
export type OrderStatus = (typeof orderStatuses)[number];

export const paymentMethods = ["card", "bank", "invoice"] as const;
export type PaymentMethod = (typeof paymentMethods)[number];

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  card: "Card",
  bank: "Bank transfer",
  invoice: "Invoice",
};

export type OrderItemRecord = {
  id: string;
  kind: string;
  slug: string;
  title: string;
  packageName: string;
  href: string;
  thumbnailUrl: string | null;
  unitLabel: string;
  unitCents: number;
  currency: string;
  quantity: number;
  lineCents: number;
  lineLabel: string;
};

export type OrderSummary = {
  itemCount: number;
  subtotalCents: number;
  subtotalLabel: string;
  discountCents: number;
  discountLabel: string;
  taxCents: number;
  taxLabel: string;
  totalCents: number;
  totalLabel: string;
  currency: string;
  couponCode: string;
  couponPercentOff: number | null;
};

export type OrderBilling = {
  name: string;
  email: string;
  phone: string;
  country: string;
  address: string;
  city: string;
  postal: string;
};

import type { PaymentRecord } from "@modules/payments/payments.types";

export type OrderRecord = {
  id: string;
  orderNumber: string;
  userId: string;
  status: OrderStatus;
  items: OrderItemRecord[];
  summary: OrderSummary;
  billing: OrderBilling;
  paymentMethod: PaymentMethod;
  paymentMethodLabel: string;
  termsAccepted: boolean;
  adminNote: string;
  payment: PaymentRecord | null;
  createdAt: string;
  updatedAt: string;
  canceledAt: string | null;
  user?: {
    id: string;
    email: string;
    name: string | null;
  };
};
