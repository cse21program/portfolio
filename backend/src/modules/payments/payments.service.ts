import { randomUUID } from "node:crypto";
import { env } from "@common/config/env";
import { AppError, ErrorCode } from "@common/errors/AppError";
import { sendMailSafe } from "@common/mailer/mailer";
import { paymentReceivedEmail, paymentFailedEmail } from "@common/mailer/mailer.templates";
import { logger } from "@common/utils/logger";
import { enrollmentsService } from "@modules/enrollments/enrollments.service";
import { notifyInApp } from "../notifications/notify";
import { ordersRepository } from "@modules/orders/orders.repository";
import type { OrderRecord } from "@modules/orders/orders.types";
import {
  defaultProviderForMethod,
  gatewayForPayment,
  getPaymentGateway,
  getProviderSetting,
  listAdminProviderStates,
  listPaymentGateways,
} from "./gateways/registry";
import { PAYMENT_SIGNATURE_HEADER, signPaymentPayload } from "./gateways/signature";
import type { GatewayWebhookEvent, PaymentProviderId } from "./gateways/gateway";
import { createDemoGateway } from "./gateways/demo.gateway";
import {
  gatewayCredentialFields,
  hasLiveCredentials,
  isPaymentProviderId,
  isSecretField,
  mergeCredentials,
  publicBankDetails,
} from "./providers/catalog";
import { providerSettingsRepository } from "./providers/settings.repository";
import { paymentsRepository } from "./payments.repository";
import type { PaymentRecord } from "./payments.types";
import type {
  DemoPaymentInput,
  ReportPaymentInput,
  StartPaymentInput,
  UpdateProviderSettingInput,
} from "./payments.validation";

type Actor = {
  id: string;
  email: string;
  role: "CUSTOMER" | "ADMIN";
};

function orderUrl(orderNumber: string) {
  return `${env.FRONTEND_URL.replace(/\/$/, "")}/checkout/thanks/${orderNumber}`;
}

function checkoutUrlFor(payment: PaymentRecord) {
  const stored = payment.metadata.checkoutUrl;
  if (typeof stored === "string" && stored) {
    return stored;
  }
  return `${env.FRONTEND_URL.replace(/\/$/, "")}/pay/${payment.id}`;
}

function orderStatusForPayment(status: GatewayWebhookEvent["status"]): OrderRecord["status"] | null {
  if (status === "paid") {
    return "paid";
  }
  if (status === "refunded") {
    return "refunded";
  }
  if (status === "processing") {
    return "processing";
  }
  if (status === "failed") {
    return "failed";
  }
  if (status === "canceled") {
    return "pending_payment";
  }
  return null;
}

async function fulfillPaidOrder(order: OrderRecord) {
  for (const item of order.items) {
    if (item.kind === "course") {
      await enrollmentsService.grantFromPurchase({ userId: order.userId, courseSlug: item.slug });
    }
  }
}

