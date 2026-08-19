import { env, isTest } from "@common/config/env";
import { logger } from "@common/utils/logger";
import { sendWithSes } from "./mailer.ses";
import type { MailMessage } from "./mailer.types";

const outbox: MailMessage[] = [];

export function mailTransport(): "log" | "ses" {
  if (isTest) {
    return "log";
  }
  if (env.MAIL_TRANSPORT) {
    return env.MAIL_TRANSPORT;
  }
  if (env.NODE_ENV === "production" && env.MAIL_FROM) {
    return "ses";
  }
  return "log";
}

export function getOutbox() {
  return outbox;
}

export function clearOutbox() {
  outbox.length = 0;
}

export async function sendMail(message: MailMessage) {
  if (isTest) {
    outbox.push(message);
  }
  const transport = mailTransport();
  if (transport === "ses") {
    if (!env.MAIL_FROM) {
      logger.warn("mailer.skipped", { reason: "MAIL_FROM is not set", to: message.to, subject: message.subject });
      return;
    }
    await sendWithSes(message);
    return;
  }

  if (!isTest) {
    logger.info("mailer.log", { to: message.to, subject: message.subject, text: message.text });
  }
}

export async function sendMailSafe(message: MailMessage) {
  try {
    await sendMail(message);
  } catch (error) {
    logger.error("mailer.failed", {
      to: message.to,
      subject: message.subject,
      error: error instanceof Error ? error.message : "unknown",
    });
  }
}
