import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { env } from "@common/config/env";

export type MediaKind = "image" | "video";

const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const VIDEO_TYPES: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
};

const EXT_CONTENT_TYPE: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  mp4: "video/mp4",
  webm: "video/webm",
};

export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const VIDEO_MAX_BYTES = 40 * 1024 * 1024;

const SAFE_FILENAME =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpe?g|png|webp|gif|mp4|webm)$/i;

export function getUploadDir() {
  return process.env.UPLOAD_DIR?.trim() || path.resolve(process.cwd(), "uploads");
}

export function ensureUploadDir() {
  fs.mkdirSync(getUploadDir(), { recursive: true });
}

export function parseKind(value: unknown): MediaKind | null {
  if (value === "image" || value === "video") {
    return value;
  }
  return null;
}

export function maxBytesFor(kind: MediaKind) {
  return kind === "video" ? VIDEO_MAX_BYTES : IMAGE_MAX_BYTES;
}

export function extensionFor(kind: MediaKind, mime: string) {
  const table = kind === "video" ? VIDEO_TYPES : IMAGE_TYPES;
  return table[mime] ?? null;
}

export function allowedMimeMessage(kind: MediaKind) {
  return kind === "video"
    ? "Use an MP4 or WebM video"
    : "Use a JPEG, PNG, WebP, or GIF image";
}

export function newStoredName(kind: MediaKind, mime: string) {
  const ext = extensionFor(kind, mime);
  if (!ext) {
    return null;
  }
  return `${randomUUID()}.${ext}`;
}

export function isSafeFilename(filename: string) {
  return SAFE_FILENAME.test(filename);
}

export function contentTypeFor(filename: string) {
  const ext = path.extname(filename).slice(1).toLowerCase();
  return EXT_CONTENT_TYPE[ext] ?? "application/octet-stream";
}

export function publicFileUrl(filename: string) {
  return `${env.API_PREFIX}/media/files/${filename}`;
}

export function storedFilePath(filename: string) {
  const root = path.resolve(getUploadDir());
  const filePath = path.resolve(root, filename);
  if (!filePath.startsWith(`${root}${path.sep}`)) {
    return null;
  }
  return filePath;
}
