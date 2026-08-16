const YOUTUBE =
  /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/i;
const YOUTUBE_EMBED = /youtube\.com\/embed\/([\w-]{11})/i;
const VIMEO = /vimeo\.com\/(?:video\/)?(\d+)/i;

export function toEmbedUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }

  const youtube = trimmed.match(YOUTUBE);
  if (youtube?.[1]) {
    return `https://www.youtube.com/embed/${youtube[1]}`;
  }

  const vimeo = trimmed.match(VIMEO);
  if (vimeo?.[1]) {
    return `https://player.vimeo.com/video/${vimeo[1]}`;
  }

  return null;
}

export function youtubePosterUrl(embedUrl: string): string | null {
  const id = embedUrl.match(YOUTUBE_EMBED)?.[1];
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}

export function withAutoplay(embedUrl: string): string {
  try {
    const url = new URL(embedUrl);
    url.searchParams.set("autoplay", "1");
    url.searchParams.set("rel", "0");
    url.searchParams.set("modestbranding", "1");
    return url.toString();
  } catch {
    return embedUrl;
  }
}
