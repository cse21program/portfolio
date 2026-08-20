import { prisma } from "@common/database/prisma";
import type { PaymentProviderId } from "../gateways/gateway";
import { decryptCredentials, encryptCredentials } from "./crypto";
import type { PaymentProviderMode } from "./catalog";

export type StoredProviderSetting = {
  provider: PaymentProviderId;
  enabled: boolean;
  mode: PaymentProviderMode;
  credentials: Record<string, string>;
};

function asMode(value: string): PaymentProviderMode {
  return value === "live" ? "live" : "demo";
}

export const providerSettingsRepository = {
  async list(): Promise<StoredProviderSetting[]> {
    const rows = await prisma.paymentProviderSetting.findMany();
    return rows.map((row) => ({
      provider: row.provider as PaymentProviderId,
      enabled: row.enabled,
      mode: asMode(row.mode),
      credentials: decryptCredentials(row.credentials),
    }));
  },

  async find(provider: PaymentProviderId): Promise<StoredProviderSetting | null> {
    const row = await prisma.paymentProviderSetting.findUnique({ where: { provider } });
    if (!row) {
      return null;
    }
    return {
      provider,
      enabled: row.enabled,
      mode: asMode(row.mode),
      credentials: decryptCredentials(row.credentials),
    };
  },

  async upsert(input: StoredProviderSetting): Promise<StoredProviderSetting> {
    const row = await prisma.paymentProviderSetting.upsert({
      where: { provider: input.provider },
      create: {
        provider: input.provider,
        enabled: input.enabled,
        mode: input.mode,
        credentials: encryptCredentials(input.credentials),
      },
      update: {
        enabled: input.enabled,
        mode: input.mode,
        credentials: encryptCredentials(input.credentials),
      },
    });
    return {
      provider: input.provider,
      enabled: row.enabled,
      mode: asMode(row.mode),
      credentials: decryptCredentials(row.credentials),
    };
  },
};
