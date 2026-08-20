import { prisma } from "@common/database/prisma";
import { AppError, ErrorCode } from "@common/errors/AppError";
import type { ParsedVideoSource } from "./videos.parse";

export const videoRepository = {
  list() {
    return prisma.videoAsset.findMany({ orderBy: { createdAt: "desc" } });
  },

  findById(id: string) {
    return prisma.videoAsset.findUnique({ where: { id } });
  },

  findByUrl(url: string) {
    return prisma.videoAsset.findUnique({ where: { url } });
  },

  create(input: ParsedVideoSource & { title: string; caption: string }) {
    return prisma.videoAsset.create({
      data: {
        title: input.title,
        provider: input.provider,
        url: input.url,
        embedUrl: input.embedUrl,
        posterUrl: input.posterUrl,
        caption: input.caption,
      },
    });
  },

  createMany(rows: Array<ParsedVideoSource & { title: string; caption: string }>) {
    if (rows.length === 0) {
      return Promise.resolve();
    }
    return prisma.videoAsset.createMany({
      data: rows.map((input) => ({
        title: input.title,
        provider: input.provider,
        url: input.url,
        embedUrl: input.embedUrl,
        posterUrl: input.posterUrl,
        caption: input.caption,
      })),
      skipDuplicates: true,
    });
  },

  async update(id: string, input: { title?: string; caption?: string }) {
    try {
      return await prisma.videoAsset.update({
        where: { id },
        data: {
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.caption !== undefined ? { caption: input.caption } : {}),
        },
      });
    } catch (error) {
      const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
      if (code === "P2025") {
        throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Video not found", 404);
      }
      throw error;
    }
  },

  async remove(id: string) {
    try {
      return await prisma.videoAsset.delete({ where: { id } });
    } catch (error) {
      const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
      if (code === "P2025") {
        throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Video not found", 404);
      }
      throw error;
    }
  },
};
