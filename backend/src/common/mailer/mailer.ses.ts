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
    maxAttempts: 1,
  }) as SesSender;
  return client;
}

const SES_TIMEOUT_MS = isTest ? 200 : 8000;

function fromAddress() {
  const email = env.MAIL_FROM;
  if (!email) {
    throw new Error("MAIL_FROM is not set");
  }
  const name = env.MAIL_FROM_NAME.trim();
  return name ? `${name} <${email}>` : email;
}

export async function sendWithSes(message: MailMessage) {
  const headers = Object.entries(message.headers ?? {}).map(([Name, Value]) => ({ Name, Value }));
  const command = new SendEmailCommand({
    FromEmailAddress: fromAddress(),
    Destination: { ToAddresses: [message.to] },
    ReplyToAddresses: env.MAIL_FROM ? [env.MAIL_FROM] : undefined,
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
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      ses().send(command, { abortSignal: controller.signal }),
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(new Error("ses_timeout"));
        }, SES_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}
