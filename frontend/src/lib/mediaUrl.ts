import { env } from "@/config/env";

export function mediaHref(url: string | null | undefined) {
  if (!url) {
    return "";
  }
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  if (env.apiUrl.startsWith("http")) {
    return `${env.apiUrl.replace(/\/api\/v1\/?$/, "")}${url}`;
  }
  return url;
}
