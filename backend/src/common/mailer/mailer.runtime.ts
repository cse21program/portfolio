import { env } from "@common/config/env";
import { sesSmtpHost } from "./mailer.catalog";
import { envMailFallback, mailSettingsRepository } from "./mailer.settings";
import type { MailRuntime, MailTransportId, SmtpSendConfig } from "./mailer.types";

let cache: MailRuntime | undefined;

export function clearMailRuntimeCache() {
  cache = undefined;
}

function parsePort(value: string | undefined, fallback: number) {
  const parsed = Number(value?.trim() || fallback);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    return fallback;
  }
  return parsed;
}

function sesFromCredentials(
  credentials: Record<string, string>,
  fallback: ReturnType<typeof envMailFallback>,
): SmtpSendConfig | null {
  const fromEmail = credentials.fromEmail?.trim() || fallback.fromEmail;
  const user = credentials.user?.trim() || fallback.sesSmtp.user;
  const password = credentials.password || fallback.sesSmtp.password;
  if (!fromEmail || !user || !password) {
    return null;
  }
  const region = credentials.region?.trim() || fallback.region;
  return {
    host: sesSmtpHost(region),
    port: 587,
    secure: false,
    user,
    password,
    fromEmail,
    fromName: credentials.fromName?.trim() || fallback.fromName,
  };
}

function smtpFromCredentials(
  credentials: Record<string, string>,
  fallback: ReturnType<typeof envMailFallback>,
): SmtpSendConfig | null {
  const host = credentials.host?.trim() || fallback.smtp.host;
  const user = credentials.user?.trim() || fallback.smtp.user;
  const password = credentials.password || fallback.smtp.password;
  const fromEmail = credentials.fromEmail?.trim() || fallback.fromEmail;
  if (!host || !user || !password || !fromEmail) {
    return null;
  }
  const port = parsePort(credentials.port, fallback.smtp.port);
  const secureFlag = credentials.secure?.trim();
  const secure = secureFlag === "ssl" || (!secureFlag && (fallback.smtp.secure || port === 465));
  return {
    host,
    port,
    secure,
    user,
    password,
    fromEmail,
    fromName: credentials.fromName?.trim() || fallback.fromName,
  };
}

function envTransport(fallback: ReturnType<typeof envMailFallback>): MailTransportId {
  if (fallback.transport) {
    return fallback.transport;
  }
  if (env.NODE_ENV === "production" && fallback.fromEmail && fallback.sesSmtp.user && fallback.sesSmtp.password) {
    return "ses";
  }
  return "log";
}

export async function getMailRuntime(): Promise<MailRuntime> {
  if (cache) {
    return cache;
  }

  const fallback = envMailFallback();
  const [storedActive, providers] = await Promise.all([
    mailSettingsRepository.getActive(),
    mailSettingsRepository.listProviders(),
  ]);
  const sesCredentials = providers.find((item) => item.provider === "ses")?.credentials ?? {};
  const smtpCredentials = providers.find((item) => item.provider === "smtp")?.credentials ?? {};
  const ses = sesFromCredentials(sesCredentials, fallback);
  const smtp = smtpFromCredentials(smtpCredentials, fallback);
  const transport: MailTransportId =
    storedActive === "log" || storedActive === "ses" || storedActive === "smtp"
      ? storedActive
      : envTransport(fallback);
  const selected = transport === "smtp" ? smtp : transport === "ses" ? ses : null;

  cache = {
    transport,
    fromEmail: selected?.fromEmail || ses?.fromEmail || smtp?.fromEmail || fallback.fromEmail,
    fromName: selected?.fromName || ses?.fromName || smtp?.fromName || fallback.fromName,
    ses,
    smtp,
  };
  return cache;
}

export async function mailFromAddress() {
  const runtime = await getMailRuntime();
  return runtime.fromEmail.trim() || env.ADMIN_BOOTSTRAP_EMAIL?.trim() || "";
}
