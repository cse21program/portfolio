const DISALLOWED_SCHEME = /^(javascript|data|vbscript|file):/i;

export function profileEtag(version: number) {
  return `"${version}"`;
}

export function parseEtag(header: string | undefined) {
  if (!header) {
    return null;
  }
  const value = header.trim();
  if (value === "*" || value === "W/*") {
    return "*";
  }
  const match = value.match(/^(?:W\/)?"(\d+)"$/);
  if (!match?.[1]) {
    return null;
  }
  return Number(match[1]);
}

export function isSafeSitePath(value: string) {
  return value.startsWith("/") && !value.startsWith("//") && !value.includes("\\");
}

export function isHttpsUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.username === "" && url.password === "";
  } catch {
    return false;
  }
}

export function isMailto(value: string) {
  return /^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(value);
}

export function isMediaRef(value: string) {
  if (DISALLOWED_SCHEME.test(value)) {
    return false;
  }
  return isSafeSitePath(value) || isHttpsUrl(value);
}

const EMBED_HOSTS = new Set([
  "youtube.com",
  "youtu.be",
  "youtube-nocookie.com",
  "vimeo.com",
  "player.vimeo.com",
]);

export function isEmbedRef(value: string) {
  if (!isHttpsUrl(value)) {
    return false;
  }
  const host = new URL(value).hostname.replace(/^www\./, "").toLowerCase();
  return EMBED_HOSTS.has(host);
}

export function isLinkHref(value: string) {
  if (DISALLOWED_SCHEME.test(value)) {
    return false;
  }
  return isMailto(value) || isSafeSitePath(value) || isHttpsUrl(value);
}

export function uniqueStrings(values: string[]) {
  return new Set(values).size === values.length;
}
