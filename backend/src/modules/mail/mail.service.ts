import { AppError, ErrorCode } from "@common/errors/AppError";
import {
  isMailProviderId,
  isSecretMailField,
  mailCredentialFields,
  mailProviderCatalog,
  mergeCredentials,
} from "@common/mailer/mailer.catalog";
import { sendMailUsing } from "@common/mailer/mailer";
import { clearMailRuntimeCache, getMailRuntime } from "@common/mailer/mailer.runtime";
import { mailSettingsRepository } from "@common/mailer/mailer.settings";
import { studioTestEmail } from "@common/mailer/mailer.templates";
import type { MailProviderId, MailTransportId } from "@common/mailer/mailer.types";
import type { SetMailTransportInput, TestMailInput, UpdateMailProviderInput } from "./mail.validation";

type Actor = { id: string; email: string; role: "CUSTOMER" | "ADMIN" };

function assertAdmin(actor: Actor) {
  if (actor.role !== "ADMIN") {
    throw new AppError(ErrorCode.FORBIDDEN, "You do not have access to this resource", 403);
  }
}

function transportLabel(id: MailTransportId) {
  if (id === "ses") {
    return "Amazon SES";
  }
  if (id === "smtp") {
    return "SMTP";
  }
  return "log only";
}

async function credentialsFor(provider: MailProviderId) {
  const stored = await mailSettingsRepository.findProvider(provider);
  return stored?.credentials ?? {};
}

function toAdminProvider(
  provider: MailProviderId,
  credentials: Record<string, string>,
  runtime: Awaited<ReturnType<typeof getMailRuntime>>,
) {
  const spec = mailProviderCatalog.find((item) => item.id === provider)!;
  return {
    id: provider,
    name: spec.name,
    hint: spec.hint,
    ready: provider === "ses" ? Boolean(runtime.ses) : Boolean(runtime.smtp),
    active: runtime.transport === provider,
    fields: mailCredentialFields[provider].map((field) => ({
      key: field.key,
      label: field.label,
      hint: field.hint,
      type: field.type,
      options: field.options,
      required: field.required,
      configured: Boolean(credentials[field.key]),
      value: isSecretMailField(field) ? undefined : (credentials[field.key] ?? ""),
    })),
  };
}

export const mailService = {
  async getAdmin(actor: Actor) {
    assertAdmin(actor);
    const [runtime, storedActive, providers] = await Promise.all([
      getMailRuntime(),
      mailSettingsRepository.getActive(),
      mailSettingsRepository.listProviders(),
    ]);
    const byId = Object.fromEntries(providers.map((item) => [item.provider, item.credentials]));
    return {
      transport: runtime.transport,
      active: storedActive,
      fromEmail: runtime.fromEmail,
      fromName: runtime.fromName,
      providers: mailProviderCatalog.map((item) =>
        toAdminProvider(item.id, byId[item.id] ?? {}, runtime),
      ),
    };
  },

  async updateProvider(id: string, input: UpdateMailProviderInput, actor: Actor) {
    assertAdmin(actor);
    if (!isMailProviderId(id)) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "Unknown mail provider", 400);
    }
    const existing = await credentialsFor(id);
    const secretKeys = mailCredentialFields[id].filter(isSecretMailField).map((field) => field.key);
    const credentials = mergeCredentials(existing, input.credentials, secretKeys);
    const saved = await mailSettingsRepository.upsertProvider({ provider: id, credentials });
    clearMailRuntimeCache();
    if (input.activate) {
      const preview = await getMailRuntime();
      if ((id === "ses" && !preview.ses) || (id === "smtp" && !preview.smtp)) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          id === "ses"
            ? "Amazon SES needs SMTP username, password, and a verified From email."
            : "SMTP needs host, user, password, and From email before it can send.",
          400,
        );
      }
      await mailSettingsRepository.setActive(id);
      clearMailRuntimeCache();
    }
    const runtime = await getMailRuntime();
    return toAdminProvider(id, saved.credentials, runtime);
  },

  async setTransport(input: SetMailTransportInput, actor: Actor) {
    assertAdmin(actor);
    if (input.transport !== "log") {
      const preview = await getMailRuntime();
      if ((input.transport === "ses" && !preview.ses) || (input.transport === "smtp" && !preview.smtp)) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          input.transport === "ses"
            ? "Amazon SES needs SMTP username, password, and a verified From email."
            : "SMTP needs host, user, password, and From email before it can send.",
          400,
        );
      }
    }
    await mailSettingsRepository.setActive(input.transport);
    clearMailRuntimeCache();
    return this.getAdmin(actor);
  },

  async sendTest(input: TestMailInput, actor: Actor) {
    assertAdmin(actor);
    const to = input.to?.trim() || actor.email;
    const runtime = await getMailRuntime();
    const provider = input.provider ?? (runtime.transport === "log" ? undefined : runtime.transport);
    if (!provider) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        "Choose Amazon SES or SMTP before sending a test.",
        400,
      );
    }
    const label = transportLabel(provider);
    await sendMailUsing({ to, ...studioTestEmail({ transportLabel: label }) }, provider);
    return { to, provider };
  },
};
