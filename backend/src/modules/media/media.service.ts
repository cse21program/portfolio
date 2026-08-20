import { logger } from "@common/utils/logger";
import { AppError, ErrorCode } from "@common/errors/AppError";
import { removeStoredFile } from "./media.files";
import { mediaRepository } from "./media.repository";
import { contentTypeFor, sanitizeDisplayName, type MediaKind, publicFileUrl } from "./media.storage";
import { summarizeLibrary, withUsage, type MediaAssetRecord, type MediaLibrarySummary } from "./media.types";
import { collectMediaUsage, throwIfInUse } from "./media.usage";
import type { UpdateMediaInput } from "./media.validation";

export const mediaService = {
  async list(): Promise<{ assets: MediaAssetRecord[]; summary: MediaLibrarySummary }> {
    const [assets, usage] = await Promise.all([mediaRepository.list(), collectMediaUsage()]);
    const withRefs = assets.map((asset) => withUsage(asset, usage.files.get(asset.filename) ?? []));
    return { assets: withRefs, summary: summarizeLibrary(withRefs) };
  },

  async update(id: string, input: UpdateMediaInput) {
    if (input.originalName === undefined) {
      return mediaRepository.update(id, input);
    }

    const current = await mediaRepository.findById(id);
    if (!current) {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "File not found", 404);
    }

    return mediaRepository.update(id, {
      ...input,
      originalName: sanitizeDisplayName(input.originalName, current.filename),
    });
  },

  async remove(id: string) {
    const current = await mediaRepository.findById(id);
    if (!current) {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "File not found", 404);
    }

    const usage = await collectMediaUsage();
    throwIfInUse(usage.files.get(current.filename) ?? [], current.kind === "video" ? "video" : "file");

    const asset = await mediaRepository.remove(id);
    await removeStoredFile(asset.filename);
    return asset;
  },

  async recordUpload(file: Express.Multer.File, kind: MediaKind): Promise<MediaAssetRecord | null> {
    try {
      return await mediaRepository.create({
        filename: file.filename,
        originalName: sanitizeDisplayName(file.originalname || file.filename, file.filename),
        kind,
        contentType: contentTypeFor(file.filename),
        sizeBytes: file.size,
        url: publicFileUrl(file.filename),
      });
    } catch (error) {
      logger.error("media.library.record_failed", {
        filename: file.filename,
        message: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  },
};
