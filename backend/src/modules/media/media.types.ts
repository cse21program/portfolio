import type { MediaKind } from "./media.storage";

export const mediaKinds = ["image", "video", "document"] as const;
export type { MediaKind };

export const mediaKindLabels: Record<MediaKind, string> = {
  image: "Image",
  video: "Video",
  document: "Document",
};

export type MediaUsage = {
  label: string;
  href: string;
};

export type MediaAssetRecord = {
  id: string;
  filename: string;
  originalName: string;
  kind: MediaKind;
  contentType: string;
  sizeBytes: number;
  url: string;
  alt: string;
  caption: string;
  createdAt: string;
  updatedAt: string;
  usedIn: MediaUsage[];
};

export type MediaLibrarySummary = {
  totalBytes: number;
  image: number;
  video: number;
  document: number;
};

export function asMediaKind(value: string): MediaKind {
  if (value === "video" || value === "document") {
    return value;
  }
  return "image";
}

export function summarizeLibrary(assets: Array<{ kind: MediaKind; sizeBytes: number }>): MediaLibrarySummary {
  return {
    totalBytes: assets.reduce((sum, item) => sum + item.sizeBytes, 0),
    image: assets.filter((item) => item.kind === "image").length,
    video: assets.filter((item) => item.kind === "video").length,
    document: assets.filter((item) => item.kind === "document").length,
  };
}

export function withUsage(asset: MediaAssetRecord, usedIn: MediaUsage[] = []): MediaAssetRecord {
  return { ...asset, usedIn };
}

export function toMediaAssetRecord(
  row: {
    id: string;
    filename: string;
    originalName: string;
    kind: string;
    contentType: string;
    sizeBytes: number;
    url: string;
    alt: string;
    caption: string;
    createdAt: Date;
    updatedAt: Date;
  },
  usedIn: MediaUsage[] = [],
): MediaAssetRecord {
  return {
    id: row.id,
    filename: row.filename,
    originalName: row.originalName,
    kind: asMediaKind(row.kind),
    contentType: row.contentType,
    sizeBytes: row.sizeBytes,
    url: row.url,
    alt: row.alt,
    caption: row.caption,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    usedIn,
  };
}
