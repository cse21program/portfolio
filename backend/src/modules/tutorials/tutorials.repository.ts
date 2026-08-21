import { prisma } from "@common/database/prisma";
import { AppError, ErrorCode } from "@common/errors/AppError";
import {
  defaultTutorials,
  emptyToNull,
  isPublishedTutorial,
  parseTutorialSections,
  relatedTutorials,
  type TutorialRecord,
  type TutorialSection,
} from "./tutorials.types";
import type { TutorialItemInput, UpdateTutorialListInput } from "./tutorials.validation";

type TutorialRow = Omit<TutorialRecord, "updatedAt" | "sections"> & {
  updatedAt: Date;
  sections: unknown;
};

function toRecord(row: TutorialRow): TutorialRecord {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    difficulty: row.difficulty,
    prerequisites: row.prerequisites,
    duration: row.duration,
    thumbnailUrl: row.thumbnailUrl,
    skill: row.skill,
    relatedSkillSlugs: row.relatedSkillSlugs,
    relatedCourseSlugs: row.relatedCourseSlugs,
    price: row.free ? "Free" : row.price,
    free: row.free,
    sections: parseTutorialSections(row.sections),
    status: row.status,
    publishedAt: row.publishedAt,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    canonicalUrl: row.canonicalUrl,
    sortOrder: row.sortOrder,
    updatedAt: row.updatedAt.toISOString().slice(0, 10),
  };
}

function toCreateData(item: TutorialItemInput, index: number) {
  const sections = parseTutorialSections(item.sections);
  const free = item.free;
  return {
    ...(item.id ? { id: item.id } : {}),
    title: item.title,
    slug: item.slug,
    description: item.description,
    difficulty: item.difficulty,
    prerequisites: item.prerequisites,
    duration: item.duration,
    thumbnailUrl: emptyToNull(item.thumbnailUrl),
    skill: item.skill,
    relatedSkillSlugs: item.relatedSkillSlugs,
    relatedCourseSlugs: item.relatedCourseSlugs,
    price: free ? "Free" : item.price.trim() || "Premium",
    free,
    sections: sections as unknown as TutorialSection[],
    status: item.status,
    publishedAt: item.publishedAt,
    seoTitle: item.seoTitle,
    seoDescription: item.seoDescription,
    canonicalUrl: item.canonicalUrl,
    sortOrder: item.sortOrder ?? index,
  };
}

function seedInput(item: (typeof defaultTutorials)[number], index: number) {
  return toCreateData(
    {
      title: item.title,
      slug: item.slug,
      description: item.description,
      difficulty: item.difficulty as TutorialItemInput["difficulty"],
      prerequisites: item.prerequisites,
      duration: item.duration,
      thumbnailUrl: item.thumbnailUrl,
      skill: item.skill,
      relatedSkillSlugs: item.relatedSkillSlugs,
      relatedCourseSlugs: item.relatedCourseSlugs,
      price: item.price,
      free: item.free,
      sections: item.sections,
      status: item.status as TutorialItemInput["status"],
      publishedAt: item.publishedAt,
      seoTitle: item.seoTitle,
      seoDescription: item.seoDescription,
      canonicalUrl: item.canonicalUrl,
    },
    index,
  );
}

export const tutorialsRepository = {
  async list(): Promise<TutorialRecord[]> {
    const rows = await prisma.tutorial.findMany({
      orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
    });

    if (rows.length > 0) {
      return rows.map(toRecord);
    }

    try {
      await prisma.tutorial.createMany({
        data: defaultTutorials.map((item, index) => seedInput(item, index)),
        skipDuplicates: true,
      });
    } catch {
      // Another request may have seeded the same rows.
    }

    const seeded = await prisma.tutorial.findMany({
      orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
    });
    return seeded.map(toRecord);
  },

  async getBySlug(slug: string, options?: { includeUnpublished?: boolean }) {
    const tutorials = await tutorialsRepository.list();
    const tutorial = tutorials.find(
      (item) => item.slug === slug && (options?.includeUnpublished || isPublishedTutorial(item)),
    );
    if (!tutorial) {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Tutorial not found", 404);
    }
    return {
      tutorial,
      related: relatedTutorials(tutorial, tutorials),
    };
  },

  async replaceAll(input: UpdateTutorialListInput): Promise<TutorialRecord[]> {
    await prisma.$transaction(async (tx) => {
      await tx.tutorial.deleteMany();
      if (input.tutorials.length === 0) {
        return;
      }
      await tx.tutorial.createMany({
        data: input.tutorials.map((item, index) => toCreateData(item, index)),
      });
    });

    const rows = await prisma.tutorial.findMany({
      orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
    });
    return rows.map(toRecord);
  },
};
