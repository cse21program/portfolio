import type { Payment } from "@/types/payment";

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

export type OrderItem = {
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

export type CommerceOrder = {
  id: string;
  orderNumber: string;
  userId: string;
  status: OrderStatus;
  items: OrderItem[];
  summary: OrderSummary;
  billing: OrderBilling;
  paymentMethod: PaymentMethod;
  paymentMethodLabel: string;
  termsAccepted: boolean;
  adminNote?: string;
  payment?: Payment | null;
  createdAt: string;
  updatedAt: string;
  canceledAt: string | null;
  user?: {
    id: string;
    email: string;
    name: string | null;
  };
};

export const paymentMethodOptions: Array<{ value: PaymentMethod; label: string; hint: string }> = [
  {
    value: "card",
    label: "Card",
    hint: "Pays through an enabled card gateway on the next screen. Card numbers stay with the provider.",
  },
  {
    value: "bank",
    label: "Bank transfer",
    hint: "Transfer to the published bank details, or pay through SSLCommerz, bKash, or Nagad.",
  },
  {
    value: "invoice",
    label: "Invoice",
    hint: "Pays through PayPal on the next screen when that gateway is enabled.",
  },
];

export function orderStatusLabel(status: string) {
  if (status === "pending_payment") {
    return "Pending payment";
  }
  if (status === "processing") {
    return "Processing";
  }
  if (status === "paid") {
    return "Paid";
  }
  if (status === "failed") {
    return "Payment failed";
  }
  if (status === "canceled") {
    return "Canceled";
  }
  if (status === "refunded") {
    return "Refunded";
  }
  return status.replace(/_/g, " ");
}

export function formatOrderDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
