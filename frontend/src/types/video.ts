export const videoProviders = ["file", "youtube", "vimeo", "url"] as const;
export type VideoProvider = (typeof videoProviders)[number];
export type VideoOrigin = "upload" | "hosted";

export const videoProviderLabels: Record<VideoProvider, string> = {
  file: "Uploaded",
  youtube: "YouTube",
  vimeo: "Vimeo",
  url: "CDN",
};

export type VideoUsage = {
  label: string;
  href: string;
};

export type ManagedVideo = {
  id: string;
  origin: VideoOrigin;
  provider: VideoProvider;
  title: string;
  url: string;
  playUrl: string | null;
  embedUrl: string | null;
  posterUrl: string | null;
  caption: string;
  sizeBytes: number;
  usedIn: VideoUsage[];
  createdAt: string;
  updatedAt: string;
};

export type VideoSort = "newest" | "oldest" | "name";

export function sortVideos(videos: ManagedVideo[], sort: VideoSort) {
  const next = [...videos];
  next.sort((a, b) => {
    if (sort === "oldest") {
      return a.createdAt.localeCompare(b.createdAt);
    }
    if (sort === "name") {
      return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
    }
    return b.createdAt.localeCompare(a.createdAt);
  });
  return next;
}
