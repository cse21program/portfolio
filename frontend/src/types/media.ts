export const mediaKinds = ["image", "video", "document"] as const;
export type MediaKind = (typeof mediaKinds)[number];

export const mediaKindLabels: Record<MediaKind, string> = {
  image: "Image",
  video: "Video",
  document: "Document",
};

export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const VIDEO_MAX_BYTES = 40 * 1024 * 1024;
export const DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;

export type MediaUsage = {
  label: string;
  href: string;
};

export type MediaAsset = {
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

export type MediaSort = "newest" | "oldest" | "largest" | "name";

export function kindForFile(file: File): MediaKind | null {
  const name = file.name.toLowerCase();
  const type = file.type;
  if (type.startsWith("image/") || /\.(jpe?g|png|webp|gif)$/.test(name)) {
    return "image";
  }
  if (type.startsWith("video/") || /\.(mp4|webm)$/.test(name)) {
    return "video";
  }
  if (type === "application/pdf" || name.endsWith(".pdf")) {
    return "document";
  }
  return null;
}

export function maxBytesFor(kind: MediaKind) {
  if (kind === "video") {
    return VIDEO_MAX_BYTES;
  }
  if (kind === "document") {
    return DOCUMENT_MAX_BYTES;
  }
  return IMAGE_MAX_BYTES;
}

export function sizeLimitMessage(kind: MediaKind) {
  if (kind === "video") {
    return "Video must be 40 MB or smaller";
  }
  if (kind === "document") {
    return "PDF must be 10 MB or smaller";
  }
  return "Image must be 5 MB or smaller";
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatMediaDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function summarizeLibrary(assets: Array<{ kind: MediaKind; sizeBytes: number }>): MediaLibrarySummary {
  return {
    totalBytes: assets.reduce((sum, item) => sum + item.sizeBytes, 0),
    image: assets.filter((item) => item.kind === "image").length,
    video: assets.filter((item) => item.kind === "video").length,
    document: assets.filter((item) => item.kind === "document").length,
  };
}

export function sortMedia(assets: MediaAsset[], sort: MediaSort) {
  const next = [...assets];
  next.sort((a, b) => {
    if (sort === "oldest") {
      return a.createdAt.localeCompare(b.createdAt);
    }
    if (sort === "largest") {
      return b.sizeBytes - a.sizeBytes;
    }
    if (sort === "name") {
      return a.originalName.localeCompare(b.originalName, undefined, { sensitivity: "base" });
    }
    return b.createdAt.localeCompare(a.createdAt);
  });
  return next;
}

export function mediaDownloadUrl(url: string, originalName: string) {
  const params = new URLSearchParams({ download: "1", name: originalName });
  return `${url}${url.includes("?") ? "&" : "?"}${params.toString()}`;
}

export function storedExtension(filename: string) {
  const index = filename.lastIndexOf(".");
  return index >= 0 ? filename.slice(index) : "";
}

export function displayNameFor(name: string, storedFilename: string) {
  const cleaned = name.replace(/[/\\]/g, "").replace(/["\r\n]/g, "").trim().slice(0, 180);
  if (!cleaned) {
    return "";
  }
  const ext = storedExtension(storedFilename);
  if (!ext || cleaned.toLowerCase().endsWith(ext.toLowerCase())) {
    return cleaned;
  }
  const currentExt = storedExtension(cleaned);
  const stem = currentExt ? cleaned.slice(0, -currentExt.length) : cleaned;
  return `${stem || "file"}${ext}`.slice(0, 180);
}
