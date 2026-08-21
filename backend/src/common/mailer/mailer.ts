import { isTest } from "@common/config/env";
import { logger } from "@common/utils/logger";
import { describeMailError } from "./mailer.errors";
import { getMailRuntime } from "./mailer.runtime";
import { sendWithSmtp } from "./mailer.smtp";
import type { MailMessage, MailProviderId } from "./mailer.types";

const outbox: MailMessage[] = [];

export async function mailTransport() {
  return (await getMailRuntime()).transport;
}

export function getOutbox() {
  return outbox;
}

export function clearOutbox() {
  outbox.length = 0;
}

export async function sendMailUsing(message: MailMessage, provider?: MailProviderId) {
  if (isTest) {
    outbox.push(message);
    return;
  }

  const runtime = await getMailRuntime();
  const transport = provider ?? runtime.transport;

  if (transport === "ses") {
    if (!runtime.ses) {
      throw new Error(
        "Amazon SES is selected in Studio but SMTP username, password, and From email are required.",
      );
    }
    try {
      await sendWithSmtp(message, runtime.ses);
    } catch (error) {
      throw new Error(describeMailError(error));
    }
    return;
  }

  if (transport === "smtp") {
    if (!runtime.smtp) {
      throw new Error("SMTP is selected in Studio but host, user, password, and From email are required.");
    }
    try {
      await sendWithSmtp(message, runtime.smtp);
    } catch (error) {
      throw new Error(describeMailError(error));
    }
    return;
  }

  if (provider) {
    throw new Error("Choose Amazon SES or SMTP before sending a test.");
  }

  logger.info("mailer.log", { to: message.to, subject: message.subject, text: message.text });
}

export async function sendMail(message: MailMessage) {
  await sendMailUsing(message);
}

export async function sendMailSafe(message: MailMessage) {
  try {
    await sendMail(message);
  } catch (error) {
    logger.error("mailer.failed", {
      to: message.to,
      subject: message.subject,
      error: describeMailError(error),
    });
  }
}

export { describeMailError } from "./mailer.errors";
export { mailFromAddress, getMailRuntime, clearMailRuntimeCache } from "./mailer.runtime";
