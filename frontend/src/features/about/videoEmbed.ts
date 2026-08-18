const YOUTUBE_ID = /^[\w-]{11}$/;

function hostKey(hostname: string) {
  return hostname.replace(/^(www|m|music)\./i, "").toLowerCase();
}

export function youtubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    const host = hostKey(parsed.hostname);

    if (host === "youtu.be") {
      const id = parsed.pathname.split("/").filter(Boolean)[0] ?? "";
      return YOUTUBE_ID.test(id) ? id : null;
    }

    if (host === "youtube.com" || host === "youtube-nocookie.com") {
      const fromQuery = parsed.searchParams.get("v") ?? "";
      if (YOUTUBE_ID.test(fromQuery)) {
        return fromQuery;
      }
      const parts = parsed.pathname.split("/").filter(Boolean);
      const kind = parts[0];
      const id = parts[1] ?? "";
      if (
        (kind === "embed" || kind === "shorts" || kind === "live" || kind === "v") &&
        YOUTUBE_ID.test(id)
      ) {
        return id;
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function toEmbedUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }

  const youtube = youtubeVideoId(trimmed);
  if (youtube) {
    return `https://www.youtube.com/embed/${youtube}`;
  }

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();
    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const parts = parsed.pathname.split("/").filter(Boolean);
      const id = parts[0] === "video" ? parts[1] : parts[0];
      if (id && /^\d+$/.test(id)) {
        return `https://player.vimeo.com/video/${id}`;
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function youtubePosterUrl(embedUrl: string): string | null {
  const id = youtubeVideoId(embedUrl);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}

export const EMBED_IFRAME_ALLOW =
  "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen";

export function withAutoplay(embedUrl: string): string {
  try {
    const url = new URL(embedUrl);
    url.searchParams.set("autoplay", "1");
    url.searchParams.set("rel", "0");
    url.searchParams.set("playsinline", "1");
    return url.toString();
  } catch {
    return embedUrl;
  }
}
