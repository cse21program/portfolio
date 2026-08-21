export const mailProviders = ["ses", "smtp"] as const;
export type MailProviderId = (typeof mailProviders)[number];
export type MailTransportId = "log" | MailProviderId;

export type MailCredentialField = {
  key: string;
  label: string;
  hint: string;
  type: "password" | "text" | "select";
  options?: Array<{ value: string; label: string }>;
  required: boolean;
  configured: boolean;
  value?: string;
};

export type AdminMailProvider = {
  id: MailProviderId;
  name: string;
  hint: string;
  ready: boolean;
  active: boolean;
  fields: MailCredentialField[];
};

export type AdminMailSettings = {
  transport: MailTransportId;
  active: MailTransportId | "";
  fromEmail: string;
  fromName: string;
  providers: AdminMailProvider[];
};
