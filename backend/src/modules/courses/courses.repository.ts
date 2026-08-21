import { prisma } from "@common/database/prisma";
import { AppError, ErrorCode } from "@common/errors/AppError";
import {
  defaultCourses,
  emptyToNull,
  isPublishedCourse,
  parseCourseModules,
  relatedCourses,
  type CourseModule,
  type CourseRecord,
} from "./courses.types";
import type { CourseItemInput, UpdateCourseListInput } from "./courses.validation";

type CourseRow = Omit<CourseRecord, "updatedAt" | "modules"> & {
  updatedAt: Date;
  modules: unknown;
};

function toRecord(row: CourseRow): CourseRecord {
  const free = row.free;
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    subtitle: row.subtitle,
    description: row.description,
    overview: row.overview,
    thumbnailUrl: row.thumbnailUrl,
    promoVideoUrl: row.promoVideoUrl,
    instructor: row.instructor,
    category: row.category,
    skill: row.skill,
    difficulty: row.difficulty,
    language: row.language,
    duration: row.duration,
    requirements: row.requirements,
    outcomes: row.outcomes,
    audience: row.audience,
    price: free ? "Free" : row.price,
    salePrice: free ? "" : row.salePrice,
    currency: row.currency,
    free,
    featured: row.featured,
    certificateAvailable: row.certificateAvailable,
    relatedSkillSlugs: row.relatedSkillSlugs,
    relatedTutorialSlugs: row.relatedTutorialSlugs,
    relatedCourseSlugs: row.relatedCourseSlugs,
    modules: parseCourseModules(row.modules),
    status: row.status,
    publishedAt: row.publishedAt,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    canonicalUrl: row.canonicalUrl,
    sortOrder: row.sortOrder,
    updatedAt: row.updatedAt.toISOString().slice(0, 10),
  };
}

function toCreateData(item: CourseItemInput, index: number) {
  const modules = parseCourseModules(item.modules);
  const free = item.free;
  return {
    ...(item.id ? { id: item.id } : {}),
    title: item.title,
    slug: item.slug,
    subtitle: item.subtitle,
    description: item.description,
    overview: item.overview,
    thumbnailUrl: emptyToNull(item.thumbnailUrl),
    promoVideoUrl: emptyToNull(item.promoVideoUrl),
    instructor: item.instructor.trim() || "Rezaul Karim",
    category: item.category,
    skill: item.skill,
    difficulty: item.difficulty,
    language: item.language.trim() || "English",
    duration: item.duration,
    requirements: item.requirements,
    outcomes: item.outcomes,
    audience: item.audience,
    price: free ? "Free" : item.price.trim() || "Premium",
    salePrice: free ? "" : item.salePrice.trim(),
    currency: item.currency.trim() || "USD",
    free,
    featured: item.featured,
    certificateAvailable: item.certificateAvailable,
    relatedSkillSlugs: item.relatedSkillSlugs,
    relatedTutorialSlugs: item.relatedTutorialSlugs,
    relatedCourseSlugs: item.relatedCourseSlugs,
    modules: modules as unknown as CourseModule[],
    status: item.status,
    publishedAt: item.publishedAt,
    seoTitle: item.seoTitle,
    seoDescription: item.seoDescription,
    canonicalUrl: item.canonicalUrl,
    sortOrder: item.sortOrder ?? index,
  };
}

function seedInput(item: (typeof defaultCourses)[number], index: number) {
  return toCreateData(
    {
      id: item.id,
      title: item.title,
      slug: item.slug,
      subtitle: item.subtitle,
      description: item.description,
      overview: item.overview,
      thumbnailUrl: item.thumbnailUrl,
      promoVideoUrl: item.promoVideoUrl,
      instructor: item.instructor,
      category: item.category,
      skill: item.skill,
      difficulty: item.difficulty as CourseItemInput["difficulty"],
      language: item.language,
      duration: item.duration,
      requirements: item.requirements,
      outcomes: item.outcomes,
      audience: item.audience,
      price: item.price,
      salePrice: item.salePrice,
      currency: item.currency,
      free: item.free,
      featured: item.featured,
      certificateAvailable: item.certificateAvailable,
      relatedSkillSlugs: item.relatedSkillSlugs,
      relatedTutorialSlugs: item.relatedTutorialSlugs,
      relatedCourseSlugs: item.relatedCourseSlugs,
      modules: item.modules,
      status: item.status as CourseItemInput["status"],
      publishedAt: item.publishedAt,
      seoTitle: item.seoTitle,
      seoDescription: item.seoDescription,
      canonicalUrl: item.canonicalUrl,
    },
    index,
  );
}

export const coursesRepository = {
  async list(): Promise<CourseRecord[]> {
    const rows = await prisma.course.findMany({
      orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
    });

    if (rows.length > 0) {
      return rows.map(toRecord);
    }

    try {
      await prisma.course.createMany({
        data: defaultCourses.map((item, index) => seedInput(item, index)),
        skipDuplicates: true,
      });
    } catch {
      // Another request may have seeded the same rows.
    }

    const seeded = await prisma.course.findMany({
      orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
    });
    return seeded.map(toRecord);
  },

  async getBySlug(slug: string, options?: { includeUnpublished?: boolean }) {
    const courses = await coursesRepository.list();
    const course = courses.find(
      (item) => item.slug === slug && (options?.includeUnpublished || isPublishedCourse(item)),
    );
    if (!course) {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Course not found", 404);
    }
    return {
      course,
      related: relatedCourses(course, courses),
    };
  },

  async replaceAll(input: UpdateCourseListInput): Promise<CourseRecord[]> {
    await prisma.$transaction(async (tx) => {
      await tx.course.deleteMany();
      if (input.courses.length === 0) {
        return;
      }
      await tx.course.createMany({
        data: input.courses.map((item, index) => toCreateData(item, index)),
      });
    });

    const rows = await prisma.course.findMany({
      orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
    });
    return rows.map(toRecord);
  },
};
