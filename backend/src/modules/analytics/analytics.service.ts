import { createHash } from "node:crypto";
import type { Request } from "express";
import { prisma } from "@common/database/prisma";

const PATH_MAX = 200;
const SKIP_PATH = /^\/(admin|dashboard|login|register|forgot-password|reset-password|verify-email|api)(\/|$)/i;
const BOT_UA =
  /bot|crawler|spider|crawling|preview|monitor|headless|wget|curl|facebookexternalhit|slurp/i;

export function sanitizeViewPath(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.length > PATH_MAX) {
    return null;
  }
  if (trimmed.includes("://") || trimmed.includes("\\") || trimmed.includes("\0")) {
    return null;
  }
  if (SKIP_PATH.test(trimmed)) {
    return null;
  }
  return trimmed;
}

export function isAutomatedClient(userAgent: unknown) {
  if (typeof userAgent !== "string" || !userAgent.trim()) {
    return false;
  }
  return BOT_UA.test(userAgent);
}

function clientIp(req: Request) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return req.ip ?? req.socket.remoteAddress ?? "unknown";
}

export function visitorKeyFor(req: Request) {
  const ua = String(req.headers["user-agent"] ?? "");
  return createHash("sha256").update(`${clientIp(req)}\n${ua}`).digest("hex");
}

export const analyticsService = {
  async recordPageview(req: Request, path: string) {
    if (isAutomatedClient(req.headers["user-agent"])) {
      return;
    }
    const safePath = sanitizeViewPath(path);
    if (!safePath) {
      return;
    }
    await prisma.siteVisit.create({
      data: {
        visitorKey: visitorKeyFor(req),
        path: safePath,
      },
    });
  },
};
