import { env } from "@common/config/env";
import { AppError, ErrorCode } from "@common/errors/AppError";
import { sendMailSafe } from "@common/mailer/mailer";
import { orderPlacedEmail } from "@common/mailer/mailer.templates";
import { logger } from "@common/utils/logger";
import { cartService } from "@modules/cart/cart.service";
import { paymentsRepository } from "@modules/payments/payments.repository";
import { generateOrderNumber, ordersRepository } from "./orders.repository";
import type { PlaceOrderInput } from "./orders.validation";

type Actor = {
  id: string;
  email: string;
  role: "CUSTOMER" | "ADMIN";
};

function dashboardUrl(orderNumber: string) {
  return `${env.FRONTEND_URL.replace(/\/$/, "")}/checkout/thanks/${orderNumber}`;
}

export const ordersService = {
  listMine(userId: string) {
    return ordersRepository.listForUser(userId);
  },

  listAdmin() {
    return ordersRepository.listAll();
  },

  async getByOrderNumber(orderNumber: string, actor: Actor) {
    const order = await ordersRepository.findByOrderNumber(orderNumber);
    if (!order) {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Order not found", 404);
    }
    if (order.userId !== actor.id && actor.role !== "ADMIN") {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Order not found", 404);
    }
    return order;
  },

  async place(input: PlaceOrderInput, actor: Actor) {
    const cart = await cartService.get(actor.id);
    const available = cart.items.filter((item) => item.available);
    if (available.length === 0) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "Cart is empty", 400);
    }
    if (available.length !== cart.items.length) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "Remove unavailable items before checkout", 400);
    }

    let order = null;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        order = await ordersRepository.createFromCart({
          userId: actor.id,
          orderNumber: generateOrderNumber(),
          billing: input,
          summary: cart.summary,
          items: available.map((item) => ({
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
        });
        break;
      } catch (error) {
        const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
        if (code === "P2002" && attempt < 4) {
          continue;
        }
        throw error;
      }
    }

    if (!order) {
      throw new AppError(ErrorCode.INTERNAL_ERROR, "Could not place that order", 500);
    }

    logger.info("orders.placed", {
      actorId: actor.id,
      actorEmail: actor.email,
      orderNumber: order.orderNumber,
      totalCents: order.summary.totalCents,
    });

    await sendMailSafe({
      to: order.billing.email,
      ...orderPlacedEmail({
        name: order.billing.name,
        orderNumber: order.orderNumber,
        totalLabel: order.summary.totalLabel,
        url: dashboardUrl(order.orderNumber),
      }),
    });

    return order;
  },

  async cancelMine(orderNumber: string, actor: Actor) {
    const existing = await ordersRepository.findByOrderNumber(orderNumber);
    if (!existing || existing.userId !== actor.id) {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Order not found", 404);
    }
    if (
      existing.status !== "pending_payment" &&
      existing.status !== "failed" &&
      existing.status !== "processing"
    ) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "Only a pending order can be cancelled", 400);
    }
    const open = await paymentsRepository.findOpenForOrder(existing.id);
    if (open) {
      await paymentsRepository.update(open.id, { status: "canceled" });
    }
    return ordersRepository.cancel(orderNumber);
  },
};
