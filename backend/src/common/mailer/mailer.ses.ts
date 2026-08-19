import { SendEmailCommand, SESv2Client } from "@aws-sdk/client-sesv2";
import { env, isTest } from "@common/config/env";
import type { MailMessage } from "./mailer.types";

type SesSender = {
  send: (command: unknown, options?: { abortSignal?: AbortSignal }) => Promise<unknown>;
};

let client: SesSender | undefined;

export function setSesClient(value?: SesSender) {
  client = value;
}

function ses(): SesSender {
  client ??= new SESv2Client({
    region: env.AWS_REGION,
    maxAttempts: 2,
  }) as SesSender;
  return client;
}

const SES_TIMEOUT_MS = isTest ? 200 : 8000;

export function sesFromAddress(email: string, name: string) {
  const trimmed = name.trim().replaceAll('"', "");
  return trimmed ? `"${trimmed}" <${email}>` : email;
}

export async function sendWithSes(message: MailMessage) {
  const email = env.MAIL_FROM;
  if (!email) {
    throw new Error("MAIL_FROM is not set");
  }
  const headers = Object.entries(message.headers ?? {}).map(([Name, Value]) => ({ Name, Value }));
  const command = new SendEmailCommand({
    FromEmailAddress: sesFromAddress(email, env.MAIL_FROM_NAME),
    Destination: { ToAddresses: [message.to] },
    ReplyToAddresses: [email],
    Content: {
      Simple: {
        Subject: { Data: message.subject, Charset: "UTF-8" },
        Body: {
          Text: { Data: message.text, Charset: "UTF-8" },
          Html: { Data: message.html, Charset: "UTF-8" },
        },
        Headers: headers.length > 0 ? headers : undefined,
      },
    },
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SES_TIMEOUT_MS);
  try {
    await ses().send(command, { abortSignal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error("ses_timeout");
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
