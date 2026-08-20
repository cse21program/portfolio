import { prisma } from "@common/database/prisma";
import { AppError, ErrorCode } from "@common/errors/AppError";
import type { MediaKind } from "./media.storage";
import { toMediaAssetRecord, type MediaAssetRecord } from "./media.types";

export const mediaRepository = {
  async list(): Promise<MediaAssetRecord[]> {
    const rows = await prisma.mediaAsset.findMany({
      orderBy: { createdAt: "desc" },
    });
    return rows.map((row) => toMediaAssetRecord(row));
  },

  async findById(id: string): Promise<MediaAssetRecord | null> {
    const row = await prisma.mediaAsset.findUnique({ where: { id } });
    return row ? toMediaAssetRecord(row) : null;
  },

  async create(input: {
    filename: string;
    originalName: string;
    kind: MediaKind;
    contentType: string;
    sizeBytes: number;
    url: string;
  }): Promise<MediaAssetRecord> {
    const row = await prisma.mediaAsset.create({
      data: {
        filename: input.filename,
        originalName: input.originalName,
        kind: input.kind,
        contentType: input.contentType,
        sizeBytes: input.sizeBytes,
        url: input.url,
      },
    });
    return toMediaAssetRecord(row);
  },

  async update(id: string, input: { originalName?: string; alt?: string; caption?: string }): Promise<MediaAssetRecord> {
    try {
      const row = await prisma.mediaAsset.update({
        where: { id },
        data: {
          ...(input.originalName !== undefined ? { originalName: input.originalName } : {}),
          ...(input.alt !== undefined ? { alt: input.alt } : {}),
          ...(input.caption !== undefined ? { caption: input.caption } : {}),
        },
      });
      return toMediaAssetRecord(row);
    } catch (error) {
      const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
      if (code === "P2025") {
        throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "File not found", 404);
      }
      throw error;
    }
  },

  async remove(id: string): Promise<MediaAssetRecord> {
    try {
      const row = await prisma.mediaAsset.delete({ where: { id } });
      return toMediaAssetRecord(row);
    } catch (error) {
      const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
      if (code === "P2025") {
        throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "File not found", 404);
      }
      throw error;
    }
  },
};
