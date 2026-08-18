import { prisma } from "@common/database/prisma";
import { AppError, ErrorCode } from "@common/errors/AppError";
import { ensureDefaultFields, resolveFieldId } from "../fields/fields.repository";
import { parseTopicLinks, parseTopicSnippets } from "../topics/topics.types";
import {
  defaultSkills,
  emptyToNull,
  relatedSkills,
  type SkillRecord,
  type TopicRecord,
} from "./skills.types";
import type { SkillItemInput, TopicItemInput, UpdateSkillListInput } from "./skills.validation";

type TopicRow = {
  id: string;
  slug: string;
  title: string;
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
};

type SkillRow = {
  id: string;
  name: string;
  slug: string;
  level: string;
  years: string;
  summary: string;
  overview: string;
  iconUrl: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  embedVideoUrl: string | null;
  featured: boolean;
  published: boolean;
  seoTitle: string;
  seoDescription: string;
  sortOrder: number;
  topics: TopicRow[];
  field: {
    name: string;
    slug: string;
    videoUrl: string | null;
    embedVideoUrl: string | null;
  };
};

function toTopic(row: TopicRow): TopicRecord {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
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

function toRecord(row: SkillRow): SkillRecord {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    field: row.field.name,
    fieldSlug: row.field.slug,
    level: row.level,
    years: row.years,
    summary: row.summary,
    overview: row.overview,
    iconUrl: row.iconUrl,
    imageUrl: row.imageUrl,
    videoUrl: row.videoUrl,
    embedVideoUrl: row.embedVideoUrl,
    fieldVideoUrl: row.field.videoUrl,
    fieldEmbedVideoUrl: row.field.embedVideoUrl,
    featured: row.featured,
    published: row.published,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    sortOrder: row.sortOrder,
    topics: [...row.topics].sort((a, b) => a.sortOrder - b.sortOrder).map(toTopic),
  };
}

function toTopicData(item: TopicItemInput, index: number) {
  return {
    ...(item.id ? { id: item.id } : {}),
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

function toSkillCreateData(item: SkillItemInput, index: number, fieldId: string) {
  return {
    ...(item.id ? { id: item.id } : {}),
    name: item.name,
    slug: item.slug,
    fieldId,
    level: item.level,
    years: item.years,
    summary: item.summary,
    overview: item.overview,
    iconUrl: emptyToNull(item.iconUrl),
    imageUrl: emptyToNull(item.imageUrl),
    videoUrl: emptyToNull(item.videoUrl),
    embedVideoUrl: emptyToNull(item.embedVideoUrl),
    featured: item.featured,
    published: item.published,
    seoTitle: item.seoTitle,
    seoDescription: item.seoDescription,
    sortOrder: item.sortOrder ?? index,
    topics: {
      create: item.topics.map((topic, topicIndex) => toTopicData(topic, topicIndex)),
    },
  };
}

const skillInclude = {
  field: {
    select: {
      name: true,
      slug: true,
      videoUrl: true,
      embedVideoUrl: true,
    },
  },
  topics: {
    orderBy: [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }],
  },
};

async function findAll() {
  return prisma.skill.findMany({
    include: skillInclude,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
}

function toSkillInput(item: (typeof defaultSkills)[number]): SkillItemInput {
  return {
    name: item.name,
    slug: item.slug,
    field: item.field,
    level: item.level,
    years: item.years,
    summary: item.summary,
    overview: item.overview,
    iconUrl: item.iconUrl,
    imageUrl: item.imageUrl,
    videoUrl: item.videoUrl,
    embedVideoUrl: item.embedVideoUrl,
    fieldVideoUrl: item.fieldVideoUrl,
    fieldEmbedVideoUrl: item.fieldEmbedVideoUrl,
    featured: item.featured,
    published: item.published,
    seoTitle: item.seoTitle,
    seoDescription: item.seoDescription,
    topics: item.topics.map((topic) => ({
      title: topic.title,
      slug: topic.slug,
      summary: topic.summary,
      overview: topic.overview,
      body: topic.body ?? "",
      images: topic.images,
      videoUrl: topic.videoUrl,
      embedVideoUrl: topic.embedVideoUrl,
      codeSnippets: topic.codeSnippets ?? [],
      resources: topic.resources ?? [],
      externalLinks: topic.externalLinks ?? [],
      relatedBlogSlugs: topic.relatedBlogSlugs,
      relatedTutorialSlugs: topic.relatedTutorialSlugs,
      relatedCourseSlugs: topic.relatedCourseSlugs,
      relatedProjectSlugs: topic.relatedProjectSlugs ?? [],
      relatedCertificateSlugs: topic.relatedCertificateSlugs ?? [],
      published: topic.published ?? true,
      seoTitle: topic.seoTitle,
      seoDescription: topic.seoDescription,
    })),
  };
}

export const skillsRepository = {
  async list(): Promise<SkillRecord[]> {
    await ensureDefaultFields();
    const rows = await findAll();
    if (rows.length > 0) {
      return rows.map(toRecord);
    }

    try {
      await prisma.$transaction(async (tx) => {
        for (const [index, item] of defaultSkills.entries()) {
          const fieldId = await resolveFieldId(tx, item.field);
          await tx.skill.create({
            data: toSkillCreateData(toSkillInput(item), index, fieldId),
          });
        }
      });
    } catch {
      // Another request may have seeded the same rows.
    }

    const seeded = await findAll();
    return seeded.map(toRecord);
  },

  async getBySlug(slug: string) {
    const skills = await skillsRepository.list();
    const skill = skills.find((item) => item.slug === slug);
    if (!skill) {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Skill not found", 404);
    }
    return {
      skill,
      related: relatedSkills(skill, skills),
    };
  },

  async replaceAll(input: UpdateSkillListInput): Promise<SkillRecord[]> {
    await prisma.$transaction(async (tx) => {
      await tx.topic.deleteMany();
      await tx.skill.deleteMany();
      for (const [index, item] of input.skills.entries()) {
        const fieldId = await resolveFieldId(tx, item.field);
        const fieldVideoUrl = emptyToNull(item.fieldVideoUrl);
        const fieldEmbedVideoUrl = emptyToNull(item.fieldEmbedVideoUrl);
        if (fieldVideoUrl || fieldEmbedVideoUrl) {
          await tx.field.update({
            where: { id: fieldId },
            data: {
              ...(fieldVideoUrl ? { videoUrl: fieldVideoUrl } : {}),
              ...(fieldEmbedVideoUrl ? { embedVideoUrl: fieldEmbedVideoUrl } : {}),
            },
          });
        }
        await tx.skill.create({
          data: toSkillCreateData(item, index, fieldId),
        });
      }
    });

    const rows = await findAll();
    return rows.map(toRecord);
  },
};
