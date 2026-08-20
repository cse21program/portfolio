import { randomBytes } from "node:crypto";
import { AppError, ErrorCode } from "@common/errors/AppError";
import { env } from "@common/config/env";
import {
  paymentProviderCatalog,
  type GatewayCheckoutInput,
  type GatewayCheckoutSession,
  type GatewayWebhookEvent,
  type PaymentGateway,
  type PaymentProviderId,
} from "./gateway";
import { PAYMENT_SIGNATURE_HEADER, verifyPaymentSignature } from "./signature";

function isProvider(value: string): value is PaymentProviderId {
  return paymentProviderCatalog.some((item) => item.id === value);
}

function isWebhookStatus(value: unknown): value is GatewayWebhookEvent["status"] {
  return (
    value === "processing" ||
    value === "paid" ||
    value === "failed" ||
    value === "canceled" ||
    value === "refunded"
  );
}

export function createDemoGateway(id: PaymentProviderId): PaymentGateway {
  const catalog = paymentProviderCatalog.find((item) => item.id === id);
  if (!catalog) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "Unknown payment provider", 400);
  }

  return {
    id: catalog.id,
    name: catalog.name,
    demo: true,
    methods: catalog.methods,
    async createCheckout(input: GatewayCheckoutInput): Promise<GatewayCheckoutSession> {
      const suffix = randomBytes(4).toString("hex");
      const checkoutUrl = `${env.FRONTEND_URL.replace(/\/$/, "")}/pay/${input.paymentId}`;
      return {
        provider: catalog.id,
        transactionId: `demo_${catalog.id}_${input.paymentId.slice(0, 8)}_${suffix}`,
        checkoutUrl,
        metadata: {
          adapter: "demo",
          orderNumber: input.orderNumber,
          checkoutUrl,
        },
      };
    },
    async parseWebhook(headers, rawBody): Promise<GatewayWebhookEvent> {
      verifyPaymentSignature(rawBody, headers[PAYMENT_SIGNATURE_HEADER] ?? headers["X-Payment-Signature"]);
      let parsed: unknown;
      try {
        parsed = JSON.parse(rawBody) as unknown;
      } catch {
        throw new AppError(ErrorCode.VALIDATION_ERROR, "Invalid webhook payload", 400);
      }
      if (!parsed || typeof parsed !== "object") {
        throw new AppError(ErrorCode.VALIDATION_ERROR, "Invalid webhook payload", 400);
      }
      const body = parsed as Record<string, unknown>;
      const provider = String(body.provider ?? "");
      if (!isProvider(provider) || provider !== catalog.id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, "Webhook provider does not match", 400);
      }
      const status = body.status;
      if (!isWebhookStatus(status)) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, "Unknown payment status", 400);
      }
      const transactionId = String(body.transactionId ?? "");
      if (!transactionId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, "Missing transaction id", 400);
      }
      return {
        provider,
        transactionId,
        status,
        amountCents: Number(body.amountCents ?? 0),
        currency: String(body.currency ?? "USD"),
        paidAt: typeof body.paidAt === "string" ? body.paidAt : null,
        metadata: typeof body.metadata === "object" && body.metadata ? (body.metadata as Record<string, unknown>) : {},
      };
    },
    async refund(transactionId: string) {
      return { transactionId: `${transactionId}:refund` };
    },
    async reconcile() {
      return null;
    },
  };
}
