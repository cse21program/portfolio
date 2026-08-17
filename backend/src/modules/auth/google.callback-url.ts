import { stripWwwHost } from "@common/utils/origins";

type RequestLike = {
  get(name: string): string | undefined;
  protocol: string;
};

function firstHeader(value: string | undefined) {
  return value?.split(",")[0]?.trim() || "";
}

export function publicOrigin(req: RequestLike, fallbackOrigin: string) {
  const host = firstHeader(req.get("x-forwarded-host")) || firstHeader(req.get("host"));
  if (!host) {
    try {
      return new URL(fallbackOrigin).origin.replace(/^(https?:\/\/)www\./i, "$1");
    } catch {
      return fallbackOrigin.replace(/\/$/, "").replace(/^(https?:\/\/)www\./i, "$1");
    }
  }
  const proto = firstHeader(req.get("x-forwarded-proto")) || req.protocol || "https";
  return `${proto}://${stripWwwHost(host)}`;
}

export function googleCallbackUrl(
  req: RequestLike,
  options: { apiPrefix: string; fallbackOrigin: string },
) {
  return `${publicOrigin(req, options.fallbackOrigin)}${options.apiPrefix}/auth/google/callback`;
}
