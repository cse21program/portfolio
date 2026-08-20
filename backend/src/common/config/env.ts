import { z } from "zod";
import path from "node:path";
import dotenv from "dotenv";

const envFile = process.env.NODE_ENV === "test" ? ".env.test" : ".env";
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  API_PREFIX: z.string().default("/api/v1"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  FRONTEND_URL: z.string().default("http://localhost:5173"),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  COOKIE_SECURE: z.preprocess((value) => {
    if (value === undefined || value === "") return undefined;
    if (value === "true" || value === true) return true;
    if (value === "false" || value === false) return false;
    return value;
  }, z.boolean().optional()),
  ADMIN_BOOTSTRAP_EMAIL: z.preprocess(
    (value) => (value === "" || value === undefined ? undefined : value),
    z.string().email().optional(),
  ),
  GOOGLE_CLIENT_ID: z.preprocess(
    (value) => (value === "" || value === undefined ? undefined : value),
    z.string().min(1).optional(),
  ),
  GOOGLE_CLIENT_SECRET: z.preprocess(
    (value) => (value === "" || value === undefined ? undefined : value),
    z.string().min(1).optional(),
  ),
  GOOGLE_CALLBACK_URL: z.preprocess(
    (value) => (value === "" || value === undefined ? undefined : value),
    z.string().url().optional(),
  ),
  REDIS_URL: z.preprocess(
    (value) => (value === "" || value === undefined ? undefined : value),
    z.string().min(1).optional(),
  ),
  S3_UPLOADS_BUCKET: z.preprocess(
    (value) => (value === "" || value === undefined ? undefined : value),
    z.string().min(1).optional(),
  ),
  AWS_REGION: z.string().default("ap-south-1"),
  MAIL_FROM: z.preprocess(
    (value) => (value === "" || value === undefined ? undefined : value),
    z.string().email().optional(),
  ),
  MAIL_FROM_NAME: z.string().default("Rezaul Karim"),
  MAIL_TRANSPORT: z.preprocess(
    (value) => (value === "" || value === undefined ? undefined : value),
    z.enum(["log", "ses"]).optional(),
  ),
  PAYMENT_WEBHOOK_SECRET: z.preprocess(
    (value) => (value === "" || value === undefined ? undefined : value),
    z.string().min(16).default("demo-payment-webhook-secret-min-32"),
  ),
  PAYMENT_CREDENTIALS_SECRET: z.preprocess(
    (value) => (value === "" || value === undefined ? undefined : value),
    z.string().min(16).optional(),
  ),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = {
  ...parsed.data,
  GOOGLE_CALLBACK_URL:
    parsed.data.GOOGLE_CALLBACK_URL ??
    `${parsed.data.FRONTEND_URL.replace(/\/$/, "")}${parsed.data.API_PREFIX}/auth/google/callback`,
};
export const isDev = env.NODE_ENV === "development";
export const isTest = env.NODE_ENV === "test";
export const googleOAuthEnabled = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
