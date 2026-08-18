import { prisma } from "@common/database/prisma";
import { AppError, ErrorCode } from "@common/errors/AppError";
import { skillsRepository } from "../skills/skills.repository";
import {
  emptyToNull,
  parseTopicLinks,
  parseTopicSnippets,
  type TopicRecord,
} from "./topics.types";
import type { TopicItemInput, UpdateTopicListInput } from "./topics.validation";

type TopicRow = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  overview: string;
  body: string;
  images: string[];
  videoUrl: string | null;
  embedVideoUrl: string | null;
  codeSnippets: unknown;
  resources: unknown;
  externalLinks: unknown;
  relatedBlogSlugs: string[];
  relatedTutorialSlugs: string[];
  relatedCourseSlugs: string[];
  relatedProjectSlugs: string[];
  relatedCertificateSlugs: string[];
  published: boolean;
  seoTitle: string;
  seoDescription: string;
  sortOrder: number;
  skill: {
    name: string;
    slug: string;
    field: { name: string; slug: string };
  };
};

function toRecord(row: TopicRow): TopicRecord {
  return {
    id: row.id,
    skill: row.skill.name,
    skillSlug: row.skill.slug,
    field: row.skill.field.name,
    fieldSlug: row.skill.field.slug,
    title: row.title,
    slug: row.slug,
    summary: row.summary,
    overview: row.overview,
    body: row.body,
    images: row.images,
    videoUrl: row.videoUrl,
    embedVideoUrl: row.embedVideoUrl,
    codeSnippets: parseTopicSnippets(row.codeSnippets),
    resources: parseTopicLinks(row.resources),
    externalLinks: parseTopicLinks(row.externalLinks),
    relatedBlogSlugs: row.relatedBlogSlugs,
    relatedTutorialSlugs: row.relatedTutorialSlugs,
    relatedCourseSlugs: row.relatedCourseSlugs,
    relatedProjectSlugs: row.relatedProjectSlugs,
    relatedCertificateSlugs: row.relatedCertificateSlugs,
    published: row.published,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    sortOrder: row.sortOrder,
  };
}

function toData(item: TopicItemInput, index: number, skillId: string) {
  return {
    skillId,
    title: item.title,
    slug: item.slug,
    summary: item.summary,
    overview: item.overview,
    body: item.body,
    images: item.images,
    videoUrl: emptyToNull(item.videoUrl),
    embedVideoUrl: emptyToNull(item.embedVideoUrl),
    codeSnippets: item.codeSnippets,
    resources: item.resources,
    externalLinks: item.externalLinks,
    relatedBlogSlugs: item.relatedBlogSlugs,
    relatedTutorialSlugs: item.relatedTutorialSlugs,
    relatedCourseSlugs: item.relatedCourseSlugs,
    relatedProjectSlugs: item.relatedProjectSlugs,
    relatedCertificateSlugs: item.relatedCertificateSlugs,
    published: item.published,
    seoTitle: item.seoTitle,
    seoDescription: item.seoDescription,
    sortOrder: item.sortOrder ?? index,
  };
}

const topicInclude = {
  skill: {
    select: {
      name: true,
      slug: true,
      field: { select: { name: true, slug: true } },
    },
  },
};

async function findAll() {
  return prisma.topic.findMany({
    include: topicInclude,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

async function resolveSkillId(
  tx: { skill: typeof prisma.skill },
  name: string,
) {
  const trimmed = name.trim();
  const existing = await tx.skill.findFirst({
    where: {
      OR: [{ name: trimmed }, { slug: trimmed.toLowerCase() }],
    },
    select: { id: true, name: true },
  });
  if (!existing) {
    throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, `Skill "${trimmed}" was not found`, 400);
  }
  return existing.id;
}

export const topicsRepository = {
  async list(): Promise<TopicRecord[]> {
    await skillsRepository.list();
    const rows = await findAll();
    return rows.map(toRecord);
  },

  async getBySlug(skillSlug: string, topicSlug: string) {
    await skillsRepository.list();
    const row = await prisma.topic.findFirst({
      where: {
        slug: topicSlug,
        published: true,
        skill: { slug: skillSlug, published: true },
      },
      include: topicInclude,
    });
    if (!row) {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Topic not found", 404);
    }
    return { topic: toRecord(row) };
  },

  async getByUniqueSlug(topicSlug: string) {
    await skillsRepository.list();
    const rows = await prisma.topic.findMany({
      where: {
        slug: topicSlug,
        published: true,
        skill: { published: true },
      },
      include: topicInclude,
    });
    if (rows.length !== 1) {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Topic not found", 404);
    }
    return { topic: toRecord(rows[0]!) };
  },

  async replaceAll(input: UpdateTopicListInput): Promise<TopicRecord[]> {
    await skillsRepository.list();
    await prisma.$transaction(async (tx) => {
      const existing = await tx.topic.findMany({ select: { id: true } });
      const incomingIds = new Set(input.topics.map((item) => item.id).filter(Boolean) as string[]);
      const toRemove = existing.filter((item) => !incomingIds.has(item.id));
      if (toRemove.length > 0) {
        await tx.topic.deleteMany({ where: { id: { in: toRemove.map((item) => item.id) } } });
      }

      for (const [index, item] of input.topics.entries()) {
        const skillId = await resolveSkillId(tx, item.skill);
        const data = toData(item, index, skillId);
        if (item.id) {
          await tx.topic.upsert({
            where: { id: item.id },
            create: { id: item.id, ...data },
            update: data,
          });
          continue;
        }
        await tx.topic.upsert({
          where: { skillId_slug: { skillId, slug: item.slug } },
          create: data,
          update: data,
        });
      }
    });

    const rows = await findAll();
    return rows.map(toRecord);
  },
};
