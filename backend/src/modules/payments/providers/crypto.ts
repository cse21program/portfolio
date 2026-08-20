import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { env } from "@common/config/env";

function key() {
  return createHash("sha256")
    .update(env.PAYMENT_CREDENTIALS_SECRET ?? env.JWT_ACCESS_SECRET)
    .digest();
}

export function encryptCredentials(value: Record<string, string>): string {
  const entries = Object.fromEntries(
    Object.entries(value).filter(([, item]) => Boolean(item)),
  );
  if (Object.keys(entries).length === 0) {
    return "";
  }
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(entries), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptCredentials(payload: string): Record<string, string> {
  if (!payload) {
    return {};
  }
  const [ivHex, tagHex, dataHex] = payload.split(":");
  if (!ivHex || !tagHex || !dataHex) {
    return {};
  }
  try {
    const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(ivHex, "hex"));
    decipher.setAuthTag(Buffer.from(tagHex, "hex"));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(dataHex, "hex")), decipher.final()]);
    const parsed = JSON.parse(decrypted.toString("utf8")) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>).flatMap(([key, value]) =>
        typeof value === "string" ? [[key, value]] : [],
      ),
    );
  } catch {
    return {};
  }
}
