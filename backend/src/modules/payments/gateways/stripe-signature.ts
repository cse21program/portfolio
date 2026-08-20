import { createHmac, timingSafeEqual } from "node:crypto";
import { AppError, ErrorCode } from "@common/errors/AppError";

const MAX_AGE_SECONDS = 60 * 5;

export function verifyStripeSignature(rawBody: string, header: string | undefined, secret: string) {
  if (!header) {
    throw new AppError(ErrorCode.UNAUTHORIZED, "Missing Stripe signature", 401);
  }
  const parts = Object.fromEntries(
    header.split(",").map((item) => {
      const index = item.indexOf("=");
      return index === -1 ? [item.trim(), ""] : [item.slice(0, index).trim(), item.slice(index + 1).trim()];
    }),
  );
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) {
    throw new AppError(ErrorCode.UNAUTHORIZED, "Invalid Stripe signature", 401);
  }
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(Number(timestamp)) || age > MAX_AGE_SECONDS) {
    throw new AppError(ErrorCode.UNAUTHORIZED, "Stripe signature expired", 401);
  }
  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== receivedBuffer.length || !timingSafeEqual(expectedBuffer, receivedBuffer)) {
    throw new AppError(ErrorCode.UNAUTHORIZED, "Invalid Stripe signature", 401);
  }
}
