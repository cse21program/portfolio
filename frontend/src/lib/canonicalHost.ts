export function wwwLocation(href: string) {
  const url = new URL(href);
  if (url.protocol !== "https:") {
    return null;
  }

  const host = url.hostname;
  if (
    host.startsWith("www.") ||
    !host.includes(".") ||
    host.endsWith("localhost") ||
    host.endsWith("cloudfront.net") ||
    host.endsWith("amazonaws.com")
  ) {
    return null;
  }

  url.hostname = `www.${host}`;
  return url.toString();
}

export function redirectApexToWww() {
  const next = wwwLocation(window.location.href);
  if (!next) {
    return false;
  }
  window.location.replace(next);
  return true;
}
