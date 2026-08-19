import { prisma } from "@common/database/prisma";
import { AppError, ErrorCode } from "@common/errors/AppError";
import { generateToken } from "@common/utils/crypto";
import type { SubscribeInput } from "./newsletter.validation";

function toSubscriber(row: { id: string; email: string; name: string; createdAt: Date }) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    createdAt: row.createdAt.toISOString(),
  };
}

export const newsletterRepository = {
  async subscribe(input: SubscribeInput) {
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email: input.email },
    });
    if (existing) {
      return { subscriber: toSubscriber(existing), created: false as const, unsubscribeToken: "" };
    }

    const unsubscribeToken = generateToken();
    try {
      const row = await prisma.newsletterSubscriber.create({
        data: {
          email: input.email,
          name: input.name ?? "",
          unsubscribeToken,
        },
      });
      return { subscriber: toSubscriber(row), created: true as const, unsubscribeToken };
    } catch {
      const raced = await prisma.newsletterSubscriber.findUnique({
        where: { email: input.email },
      });
      if (raced) {
        return { subscriber: toSubscriber(raced), created: false as const, unsubscribeToken: "" };
      }
      throw new AppError(ErrorCode.INTERNAL_ERROR, "Could not subscribe", 500);
    }
  },

  async list() {
    const rows = await prisma.newsletterSubscriber.findMany({
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toSubscriber);
  },

  async listForSend() {
    return prisma.newsletterSubscriber.findMany({
      orderBy: { createdAt: "asc" },
      select: { email: true, name: true, unsubscribeToken: true },
    });
  },

  async unsubscribe(token: string) {
    const row = await prisma.newsletterSubscriber.findUnique({
      where: { unsubscribeToken: token },
    });
    if (!row) {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Subscription not found", 404);
    }
    await prisma.newsletterSubscriber.delete({ where: { id: row.id } });
    return toSubscriber(row);
  },

  async remove(id: string) {
    const row = await prisma.newsletterSubscriber.findUnique({ where: { id } });
    if (!row) {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Subscriber not found", 404);
    }
    await prisma.newsletterSubscriber.delete({ where: { id } });
  },
};
