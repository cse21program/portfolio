import { randomBytes } from "node:crypto";
import { prisma } from "@common/database/prisma";
import { AppError, ErrorCode } from "@common/errors/AppError";
import { formatUsd } from "@modules/cart/cart.money";
import type { PlaceOrderInput } from "./orders.validation";
import {
  paymentMethodLabels,
  type OrderItemRecord,
  type OrderRecord,
  type OrderStatus,
  type PaymentMethod,
} from "./orders.types";

type OrderRow = {
  id: string;
  orderNumber: string;
  userId: string;
  status: string;
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;
  currency: string;
  couponCode: string;
  couponPercentOff: number | null;
  billingName: string;
  billingEmail: string;
  billingPhone: string;
  country: string;
  address: string;
  city: string;
  postal: string;
  paymentMethod: string;
  termsAccepted: boolean;
  createdAt: Date;
  updatedAt: Date;
  canceledAt: Date | null;
  items: Array<{
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
  }>;
  user?: { id: string; email: string; name: string | null } | null;
};

function asPaymentMethod(value: string): PaymentMethod {
  if (value === "card" || value === "bank" || value === "invoice") {
    return value;
  }
  return "invoice";
}

function asStatus(value: string): OrderStatus {
  return value === "canceled" ? "canceled" : "pending_payment";
}

function toItem(row: OrderRow["items"][number]): OrderItemRecord {
  return {
    id: row.id,
    kind: row.kind,
    slug: row.slug,
    title: row.title,
    packageName: row.packageName,
    href: row.href,
    thumbnailUrl: row.thumbnailUrl,
    unitLabel: row.unitLabel,
    unitCents: row.unitCents,
    currency: row.currency,
    quantity: row.quantity,
    lineCents: row.lineCents,
    lineLabel: formatUsd(row.lineCents),
  };
}

function toRecord(row: OrderRow): OrderRecord {
  const paymentMethod = asPaymentMethod(row.paymentMethod);
  const itemCount = row.items.reduce((sum, item) => sum + item.quantity, 0);
  return {
    id: row.id,
    orderNumber: row.orderNumber,
    userId: row.userId,
    status: asStatus(row.status),
    items: row.items.map(toItem),
    summary: {
      itemCount,
      subtotalCents: row.subtotalCents,
      subtotalLabel: formatUsd(row.subtotalCents),
      discountCents: row.discountCents,
      discountLabel: formatUsd(row.discountCents),
      taxCents: row.taxCents,
      taxLabel: formatUsd(row.taxCents),
      totalCents: row.totalCents,
      totalLabel: formatUsd(row.totalCents),
      currency: row.currency,
      couponCode: row.couponCode,
      couponPercentOff: row.couponPercentOff,
    },
    billing: {
      name: row.billingName,
      email: row.billingEmail,
      phone: row.billingPhone,
      country: row.country,
      address: row.address,
      city: row.city,
      postal: row.postal,
    },
    paymentMethod,
    paymentMethodLabel: paymentMethodLabels[paymentMethod],
    termsAccepted: row.termsAccepted,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    canceledAt: row.canceledAt ? row.canceledAt.toISOString() : null,
    user: row.user ?? undefined,
  };
}

const userSelect = { id: true, email: true, name: true } as const;
const itemOrder = { items: { orderBy: { createdAt: "asc" as const } } };

export function generateOrderNumber(now = new Date()) {
  const day = now.toISOString().slice(0, 10).replaceAll("-", "");
  const suffix = randomBytes(2).toString("hex").toUpperCase();
  return `RK-${day}-${suffix}`;
}

export const ordersRepository = {
  async listForUser(userId: string): Promise<OrderRecord[]> {
    const rows = await prisma.order.findMany({
      where: { userId },
      include: { ...itemOrder, user: { select: userSelect } },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toRecord);
  },

  async listAll(): Promise<OrderRecord[]> {
    const rows = await prisma.order.findMany({
      include: { ...itemOrder, user: { select: userSelect } },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toRecord);
  },

  async findByOrderNumber(orderNumber: string): Promise<OrderRecord | null> {
    const row = await prisma.order.findUnique({
      where: { orderNumber },
      include: { ...itemOrder, user: { select: userSelect } },
    });
    return row ? toRecord(row) : null;
  },

  async createFromCart(input: {
    userId: string;
    orderNumber: string;
    billing: PlaceOrderInput;
    summary: {
      subtotalCents: number;
      discountCents: number;
      taxCents: number;
      totalCents: number;
      currency: string;
      couponCode: string;
      couponPercentOff: number | null;
    };
    items: Array<{
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
    }>;
  }): Promise<OrderRecord> {
    const row = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber: input.orderNumber,
          userId: input.userId,
          status: "pending_payment",
          subtotalCents: input.summary.subtotalCents,
          discountCents: input.summary.discountCents,
          taxCents: input.summary.taxCents,
          totalCents: input.summary.totalCents,
          currency: input.summary.currency,
          couponCode: input.summary.couponCode,
          couponPercentOff: input.summary.couponPercentOff,
          billingName: input.billing.billingName,
          billingEmail: input.billing.billingEmail,
          billingPhone: input.billing.billingPhone,
          country: input.billing.country,
          address: input.billing.address,
          city: input.billing.city,
          postal: input.billing.postal,
          paymentMethod: input.billing.paymentMethod,
          termsAccepted: true,
          items: {
            create: input.items.map((item) => ({
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
            })),
          },
        },
        include: { ...itemOrder, user: { select: userSelect } },
      });

      const cart = await tx.cart.findUnique({ where: { userId: input.userId } });
      if (cart) {
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
        await tx.cart.update({ where: { id: cart.id }, data: { couponCode: "" } });
      }

      return created;
    });

    return toRecord(row);
  },

  async cancel(orderNumber: string): Promise<OrderRecord> {
    try {
      const row = await prisma.order.update({
        where: { orderNumber },
        data: { status: "canceled", canceledAt: new Date() },
        include: { ...itemOrder, user: { select: userSelect } },
      });
      return toRecord(row);
    } catch {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Order not found", 404);
    }
  },
};
