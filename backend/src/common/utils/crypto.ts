import { createHmac, randomBytes } from "node:crypto";
import { env } from "@common/config/env";

export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString("hex");
}

export function hashToken(token: string): string {
  return createHmac("sha256", env.JWT_REFRESH_SECRET).update(token).digest("hex");
}
