import { prisma } from "@common/database/prisma";
import { AppError, ErrorCode } from "@common/errors/AppError";
import type { Prisma } from "../../generated/prisma/client";
import { toPaymentRecord, type PaymentRecord } from "./payments.types";
import type { PaymentStatus } from "./gateways/gateway";

const orderSelect = { orderNumber: true } as const;

export const paymentsRepository = {
  async listForOrder(orderId: string): Promise<PaymentRecord[]> {
    const rows = await prisma.payment.findMany({
      where: { orderId },
      include: { order: { select: orderSelect } },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toPaymentRecord);
  },

  async findById(id: string): Promise<PaymentRecord | null> {
    const row = await prisma.payment.findUnique({
      where: { id },
      include: { order: { select: orderSelect } },
    });
    return row ? toPaymentRecord(row) : null;
  },

  async findByTransactionId(transactionId: string): Promise<PaymentRecord | null> {
    const row = await prisma.payment.findUnique({
      where: { transactionId },
      include: { order: { select: orderSelect } },
    });
    return row ? toPaymentRecord(row) : null;
  },

  async findOpenForOrder(orderId: string): Promise<PaymentRecord | null> {
    const row = await prisma.payment.findFirst({
      where: { orderId, status: { in: ["pending", "processing"] } },
      include: { order: { select: orderSelect } },
      orderBy: { createdAt: "desc" },
    });
    return row ? toPaymentRecord(row) : null;
  },

  async create(input: {
    id?: string;
    userId: string;
    orderId: string;
    provider: string;
    transactionId: string;
    amountCents: number;
    currency: string;
    method: string;
    status?: PaymentStatus;
    metadata?: Record<string, unknown>;
  }): Promise<PaymentRecord> {
    const row = await prisma.payment.create({
      data: {
        ...(input.id ? { id: input.id } : {}),
        userId: input.userId,
        orderId: input.orderId,
        provider: input.provider,
        transactionId: input.transactionId,
        amountCents: input.amountCents,
        currency: input.currency,
        method: input.method,
        status: input.status ?? "pending",
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
      },
      include: { order: { select: orderSelect } },
    });
    return toPaymentRecord(row);
  },

  async update(
    id: string,
    data: {
      status?: PaymentStatus;
      transactionId?: string;
      paidAt?: Date | null;
      metadata?: Record<string, unknown>;
    },
  ): Promise<PaymentRecord> {
    try {
      const row = await prisma.payment.update({
        where: { id },
        data: {
          status: data.status,
          transactionId: data.transactionId,
          paidAt: data.paidAt,
          ...(data.metadata ? { metadata: data.metadata as Prisma.InputJsonValue } : {}),
        },
        include: { order: { select: orderSelect } },
      });
      return toPaymentRecord(row);
    } catch {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Payment not found", 404);
    }
  },
};
