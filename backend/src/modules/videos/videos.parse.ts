const YOUTUBE_ID = /^[\w-]{11}$/;

export type VideoProvider = "file" | "youtube" | "vimeo" | "url";

export type ParsedVideoSource = {
  provider: Exclude<VideoProvider, "file">;
  url: string;
  embedUrl: string | null;
  posterUrl: string | null;
  title: string;
};

function hostKey(hostname: string) {
  return hostname.replace(/^(www|m|music)\./i, "").toLowerCase();
}

export function youtubeVideoId(value: string): string | null {
  try {
    const parsed = new URL(value.trim());
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
      if ((kind === "embed" || kind === "shorts" || kind === "live" || kind === "v") && YOUTUBE_ID.test(id)) {
        return id;
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function vimeoVideoId(value: string): string | null {
  try {
    const parsed = new URL(value.trim());
    const host = hostKey(parsed.hostname);
    if (host !== "vimeo.com" && host !== "player.vimeo.com") {
      return null;
    }
    const parts = parsed.pathname.split("/").filter(Boolean);
    const id = parts[0] === "video" ? parts[1] : parts[0];
    return id && /^\d+$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

export function isDirectVideoUrl(value: string): boolean {
  try {
    const parsed = new URL(value.trim());
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }
    return /\.(mp4|webm)(?:$|\?)/i.test(parsed.pathname);
  } catch {
    return false;
  }
}

export function isLibraryVideoUrl(value: string): boolean {
  return /\/media\/files\/[0-9a-f-]{36}\.(mp4|webm)(?:$|\?)/i.test(value.trim());
}

export function parseVideoSource(value: string): ParsedVideoSource | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const youtube = youtubeVideoId(trimmed);
  if (youtube) {
    return {
      provider: "youtube",
      url: `https://www.youtube.com/watch?v=${youtube}`,
      embedUrl: `https://www.youtube.com/embed/${youtube}`,
      posterUrl: `https://i.ytimg.com/vi/${youtube}/hqdefault.jpg`,
      title: "YouTube video",
    };
  }

  const vimeo = vimeoVideoId(trimmed);
  if (vimeo) {
    return {
      provider: "vimeo",
      url: `https://vimeo.com/${vimeo}`,
      embedUrl: `https://player.vimeo.com/video/${vimeo}`,
      posterUrl: null,
      title: "Vimeo video",
    };
  }

  if (isLibraryVideoUrl(trimmed)) {
    return null;
  }

  if (!isDirectVideoUrl(trimmed)) {
    return null;
  }

  const parsed = new URL(trimmed);
  const filename = decodeURIComponent(parsed.pathname.split("/").filter(Boolean).at(-1) ?? "video.mp4");
  return {
    provider: "url",
    url: parsed.toString(),
    embedUrl: null,
    posterUrl: null,
    title: filename.slice(0, 180) || "Hosted video",
  };
}
