import { env } from "@common/config/env";
import { AppError, ErrorCode } from "@common/errors/AppError";
import { createDemoGateway } from "./demo.gateway";
import { createLiveGateway } from "./live.gateway";
import {
  paymentProviderCatalog,
  type PaymentGateway,
  type PaymentProviderId,
  type PublicPaymentProvider,
} from "./gateway";
import { hasLiveCredentials } from "../providers/catalog";
import { providerSettingsRepository, type StoredProviderSetting } from "../providers/settings.repository";

export type ResolvePurpose = "checkout" | "webhook" | "payment";

const defaultSetting = (id: PaymentProviderId): StoredProviderSetting => ({
  provider: id,
  enabled: true,
  mode: "demo",
  credentials: {},
});

async function settingMap() {
  const rows = await providerSettingsRepository.list();
  return new Map(rows.map((row) => [row.provider, row]));
}

export async function getProviderSetting(id: PaymentProviderId) {
  return (await providerSettingsRepository.find(id)) ?? defaultSetting(id);
}

export function paymentWebhookUrl(id: PaymentProviderId) {
  return `${env.FRONTEND_URL.replace(/\/$/, "")}${env.API_PREFIX}/payments/webhooks/${id}`;
}

export function isLiveReady(setting: StoredProviderSetting) {
  return setting.mode === "live" && hasLiveCredentials(setting.provider, setting.credentials);
}

function toPublic(setting: StoredProviderSetting): PublicPaymentProvider {
  const catalog = paymentProviderCatalog.find((item) => item.id === setting.provider)!;
  const live = isLiveReady(setting);
  return {
    id: catalog.id,
    name: catalog.name,
    kind: catalog.kind,
    methods: catalog.methods,
    hint: live ? catalog.liveHint : catalog.demoHint,
    demo: !live,
  };
}

export async function listPaymentGateways(): Promise<PublicPaymentProvider[]> {
  const stored = await settingMap();
  return paymentProviderCatalog.flatMap((item) => {
    const setting = stored.get(item.id) ?? defaultSetting(item.id);
    if (!setting.enabled) {
      return [];
    }
    return [toPublic({ ...setting, provider: item.id })];
  });
}

export async function listAdminProviderStates() {
  const stored = await settingMap();
  return paymentProviderCatalog.map((item) => {
    const setting = stored.get(item.id) ?? defaultSetting(item.id);
    return {
      ...setting,
      provider: item.id,
      name: item.name,
      kind: item.kind,
      webhookUrl: item.kind === "manual" ? "" : paymentWebhookUrl(item.id),
      liveReady: isLiveReady({ ...setting, provider: item.id }),
    };
  });
}

export async function getPaymentGateway(
  id: string,
  purpose: ResolvePurpose = "checkout",
): Promise<PaymentGateway> {
  const catalog = paymentProviderCatalog.find((item) => item.id === id);
  if (!catalog) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "Unknown payment provider", 400);
  }
  const setting = await getProviderSetting(catalog.id);
  if (purpose === "checkout" && !setting.enabled) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "This payment provider is turned off", 400);
  }
  if (isLiveReady(setting)) {
    return createLiveGateway(catalog.id, setting.credentials);
  }
  return createDemoGateway(catalog.id);
}

export async function gatewayForPayment(provider: PaymentProviderId, demo: boolean) {
  if (demo) {
    return createDemoGateway(provider);
  }
  const setting = await getProviderSetting(provider);
  if (!isLiveReady(setting)) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Live credentials for this provider are missing. Add them in Studio → Payments.",
      400,
    );
  }
  return createLiveGateway(provider, setting.credentials);
}

export async function defaultProviderForMethod(method: string): Promise<PaymentProviderId> {
  const enabled = await listPaymentGateways();
  if (enabled.length === 0) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Payments are not configured. Enable a gateway in Studio → Payments.",
      400,
    );
  }
  const matching = enabled.filter((item) => item.methods.includes(method));
  const preferred = method === "card" ? "stripe" : method === "bank" ? "bank" : "paypal";
  return matching.find((item) => item.id === preferred)?.id ?? matching[0]?.id ?? enabled[0]!.id;
}
