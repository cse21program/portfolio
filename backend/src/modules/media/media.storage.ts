import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { env } from "@common/config/env";

export type MediaKind = "image" | "video" | "document";

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

const DOCUMENT_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
};

const EXT_CONTENT_TYPE: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  mp4: "video/mp4",
  webm: "video/webm",
  pdf: "application/pdf",
};

export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const VIDEO_MAX_BYTES = 40 * 1024 * 1024;
export const DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;

const SAFE_FILENAME =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpe?g|png|webp|gif|mp4|webm|pdf)$/i;

export function usesS3() {
  return Boolean(env.S3_UPLOADS_BUCKET);
}

export function s3ObjectKey(filename: string) {
  return `media/${filename}`;
}

export function getUploadDir() {
  return process.env.UPLOAD_DIR?.trim() || path.resolve(process.cwd(), "uploads");
}

export function ensureUploadDir() {
  fs.mkdirSync(getUploadDir(), { recursive: true });
}

export function parseKind(value: unknown): MediaKind | null {
  if (value === "image" || value === "video" || value === "document") {
    return value;
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

function isPdfUpload(mime: string, originalName = "") {
  if (DOCUMENT_TYPES[mime]) {
    return true;
  }
  if (!originalName.toLowerCase().endsWith(".pdf")) {
    return false;
  }
  return (
    mime === "" ||
    mime === "application/octet-stream" ||
    mime === "application/x-pdf" ||
    mime === "binary/octet-stream" ||
    mime === "application/acrobat"
  );
}

export function extensionFor(kind: MediaKind, mime: string, originalName = "") {
  if (kind === "video") {
    return VIDEO_TYPES[mime] ?? null;
  }
  if (kind === "document") {
    return isPdfUpload(mime, originalName) ? "pdf" : null;
  }
  return IMAGE_TYPES[mime] ?? null;
}

export function allowedMimeMessage(kind: MediaKind) {
  if (kind === "video") {
    return "Use an MP4 or WebM video";
  }
  if (kind === "document") {
    return "Use a PDF file";
  }
  return "Use a JPEG, PNG, WebP, or GIF image";
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

export function newStoredName(kind: MediaKind, mime: string, originalName = "") {
  const ext = extensionFor(kind, mime, originalName);
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

export function sanitizeDownloadName(value: unknown, fallback = "resume.pdf") {
  if (typeof value !== "string") {
    return fallback;
  }
  const trimmed = value.replace(/[/\\]/g, "").replace(/["\r\n]/g, "").trim();
  if (!trimmed || trimmed.length > 180) {
    return fallback;
  }
  const ascii = trimmed.replace(/[^\w.\- ()]+/g, "_");
  if (!ascii) {
    return fallback;
  }
  return ascii.toLowerCase().endsWith(".pdf") ? ascii : `${ascii}.pdf`;
}
