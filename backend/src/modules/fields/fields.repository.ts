import { prisma } from "@common/database/prisma";
import { AppError, ErrorCode } from "@common/errors/AppError";
import {
  defaultFields,
  emptyToNull,
  slugFromName,
  type FieldRecord,
} from "./fields.types";
import type { FieldItemInput, UpdateFieldListInput } from "./fields.validation";

type FieldRow = {
  id: string;
  name: string;
  slug: string;
  summary: string;
  overview: string;
  iconUrl: string | null;
  thumbnailUrl: string | null;
  bannerUrl: string | null;
  videoUrl: string | null;
  embedVideoUrl: string | null;
  featured: boolean;
  published: boolean;
  seoTitle: string;
  seoDescription: string;
  sortOrder: number;
};

function toRecord(row: FieldRow): FieldRecord {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    summary: row.summary,
    overview: row.overview,
    iconUrl: row.iconUrl,
    thumbnailUrl: row.thumbnailUrl,
    bannerUrl: row.bannerUrl,
    videoUrl: row.videoUrl,
    embedVideoUrl: row.embedVideoUrl,
    featured: row.featured,
    published: row.published,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    sortOrder: row.sortOrder,
  };
}

function toData(item: FieldItemInput, index: number) {
  return {
    name: item.name,
    slug: item.slug,
    summary: item.summary,
    overview: item.overview,
    iconUrl: emptyToNull(item.iconUrl),
    thumbnailUrl: emptyToNull(item.thumbnailUrl),
    bannerUrl: emptyToNull(item.bannerUrl),
    videoUrl: emptyToNull(item.videoUrl),
    embedVideoUrl: emptyToNull(item.embedVideoUrl),
    featured: item.featured,
    published: item.published,
    seoTitle: item.seoTitle,
    seoDescription: item.seoDescription,
    sortOrder: item.sortOrder ?? index,
  };
}

async function findAll() {
  return prisma.field.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export async function ensureDefaultFields() {
  const count = await prisma.field.count();
  if (count > 0) {
    return;
  }

  try {
    await prisma.field.createMany({
      data: defaultFields.map((item, index) => ({
        name: item.name,
        slug: item.slug,
        summary: item.summary,
        overview: item.overview,
        iconUrl: item.iconUrl,
        thumbnailUrl: item.thumbnailUrl,
        bannerUrl: item.bannerUrl,
        videoUrl: item.videoUrl,
        embedVideoUrl: item.embedVideoUrl,
        featured: item.featured,
        published: item.published,
        seoTitle: item.seoTitle,
        seoDescription: item.seoDescription,
        sortOrder: index,
      })),
    });
  } catch {
    // Another request may have seeded the same rows.
  }
}

export async function resolveFieldId(tx: { field: typeof prisma.field }, name: string) {
  const trimmed = name.trim();
  const slug = slugFromName(trimmed);
  const existing = await tx.field.findFirst({
    where: {
      OR: [{ name: trimmed }, { slug }],
    },
    select: { id: true },
  });
  if (existing) {
    return existing.id;
  }

  const created = await tx.field.create({
    data: {
      name: trimmed,
      slug: slug || `field-${Date.now()}`,
      summary: `${trimmed} skills and topics.`,
      overview: "",
      featured: false,
      published: true,
      seoTitle: "",
      seoDescription: "",
      sortOrder: 999,
    },
    select: { id: true },
  });
  return created.id;
}

export const fieldsRepository = {
  async list(): Promise<FieldRecord[]> {
    await ensureDefaultFields();
    const rows = await findAll();
    return rows.map(toRecord);
  },

  async getBySlug(slug: string) {
    await ensureDefaultFields();
    const row = await prisma.field.findUnique({ where: { slug } });
    if (!row) {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Field not found", 404);
    }
    return { field: toRecord(row) };
  },

  async replaceAll(input: UpdateFieldListInput): Promise<FieldRecord[]> {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.field.findMany({ select: { id: true, slug: true, name: true } });
      const incomingIds = new Set(input.fields.map((item) => item.id).filter(Boolean) as string[]);
      const incomingSlugs = new Set(input.fields.map((item) => item.slug));
      const toRemove = existing.filter(
        (item) => !incomingIds.has(item.id) && !incomingSlugs.has(item.slug),
      );

      for (const item of toRemove) {
        const skillCount = await tx.skill.count({ where: { fieldId: item.id } });
        if (skillCount > 0) {
          throw new AppError(
            ErrorCode.CONFLICT,
            `Cannot remove ${item.name} while skills still use it`,
            400,
          );
        }
      }

      if (toRemove.length > 0) {
        await tx.field.deleteMany({ where: { id: { in: toRemove.map((item) => item.id) } } });
      }

      for (const [index, item] of input.fields.entries()) {
        const data = toData(item, index);
        if (item.id) {
          await tx.field.upsert({
            where: { id: item.id },
            create: { id: item.id, ...data },
            update: data,
          });
          continue;
        }
        await tx.field.upsert({
          where: { slug: item.slug },
          create: data,
          update: data,
        });
      }
    });

    const rows = await findAll();
    return rows.map(toRecord);
  },
};
