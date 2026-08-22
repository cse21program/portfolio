import { SendEmailCommand, SESv2Client } from "@aws-sdk/client-sesv2";
import { env, isTest } from "@common/config/env";
import type { MailMessage, SesSendConfig } from "./mailer.types";

type SesSender = {
  send: (command: unknown, options?: { abortSignal?: AbortSignal }) => Promise<unknown>;
};

let injected: SesSender | undefined;
let client: SesSender | undefined;
let clientKey = "";

export function setSesClient(value?: SesSender) {
  injected = value;
  client = undefined;
  clientKey = "";
}

function sesClient(config: SesSendConfig): SesSender {
  if (injected) {
    return injected;
  }
  const key = `${config.region}:${config.accessKeyId ?? ""}`;
  if (!client || clientKey !== key) {
    client = new SESv2Client({
      region: config.region,
      maxAttempts: 2,
      ...(config.accessKeyId && config.secretAccessKey
        ? { credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey } }
        : {}),
    }) as SesSender;
    clientKey = key;
  }
  return client;
}

const SES_TIMEOUT_MS = isTest ? 200 : 8000;

export function sesFromAddress(email: string, name: string) {
  const trimmed = name.trim().replaceAll('"', "");
  return trimmed ? `"${trimmed}" <${email}>` : email;
}

function fallbackConfig(): SesSendConfig {
  const email = env.MAIL_FROM;
  if (!email) {
    throw new Error("MAIL_FROM is not set");
  }
  return {
    fromEmail: email,
    fromName: env.MAIL_FROM_NAME,
    region: env.AWS_REGION,
  };
}

export async function sendWithSes(message: MailMessage, config?: SesSendConfig) {
  const resolved = config ?? fallbackConfig();
  if (!resolved.fromEmail) {
    throw new Error("MAIL_FROM is not set");
  }
  const headers = Object.entries(message.headers ?? {}).map(([Name, Value]) => ({ Name, Value }));
  const command = new SendEmailCommand({
    FromEmailAddress: sesFromAddress(resolved.fromEmail, resolved.fromName),
    Destination: { ToAddresses: [message.to] },
    ReplyToAddresses: [resolved.fromEmail],
    ConfigurationSetName: resolved.configurationSet || undefined,
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
    await sesClient(resolved).send(command, { abortSignal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error("ses_timeout");
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
