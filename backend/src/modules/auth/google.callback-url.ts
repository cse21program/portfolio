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
    return fallbackOrigin.replace(/\/$/, "");
  }
  const proto = firstHeader(req.get("x-forwarded-proto")) || req.protocol || "https";
  return `${proto}://${host}`;
}

export function googleCallbackUrl(
  req: RequestLike,
  options: { apiPrefix: string; configured: string; fallbackOrigin: string },
) {
  const fromRequest = `${publicOrigin(req, options.fallbackOrigin)}${options.apiPrefix}/auth/google/callback`;
  try {
    const configuredHost = new URL(options.configured).hostname;
    const requestHost = new URL(fromRequest).hostname;
    if (configuredHost && requestHost && configuredHost !== requestHost) {
      return fromRequest;
    }
  } catch {
    return fromRequest;
  }
  return options.configured;
}
