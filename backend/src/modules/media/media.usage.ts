import { prisma } from "@common/database/prisma";
import { AppError, ErrorCode } from "@common/errors/AppError";
import { vimeoVideoId, youtubeVideoId } from "@modules/videos/videos.parse";
import { isSafeFilename } from "./media.storage";
import type { MediaUsage } from "./media.types";

export type { MediaUsage };

export function throwIfInUse(usedIn: MediaUsage[], noun: "file" | "video") {
  if (usedIn.length === 0) {
    return;
  }
  const places = usedIn.map((item) => item.label).join(", ");
  throw new AppError(ErrorCode.CONFLICT, `This ${noun} is used on ${places}. Remove it there first.`, 409);
}

function mediaFilePattern() {
  return /\/media\/files\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:jpe?g|png|webp|gif|mp4|webm|pdf))/gi;
}

export function filenameFromMediaUrl(value: string | null | undefined) {
  if (!value) {
    return null;
  }
  const match = mediaFilePattern().exec(value);
  const filename = match?.[1] ?? null;
  if (!filename || !isSafeFilename(filename)) {
    return null;
  }
  return filename;
}

function walkStrings(value: unknown, visit: (text: string) => void) {
  if (typeof value === "string") {
    visit(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      walkStrings(item, visit);
    }
    return;
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value)) {
      walkStrings(item, visit);
    }
  }
}

function addUsage(map: Map<string, MediaUsage[]>, filename: string | null, usage: MediaUsage) {
  if (!filename) {
    return;
  }
  const current = map.get(filename) ?? [];
  if (current.some((item) => item.href === usage.href && item.label === usage.label)) {
    map.set(filename, current);
    return;
  }
  current.push(usage);
  map.set(filename, current);
}

function addFromValue(
  files: Map<string, MediaUsage[]>,
  urls: Map<string, MediaUsage[]>,
  value: unknown,
  usage: MediaUsage,
) {
  walkStrings(value, (text) => {
    for (const match of text.matchAll(mediaFilePattern())) {
      addUsage(files, match[1] ?? null, usage);
    }
    for (const match of text.matchAll(/https?:\/\/[^\s"'<>\\]+/gi)) {
      const raw = (match[0] ?? "").replace(/[.,;)]+$/g, "");
      addUsage(urls, raw, usage);
      const youtube = youtubeVideoId(raw);
      if (youtube) {
        addUsage(urls, `youtube:${youtube}`, usage);
      }
      const vimeo = vimeoVideoId(raw);
      if (vimeo) {
        addUsage(urls, `vimeo:${vimeo}`, usage);
      }
    }
  });
}

export async function collectMediaUsage(): Promise<{
  files: Map<string, MediaUsage[]>;
  urls: Map<string, MediaUsage[]>;
}> {
  const files = new Map<string, MediaUsage[]>();
  const urls = new Map<string, MediaUsage[]>();

  const [profile, resume, experiences, education, projects, fields, skills, topics, blogs, tutorials, courses, services] =
    await Promise.all([
      prisma.profile.findUnique({
        where: { id: "default" },
        select: {
          profilePhotoUrl: true,
          coverImageUrl: true,
          gallery: true,
          introVideoUrl: true,
          embedVideoUrl: true,
        },
      }),
      prisma.resume.findUnique({ where: { id: "default" }, select: { pdfUrl: true } }),
      prisma.experience.findMany({ select: { company: true, position: true, logoUrl: true } }),
      prisma.education.findMany({ select: { institution: true, logoUrl: true, documentUrl: true } }),
      prisma.project.findMany({ select: { title: true, slug: true, thumbnailUrl: true, images: true, demoVideoUrl: true } }),
      prisma.field.findMany({
        select: {
          name: true,
          slug: true,
          iconUrl: true,
          thumbnailUrl: true,
          bannerUrl: true,
          videoUrl: true,
          embedVideoUrl: true,
        },
      }),
      prisma.skill.findMany({
        select: { name: true, slug: true, iconUrl: true, imageUrl: true, videoUrl: true, embedVideoUrl: true },
      }),
      prisma.topic.findMany({
        select: { title: true, slug: true, images: true, videoUrl: true, embedVideoUrl: true, resources: true },
      }),
      prisma.blog.findMany({ select: { title: true, slug: true, featuredImageUrl: true, content: true } }),
      prisma.tutorial.findMany({ select: { title: true, slug: true, thumbnailUrl: true, sections: true } }),
      prisma.course.findMany({ select: { title: true, slug: true, thumbnailUrl: true, promoVideoUrl: true, modules: true } }),
      prisma.service.findMany({ select: { title: true, slug: true, thumbnailUrl: true } }),
    ]);

  addFromValue(files, urls, profile, { label: "About", href: "/admin/portfolio" });
  addFromValue(files, urls, resume, { label: "Resume PDF", href: "/admin/resume" });

  for (const item of experiences) {
    addFromValue(files, urls, item.logoUrl, { label: `${item.position}, ${item.company}`, href: "/admin/experience" });
  }
  for (const item of education) {
    addFromValue(files, urls, [item.logoUrl, item.documentUrl], { label: item.institution, href: "/admin/education" });
  }
  for (const item of projects) {
    addFromValue(files, urls, [item.thumbnailUrl, item.images, item.demoVideoUrl], {
      label: item.title,
      href: "/admin/projects",
    });
  }
  for (const item of fields) {
    addFromValue(files, urls, item, { label: item.name, href: "/admin/fields" });
  }
  for (const item of skills) {
    addFromValue(files, urls, item, { label: item.name, href: "/admin/skills" });
  }
  for (const item of topics) {
    addFromValue(files, urls, [item.images, item.videoUrl, item.embedVideoUrl, item.resources], {
      label: item.title,
      href: "/admin/topics",
    });
  }
  for (const item of blogs) {
    addFromValue(files, urls, [item.featuredImageUrl, item.content], { label: item.title, href: "/admin/blogs" });
  }
  for (const item of tutorials) {
    addFromValue(files, urls, [item.thumbnailUrl, item.sections], { label: item.title, href: "/admin/tutorials" });
  }
  for (const item of courses) {
    addFromValue(files, urls, [item.thumbnailUrl, item.promoVideoUrl, item.modules], {
      label: item.title,
      href: "/admin/courses",
    });
  }
  for (const item of services) {
    addFromValue(files, urls, item.thumbnailUrl, { label: item.title, href: "/admin/services" });
  }

  return { files, urls };
}
