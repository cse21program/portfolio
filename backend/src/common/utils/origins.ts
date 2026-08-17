export function stripWwwHost(host: string) {
  return host.trim().replace(/^www\./i, "");
}

export function allowedOrigins(corsOrigin: string) {
  const listed = corsOrigin
    .split(",")
    .map((value) => value.trim().replace(/\/$/, ""))
    .filter(Boolean);

  const extra: string[] = [];
  for (const origin of listed) {
    try {
      const url = new URL(origin);
      if (url.hostname === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(url.hostname)) {
        continue;
      }
      if (url.hostname.startsWith("www.")) {
        extra.push(`${url.protocol}//${url.hostname.slice(4)}`);
      } else if (url.hostname.includes(".")) {
        extra.push(`${url.protocol}//www.${url.hostname}`);
      }
    } catch {
      // Ignore malformed entries; CORS will simply omit them.
    }
  }

  return [...new Set([...listed, ...extra])];
}

export function cookieDomainFromFrontend(frontendUrl: string) {
  try {
    const hostname = new URL(frontendUrl).hostname.replace(/^www\./i, "").toLowerCase();
    if (!hostname || hostname === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
      return undefined;
    }
    if (!hostname.includes(".")) {
      return undefined;
    }
    return `.${hostname}`;
  } catch {
    return undefined;
  }
}
