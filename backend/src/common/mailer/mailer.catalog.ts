import type { MailProviderId } from "./mailer.types";

export type CredentialFieldType = "password" | "text" | "select";

export type MailCredentialFieldSpec = {
  key: string;
  label: string;
  hint: string;
  type: CredentialFieldType;
  options?: Array<{ value: string; label: string }>;
  required: boolean;
};

export const mailProviderIds = ["ses", "smtp"] as const;

export const mailProviderCatalog: Array<{
  id: MailProviderId;
  name: string;
  hint: string;
}> = [
  {
    id: "ses",
    name: "Amazon SES",
    hint: "Sends through SES SMTP with Nodemailer. Works from a laptop and from EC2. Create SMTP credentials in the SES console — not IAM access keys, and not the instance role.",
  },
  {
    id: "smtp",
    name: "SMTP",
    hint: "Any other mailbox: Gmail, Workspace, or a host you already use.",
  },
];

export const mailCredentialFields: Record<MailProviderId, MailCredentialFieldSpec[]> = {
  ses: [
    {
      key: "fromEmail",
      label: "From email",
      hint: "Must be a verified identity in SES.",
      type: "text",
      required: true,
    },
    {
      key: "fromName",
      label: "From name",
      hint: "Shown as the sender display name.",
      type: "text",
      required: false,
    },
    {
      key: "region",
      label: "AWS region",
      hint: "The SES identity region. SMTP host becomes email-smtp.{region}.amazonaws.com.",
      type: "text",
      required: true,
    },
    {
      key: "user",
      label: "SMTP username",
      hint: "From SES → SMTP settings → Create SMTP credentials. Not your AWS login.",
      type: "text",
      required: true,
    },
    {
      key: "password",
      label: "SMTP password",
      hint: "Shown once when you create SES SMTP credentials.",
      type: "password",
      required: true,
    },
  ],
  smtp: [
    {
      key: "host",
      label: "SMTP host",
      hint: "For example smtp.gmail.com.",
      type: "text",
      required: true,
    },
    {
      key: "port",
      label: "Port",
      hint: "587 for STARTTLS, 465 for SSL.",
      type: "text",
      required: true,
    },
    {
      key: "secure",
      label: "Encryption",
      hint: "Match the port. STARTTLS is typical for 587.",
      type: "select",
      options: [
        { value: "starttls", label: "STARTTLS (587)" },
        { value: "ssl", label: "SSL (465)" },
      ],
      required: true,
    },
    {
      key: "user",
      label: "Username",
      hint: "SMTP username or mailbox address.",
      type: "text",
      required: true,
    },
    {
      key: "password",
      label: "Password",
      hint: "SMTP password or app password.",
      type: "password",
      required: true,
    },
    {
      key: "fromEmail",
      label: "From email",
      hint: "The address recipients see. Must be allowed by the SMTP account.",
      type: "text",
      required: true,
    },
    {
      key: "fromName",
      label: "From name",
      hint: "Shown as the sender display name.",
      type: "text",
      required: false,
    },
  ],
};

export function sesSmtpHost(region: string) {
  const trimmed = region.trim() || "ap-south-1";
  return `email-smtp.${trimmed}.amazonaws.com`;
}

export function isMailProviderId(value: string): value is MailProviderId {
  return mailProviderIds.includes(value as MailProviderId);
}

export function isSecretMailField(field: MailCredentialFieldSpec) {
  return field.type === "password";
}

export function mergeCredentials(
  existing: Record<string, string>,
  incoming: Record<string, string> | undefined,
  secretKeys: string[] = [],
) {
  const next = { ...existing };
  const secrets = new Set(secretKeys);
  for (const [key, value] of Object.entries(incoming ?? {})) {
    if (value === "") {
      if (secrets.has(key)) {
        continue;
      }
      delete next[key];
      continue;
    }
    next[key] = value.trim();
  }
  return next;
}

export function requiredMailKeys(id: MailProviderId) {
  return mailCredentialFields[id].filter((field) => field.required).map((field) => field.key);
}

export function isProviderReady(id: MailProviderId, credentials: Record<string, string>) {
  return requiredMailKeys(id).every((key) => Boolean(credentials[key]?.trim()));
}
