import { createHmac, timingSafeEqual } from "node:crypto";
import { AppError, ErrorCode } from "@common/errors/AppError";
import { env } from "@common/config/env";

export const PAYMENT_SIGNATURE_HEADER = "x-payment-signature";

export function signPaymentPayload(body: string, secret = env.PAYMENT_WEBHOOK_SECRET) {
  return createHmac("sha256", secret).update(body).digest("hex");
}

export function verifyPaymentSignature(body: string, signature: string | undefined, secret = env.PAYMENT_WEBHOOK_SECRET) {
  if (!signature) {
    throw new AppError(ErrorCode.UNAUTHORIZED, "Missing payment signature", 401);
  }
  const expected = Buffer.from(signPaymentPayload(body, secret));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    throw new AppError(ErrorCode.UNAUTHORIZED, "Invalid payment signature", 401);
  }
}
