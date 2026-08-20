import { AppError, ErrorCode } from "@common/errors/AppError";
import { mediaRepository } from "@modules/media/media.repository";
import { mediaService } from "@modules/media/media.service";
import { collectMediaUsage, throwIfInUse } from "@modules/media/media.usage";
import type { MediaUsage } from "@modules/media/media.types";
import { hostedSourcesFromUsage } from "./videos.discover";
import { parseVideoSource, vimeoVideoId, youtubeVideoId } from "./videos.parse";
import { videoRepository } from "./videos.repository";
import type { ManagedVideo } from "./videos.types";
import type { CreateVideoInput, UpdateVideoInput } from "./videos.validation";

function usagesAt(urls: Map<string, MediaUsage[]>, key: string) {
  const exact = urls.get(key) ?? urls.get(key.toLowerCase());
  if (exact) {
    return exact;
  }
  const needle = key.toLowerCase();
  for (const [current, value] of urls) {
    if (current.toLowerCase() === needle) {
      return value;
    }
  }
  return [];
}

function mergeUsage(...groups: MediaUsage[][]): MediaUsage[] {
  const next: MediaUsage[] = [];
  for (const group of groups) {
    for (const item of group) {
      if (!next.some((current) => current.href === item.href && current.label === item.label)) {
        next.push(item);
      }
    }
  }
  return next;
}

function usagesFor(
  keys: Array<string | null | undefined>,
  files: Map<string, MediaUsage[]>,
  urls: Map<string, MediaUsage[]>,
) {
  return mergeUsage(
    ...keys.flatMap((key) => {
      if (!key) {
        return [];
      }
      const found = [usagesAt(urls, key), files.get(key) ?? []];
      const youtube = youtubeVideoId(key);
      if (youtube) {
        found.push(urls.get(`youtube:${youtube}`) ?? []);
      }
      const vimeo = vimeoVideoId(key);
      if (vimeo) {
        found.push(urls.get(`vimeo:${vimeo}`) ?? []);
      }
      return found;
    }),
  );
}

function fromHosted(
  row: {
    id: string;
    title: string;
    provider: string;
    url: string;
    embedUrl: string | null;
    posterUrl: string | null;
    caption: string;
    createdAt: Date;
    updatedAt: Date;
  },
  usedIn: MediaUsage[],
): ManagedVideo {
  return {
    id: row.id,
    origin: "hosted",
    provider: row.provider === "vimeo" || row.provider === "url" ? row.provider : "youtube",
    title: row.title,
    url: row.url,
    playUrl: row.embedUrl ? null : row.url,
    embedUrl: row.embedUrl,
    posterUrl: row.posterUrl,
    caption: row.caption,
    sizeBytes: 0,
    usedIn,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export const videosService = {
  async list(): Promise<{ videos: ManagedVideo[] }> {
    const [initialHosted, media, usage] = await Promise.all([
      videoRepository.list(),
      mediaRepository.list(),
      collectMediaUsage(),
    ]);

    const existingUrls = new Set(initialHosted.map((row) => row.url));
    const discovered = hostedSourcesFromUsage(usage.urls).filter((item) => !existingUrls.has(item.source.url));
    if (discovered.length > 0) {
      await videoRepository.createMany(
        discovered.map(({ source, usedIn }) => ({
          ...source,
          title: (usedIn[0]?.label ?? source.title).slice(0, 180),
          caption: "",
        })),
      );
    }

    const hosted = discovered.length > 0 ? await videoRepository.list() : initialHosted;

    const uploaded = media
      .filter((item) => item.kind === "video")
      .map(
        (item): ManagedVideo => ({
          id: item.id,
          origin: "upload",
          provider: "file",
          title: item.originalName,
          url: item.url,
          playUrl: item.url,
          embedUrl: null,
          posterUrl: null,
          caption: item.caption,
          sizeBytes: item.sizeBytes,
          usedIn: usage.files.get(item.filename) ?? [],
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        }),
      );

    const catalog = hosted.map((row) =>
      fromHosted(row, usagesFor([row.url, row.embedUrl], usage.files, usage.urls)),
    );

    const videos = [...catalog, ...uploaded].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return { videos };
  },

  async create(input: CreateVideoInput): Promise<ManagedVideo> {
    const parsed = parseVideoSource(input.url);
    if (!parsed) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        "Use a YouTube, Vimeo, or direct MP4/WebM URL. Uploaded files belong in the media library.",
        400,
      );
    }

    const existing = await videoRepository.findByUrl(parsed.url);
    if (existing) {
      throw new AppError(ErrorCode.CONFLICT, "That video is already in the library", 409);
    }

    const row = await videoRepository.create({
      ...parsed,
      title: input.title?.trim() || parsed.title,
      caption: input.caption?.trim() ?? "",
    });
    return fromHosted(row, []);
  },

  async update(id: string, input: UpdateVideoInput): Promise<ManagedVideo> {
    const hosted = await videoRepository.findById(id);
    if (hosted) {
      const row = await videoRepository.update(id, input);
      const usage = await collectMediaUsage();
      return fromHosted(row, usagesFor([row.url, row.embedUrl], usage.files, usage.urls));
    }

    const media = await mediaRepository.findById(id);
    if (!media || media.kind !== "video") {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Video not found", 404);
    }

    const asset = await mediaService.update(id, {
      ...(input.title !== undefined ? { originalName: input.title } : {}),
      ...(input.caption !== undefined ? { caption: input.caption } : {}),
    });
    const usage = await collectMediaUsage();
    return {
      id: asset.id,
      origin: "upload",
      provider: "file",
      title: asset.originalName,
      url: asset.url,
      playUrl: asset.url,
      embedUrl: null,
      posterUrl: null,
      caption: asset.caption,
      sizeBytes: asset.sizeBytes,
      usedIn: usage.files.get(asset.filename) ?? [],
      createdAt: asset.createdAt,
      updatedAt: asset.updatedAt,
    };
  },

  async remove(id: string) {
    const hosted = await videoRepository.findById(id);
    if (hosted) {
      const usage = await collectMediaUsage();
      throwIfInUse(usagesFor([hosted.url, hosted.embedUrl], usage.files, usage.urls), "video");
      await videoRepository.remove(id);
      return;
    }

    const media = await mediaRepository.findById(id);
    if (!media || media.kind !== "video") {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Video not found", 404);
    }
    await mediaService.remove(id);
  },
};
