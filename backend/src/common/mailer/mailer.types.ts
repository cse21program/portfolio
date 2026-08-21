export type MailTransportId = "log" | "ses" | "smtp";
export type MailProviderId = "ses" | "smtp";

export type MailMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
  headers?: Record<string, string>;
};

export type SesSendConfig = {
  fromEmail: string;
  fromName: string;
  region: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  configurationSet?: string;
};

export type SmtpSendConfig = {
  fromEmail: string;
  fromName: string;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
};

export type MailRuntime = {
  transport: MailTransportId;
  fromEmail: string;
  fromName: string;
  ses: SmtpSendConfig | null;
  smtp: SmtpSendConfig | null;
};
