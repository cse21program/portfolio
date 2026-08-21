import nodemailer from "nodemailer";
import { isTest } from "@common/config/env";
import { sesFromAddress } from "./mailer.ses";
import type { MailMessage, SmtpSendConfig } from "./mailer.types";

type SmtpSender = {
  sendMail: (message: {
    from: string;
    to: string;
    subject: string;
    text: string;
    html: string;
    replyTo: string;
    headers?: Record<string, string>;
  }) => Promise<unknown>;
  close?: () => void;
};

let injected: SmtpSender | undefined;
let transport: SmtpSender | undefined;
let transportKey = "";

export function setSmtpTransport(value?: SmtpSender) {
  injected = value;
  transport?.close?.();
  transport = undefined;
  transportKey = "";
}

function smtpTransport(config: SmtpSendConfig): SmtpSender {
  if (injected) {
    return injected;
  }
  const key = `${config.host}:${config.port}:${config.user}:${config.secure ? "ssl" : "starttls"}`;
  if (!transport || transportKey !== key) {
    transport?.close?.();
    transport = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.password,
      },
      connectionTimeout: isTest ? 200 : 8000,
      greetingTimeout: isTest ? 200 : 8000,
      socketTimeout: isTest ? 200 : 8000,
    }) as SmtpSender;
    transportKey = key;
  }
  return transport;
}

export async function sendWithSmtp(message: MailMessage, config: SmtpSendConfig) {
  if (!config.fromEmail) {
    throw new Error("MAIL_FROM is not set");
  }
  if (!config.host || !config.user || !config.password) {
    throw new Error("SMTP is not configured");
  }
  await smtpTransport(config).sendMail({
    from: sesFromAddress(config.fromEmail, config.fromName),
    to: message.to,
    subject: message.subject,
    text: message.text,
    html: message.html,
    replyTo: config.fromEmail,
    headers: message.headers,
  });
}
