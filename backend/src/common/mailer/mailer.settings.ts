import { env } from "@common/config/env";
import { encryptCredentials, decryptCredentials } from "@modules/payments/providers/crypto";
import { prisma } from "@common/database/prisma";
import type { MailProviderId, MailTransportId } from "./mailer.types";

const SETTINGS_ID = "mail";

export type StoredMailProvider = {
  provider: MailProviderId;
  credentials: Record<string, string>;
};

export const mailSettingsRepository = {
  async getActive(): Promise<MailTransportId | ""> {
    const row = await prisma.mailSettings.findUnique({ where: { id: SETTINGS_ID } });
    if (!row) {
      return "";
    }
    if (row.active === "ses" || row.active === "smtp" || row.active === "log") {
      return row.active;
    }
    return "";
  },

  async setActive(active: MailTransportId) {
    await prisma.mailSettings.upsert({
      where: { id: SETTINGS_ID },
      create: { id: SETTINGS_ID, active },
      update: { active },
    });
  },

  async listProviders(): Promise<StoredMailProvider[]> {
    const rows = await prisma.mailProviderSetting.findMany();
    return rows
      .filter((row) => row.provider === "ses" || row.provider === "smtp")
      .map((row) => ({
        provider: row.provider as MailProviderId,
        credentials: decryptCredentials(row.credentials),
      }));
  },

  async findProvider(provider: MailProviderId): Promise<StoredMailProvider | null> {
    const row = await prisma.mailProviderSetting.findUnique({ where: { provider } });
    if (!row) {
      return null;
    }
    return {
      provider,
      credentials: decryptCredentials(row.credentials),
    };
  },

  async upsertProvider(input: StoredMailProvider): Promise<StoredMailProvider> {
    const row = await prisma.mailProviderSetting.upsert({
      where: { provider: input.provider },
      create: {
        provider: input.provider,
        credentials: encryptCredentials(input.credentials),
      },
      update: {
        credentials: encryptCredentials(input.credentials),
      },
    });
    return {
      provider: input.provider,
      credentials: decryptCredentials(row.credentials),
    };
  },
};

export function envMailFallback() {
  return {
    fromEmail: env.MAIL_FROM?.trim() ?? "",
    fromName: env.MAIL_FROM_NAME,
    transport: env.MAIL_TRANSPORT,
    smtp: {
      host: env.MAIL_SMTP_HOST?.trim() ?? "",
      port: env.MAIL_SMTP_PORT,
      user: env.MAIL_SMTP_USER?.trim() ?? "",
      password: env.MAIL_SMTP_PASS ?? "",
      secure: Boolean(env.MAIL_SMTP_SECURE),
    },
    region: env.AWS_REGION,
    sesSmtp: {
      user: env.MAIL_SES_SMTP_USER?.trim() ?? "",
      password: env.MAIL_SES_SMTP_PASS ?? "",
    },
  };
}
