import type { MediaUsage } from "@modules/media/media.types";
import type { VideoProvider } from "./videos.parse";

export type { VideoProvider, MediaUsage };

export type VideoOrigin = "upload" | "hosted";

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
  usedIn: MediaUsage[];
  createdAt: string;
  updatedAt: string;
};

export const videoProviderLabels: Record<VideoProvider, string> = {
  file: "Uploaded",
  youtube: "YouTube",
  vimeo: "Vimeo",
  url: "CDN",
};