async function applyEvent(event: GatewayWebhookEvent) {
  const payment = await paymentsRepository.findByTransactionId(event.transactionId);
  if (!payment) {
    throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Payment not found", 404);
  }

  const terminal = ["paid", "refunded"];
  if (terminal.includes(payment.status) && payment.status === event.status) {
    return { payment, order: await ordersRepository.findById(payment.orderId) };
  }
  if (payment.status === "paid" && event.status !== "refunded") {
    return { payment, order: await ordersRepository.findById(payment.orderId) };
  }

  const next = await paymentsRepository.update(payment.id, {
    status: event.status,
    paidAt: event.status === "paid" ? new Date(event.paidAt ?? Date.now()) : payment.paidAt ? new Date(payment.paidAt) : null,
    metadata: { ...payment.metadata, webhook: event.metadata },
  });

  const mapped = orderStatusForPayment(event.status);
  let order = mapped ? await ordersRepository.updateStatus(next.orderNumber, mapped) : await ordersRepository.findById(next.orderId);

  if (event.status === "paid" && order) {
    await fulfillPaidOrder(order);
    order = await ordersRepository.findById(order.id);
    await sendMailSafe({
      to: order?.billing.email ?? "",
      ...paymentReceivedEmail({
        name: order?.billing.name ?? "",
        orderNumber: next.orderNumber,
        totalLabel: next.amountLabel,
        providerName: next.providerName,
        url: orderUrl(next.orderNumber),
      }),
    });
    if (order?.userId) {
      await notifyInApp({
        userId: order.userId,
        type: "PURCHASE_SUCCESSFUL",
        title: "Payment received",
        body: `Payment of ${next.amountLabel} is recorded for order ${next.orderNumber}.`,
        href: `/checkout/thanks/${next.orderNumber}`,
      });
    }
  }

  if (event.status === "failed") {
    const failedOrder = order ?? (await ordersRepository.findById(next.orderId));
    await sendMailSafe({
      to: failedOrder?.billing.email ?? "",
      ...paymentFailedEmail({
        name: failedOrder?.billing.name ?? "",
        orderNumber: next.orderNumber,
        url: orderUrl(next.orderNumber),
      }),
    });
    if (failedOrder?.userId) {
      await notifyInApp({
        userId: failedOrder.userId,
        type: "PAYMENT_FAILED",
        title: "Payment failed",
        body: `The payment for order ${next.orderNumber} did not go through.`,
        href: `/checkout/thanks/${next.orderNumber}`,
      });
    }
  }

  logger.info("payments.updated", {
    paymentId: next.id,
    provider: next.provider,
    status: next.status,
    orderNumber: next.orderNumber,
  });

  return { payment: next, order };
}

function toAdminProvider(state: Awaited<ReturnType<typeof listAdminProviderStates>>[number]) {
  return {
    id: state.provider,
    name: state.name,
    kind: state.kind,
    enabled: state.enabled,
    mode: state.mode,
    webhookUrl: state.webhookUrl,
    liveReady: state.liveReady,
    fields: gatewayCredentialFields[state.provider].map((field) => ({
      key: field.key,
      label: field.label,
      hint: field.hint,
      type: field.type,
      options: field.options,
      required: field.required,
      configured: Boolean(state.credentials[field.key]),
      value: isSecretField(field) ? undefined : (state.credentials[field.key] ?? ""),
    })),
  };
}

