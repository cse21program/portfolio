import type { MediaUsage } from "@modules/media/media.types";
import { parseVideoSource, vimeoVideoId, youtubeVideoId, type ParsedVideoSource } from "./videos.parse";

export type DiscoveredVideo = {
  source: ParsedVideoSource;
  usedIn: MediaUsage[];
};

function mergeUsage(current: MediaUsage[], extra: MediaUsage[]) {
  const next = [...current];
  for (const item of extra) {
    if (!next.some((entry) => entry.href === item.href && entry.label === item.label)) {
      next.push(item);
    }
  }
  return next;
}

function candidateFromKey(key: string) {
  if (key.startsWith("youtube:")) {
    return `https://www.youtube.com/watch?v=${key.slice("youtube:".length)}`;
  }
  if (key.startsWith("vimeo:")) {
    return `https://vimeo.com/${key.slice("vimeo:".length)}`;
  }
  if (youtubeVideoId(key) || vimeoVideoId(key)) {
    return null;
  }
  return key;
}

export function hostedSourcesFromUsage(urls: Map<string, MediaUsage[]>): DiscoveredVideo[] {
  const byUrl = new Map<string, DiscoveredVideo>();

  for (const [key, usedIn] of urls) {
    const candidate = candidateFromKey(key);
    if (!candidate) {
      continue;
    }
    const source = parseVideoSource(candidate);
    if (!source) {
      continue;
    }
    const current = byUrl.get(source.url);
    if (current) {
      current.usedIn = mergeUsage(current.usedIn, usedIn);
      continue;
    }
    byUrl.set(source.url, { source, usedIn: [...usedIn] });
  }

  return [...byUrl.values()];
}
