import { execSync } from "node:child_process";
import path from "node:path";
import dotenv from "dotenv";
import { Client } from "pg";

export default async function globalSetup() {
  process.env.NODE_ENV = "test";
  dotenv.config({
    path: path.resolve(process.cwd(), ".env.test"),
    override: true,
  });

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for tests");
  }

  const dbName = databaseUrl.match(/\/([^/?]+)(?:\?|$)/)?.[1];
  if (!dbName) {
    throw new Error("Could not parse database name from DATABASE_URL");
  }

  const adminUrl = databaseUrl.replace(/\/([^/?]+)(\?|$)/, "/postgres$2");
  const client = new Client({ connectionString: adminUrl });
  await client.connect();

  const existing = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
  if ((existing.rowCount ?? 0) === 0) {
    await client.query(`CREATE DATABASE "${dbName}"`);
  }

  await client.end();

  execSync("npx prisma migrate deploy", {
    cwd: process.cwd(),
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_ENV: "test",
      DATABASE_URL: databaseUrl,
    },
  });
}