export const paymentsService = {
  listProviders() {
    return listPaymentGateways();
  },

  async listAdminProviders(actor: Actor) {
    if (actor.role !== "ADMIN") {
      throw new AppError(ErrorCode.FORBIDDEN, "You do not have access to this resource", 403);
    }
    const states = await listAdminProviderStates();
    return states.map(toAdminProvider);
  },

  async updateAdminProvider(id: string, input: UpdateProviderSettingInput, actor: Actor) {
    if (actor.role !== "ADMIN") {
      throw new AppError(ErrorCode.FORBIDDEN, "You do not have access to this resource", 403);
    }
    if (!isPaymentProviderId(id)) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "Unknown payment provider", 400);
    }
    const current = await getProviderSetting(id);
    const secretKeys = gatewayCredentialFields[id].filter(isSecretField).map((field) => field.key);
    const credentials = mergeCredentials(current.credentials, input.credentials, secretKeys);
    const enabled = input.enabled ?? current.enabled;
    const mode = input.mode ?? current.mode;
    if (mode === "live" && !hasLiveCredentials(id, credentials)) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        "Add the required credentials before switching this gateway to live",
        400,
      );
    }
    await providerSettingsRepository.upsert({
      provider: id,
      enabled,
      mode,
      credentials,
    });
    logger.info("payments.provider.updated", {
      provider: id,
      enabled,
      mode,
      actorId: actor.id,
    });
    const states = await listAdminProviderStates();
    return toAdminProvider(states.find((item) => item.provider === id)!);
  },

  async getById(id: string, actor: Actor) {
    const payment = await paymentsRepository.findById(id);
    if (!payment) {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Payment not found", 404);
    }
    if (payment.userId !== actor.id && actor.role !== "ADMIN") {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Payment not found", 404);
    }
    const order = await ordersRepository.findById(payment.orderId);
    return { payment, order };
  },

  async start(input: StartPaymentInput, actor: Actor) {
    const order = await ordersRepository.findByOrderNumber(input.orderNumber);
    if (!order || (order.userId !== actor.id && actor.role !== "ADMIN")) {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Order not found", 404);
    }
    if (order.status === "paid") {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "This order is already paid", 400);
    }
    if (order.status === "canceled" || order.status === "refunded") {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "This order cannot be paid", 400);
    }

    const enabled = await listPaymentGateways();
    if (enabled.length === 0) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        "Payments are not configured. Enable a gateway in Studio → Payments.",
        400,
      );
    }
    if (input.provider && !enabled.some((item) => item.id === input.provider)) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "This payment provider is turned off", 400);
    }

    const provider = input.provider ?? (await defaultProviderForMethod(order.paymentMethod));
    const gateway = await getPaymentGateway(provider, "checkout");
    const open = await paymentsRepository.findOpenForOrder(order.id);
    if (open && open.provider === provider) {
      return {
        payment: open,
        order,
        checkoutUrl: checkoutUrlFor(open),
      };
    }
    if (open) {
      await paymentsRepository.update(open.id, { status: "canceled" });
    }

    const paymentId = randomUUID();
    const session = await gateway.createCheckout({
      paymentId,
      orderNumber: order.orderNumber,
      amountCents: order.summary.totalCents,
      currency: order.summary.currency,
      customerEmail: order.billing.email,
      customerName: order.billing.name,
      customerPhone: order.billing.phone,
      returnUrl: orderUrl(order.orderNumber),
      cancelUrl: orderUrl(order.orderNumber),
    });

    const setting = provider === "bank" ? await getProviderSetting(provider) : null;
    const bank = setting ? publicBankDetails(setting.credentials) : null;

    const payment = await paymentsRepository.create({
      id: paymentId,
      userId: order.userId,
      orderId: order.id,
      provider,
      transactionId: session.transactionId,
      amountCents: order.summary.totalCents,
      currency: order.summary.currency,
      method: order.paymentMethod,
      status: "processing",
      metadata: {
        ...session.metadata,
        ...(provider === "bank" ? { kind: "manual" } : {}),
        ...(bank ? { bank } : {}),
      },
    });

    const updated = await ordersRepository.updateStatus(order.orderNumber, "processing");
    return { payment, order: updated, checkoutUrl: session.checkoutUrl };
  },

  async demoComplete(id: string, input: DemoPaymentInput, actor: Actor) {
    const current = await this.getById(id, actor);
    if (!current.payment || !current.order) {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Payment not found", 404);
    }
    if (!current.payment.demo) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "This payment must be completed with the live provider", 400);
    }
    if (current.payment.status === "paid") {
      return current;
    }
    if (current.payment.status !== "pending" && current.payment.status !== "processing") {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "This payment cannot be completed", 400);
    }

    const status =
      input.action === "succeed" ? "paid" : input.action === "fail" ? "failed" : "canceled";
    const payload = {
      provider: current.payment.provider,
      transactionId: current.payment.transactionId,
      status,
      amountCents: current.payment.amountCents,
      currency: current.payment.currency,
      paidAt: status === "paid" ? new Date().toISOString() : null,
      metadata: { adapter: "demo", action: input.action },
    };
    const rawBody = JSON.stringify(payload);
    const gateway = createDemoGateway(current.payment.provider);
    return applyEvent(
      (await gateway.parseWebhook(
        { [PAYMENT_SIGNATURE_HEADER]: signPaymentPayload(rawBody) },
        rawBody,
      ))!,
    );
  },

  async reportTransfer(id: string, input: ReportPaymentInput, actor: Actor) {
    const current = await this.getById(id, actor);
    if (!current.payment || !current.order) {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Payment not found", 404);
    }
    if (current.payment.provider !== "bank") {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "Only a bank transfer can be reported this way", 400);
    }
    if (current.payment.status === "paid") {
      return current;
    }
    if (current.payment.status !== "pending" && current.payment.status !== "processing") {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "This payment cannot be updated", 400);
    }

    const reference = input.reference?.trim() ?? "";
    const payment = await paymentsRepository.update(current.payment.id, {
      status: "processing",
      metadata: {
        ...current.payment.metadata,
        reported: true,
        reportedAt: new Date().toISOString(),
        reference,
      },
    });
    const order =
      current.order.status === "processing"
        ? current.order
        : await ordersRepository.updateStatus(current.order.orderNumber, "processing");
    logger.info("payments.bank.reported", {
      paymentId: payment.id,
      orderNumber: payment.orderNumber,
      actorId: actor.id,
    });
    return { payment, order };
  },

  async confirm(id: string, actor: Actor) {
    if (actor.role !== "ADMIN") {
      throw new AppError(ErrorCode.FORBIDDEN, "You do not have access to this resource", 403);
    }
    const payment = await paymentsRepository.findById(id);
    if (!payment) {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Payment not found", 404);
    }
    if (payment.provider !== "bank") {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "Only a bank transfer can be confirmed this way", 400);
    }
    if (payment.status === "paid") {
      const order = await ordersRepository.findById(payment.orderId);
      return { payment, order };
    }
    if (payment.status !== "pending" && payment.status !== "processing") {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "This payment cannot be confirmed", 400);
    }
    return applyEvent({
      provider: payment.provider,
      transactionId: payment.transactionId,
      status: "paid",
      amountCents: payment.amountCents,
      currency: payment.currency,
      paidAt: new Date().toISOString(),
      metadata: {
        adapter: payment.demo ? "demo" : "live",
        confirmedBy: actor.id,
      },
    });
  },

  async handleWebhook(provider: PaymentProviderId, headers: Record<string, string | undefined>, rawBody: string) {
    const gateway = await getPaymentGateway(provider, "webhook");
    const event = await gateway.parseWebhook(headers, rawBody);
    if (!event) {
      return { ignored: true as const };
    }
    return applyEvent(event);
  },

  async sync(id: string, actor: Actor) {
    const current = await this.getById(id, actor);
    if (!current.payment) {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Payment not found", 404);
    }
    if (current.payment.status === "paid" || current.payment.status === "refunded") {
      return current;
    }
    const gateway = await gatewayForPayment(current.payment.provider, current.payment.demo);
    const event = await gateway.reconcile(current.payment.transactionId);
    if (!event) {
      return current;
    }
    return applyEvent(event);
  },

  async refund(id: string, actor: Actor) {
    if (actor.role !== "ADMIN") {
      throw new AppError(ErrorCode.FORBIDDEN, "You do not have access to this resource", 403);
    }
    const payment = await paymentsRepository.findById(id);
    if (!payment) {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Payment not found", 404);
    }
    if (payment.status !== "paid") {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "Only a paid payment can be refunded", 400);
    }
    const gateway = await gatewayForPayment(payment.provider, payment.demo);
    const refunded = await gateway.refund(payment.transactionId, payment.amountCents, payment.metadata);
    return applyEvent({
      provider: payment.provider,
      transactionId: payment.transactionId,
      status: "refunded",
      amountCents: payment.amountCents,
      currency: payment.currency,
      paidAt: payment.paidAt,
      metadata: {
        refundTransactionId: refunded.transactionId,
        adapter: payment.demo ? "demo" : "live",
      },
    });
  },
};
