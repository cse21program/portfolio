import { prisma } from "@common/database/prisma";
import { AppError, ErrorCode } from "@common/errors/AppError";
import {
  defaultProjects,
  emptyToNull,
  relatedProjects,
  type ProjectRecord,
} from "./projects.types";
import type { ProjectItemInput, UpdateProjectListInput } from "./projects.validation";

type ProjectRow = ProjectRecord;

function toRecord(row: ProjectRow): ProjectRecord {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    shortDescription: row.shortDescription,
    fullDescription: row.fullDescription,
    thumbnailUrl: row.thumbnailUrl,
    images: row.images,
    demoVideoUrl: row.demoVideoUrl,
    category: row.category,
    technologies: row.technologies,
    features: row.features,
    architecture: row.architecture,
    problem: row.problem,
    requirements: row.requirements,
    solution: row.solution,
    challenges: row.challenges,
    solutions: row.solutions,
    lessons: row.lessons,
    status: row.status,
    startDate: row.startDate,
    endDate: row.endDate,
    githubUrl: row.githubUrl,
    liveUrl: row.liveUrl,
    docsUrl: row.docsUrl,
    featured: row.featured,
    published: row.published,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    sortOrder: row.sortOrder,
  };
}

function toCreateData(item: ProjectItemInput, index: number) {
  return {
    ...(item.id ? { id: item.id } : {}),
    title: item.title,
    slug: item.slug,
    shortDescription: item.shortDescription,
    fullDescription: item.fullDescription,
    thumbnailUrl: emptyToNull(item.thumbnailUrl),
    images: item.images,
    demoVideoUrl: emptyToNull(item.demoVideoUrl),
    category: item.category,
    technologies: item.technologies,
    features: item.features,
    architecture: item.architecture,
    problem: item.problem,
    requirements: item.requirements,
    solution: item.solution,
    challenges: item.challenges,
    solutions: item.solutions,
    lessons: item.lessons,
    status: item.status,
    startDate: item.startDate,
    endDate: item.endDate,
    githubUrl: emptyToNull(item.githubUrl),
    liveUrl: emptyToNull(item.liveUrl),
    docsUrl: emptyToNull(item.docsUrl),
    featured: item.featured,
    published: item.published,
    seoTitle: item.seoTitle,
    seoDescription: item.seoDescription,
    sortOrder: item.sortOrder ?? index,
  };
}

export const projectsRepository = {
  async list(): Promise<ProjectRecord[]> {
    const rows = await prisma.project.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    if (rows.length > 0) {
      return rows.map(toRecord);
    }

    try {
      await prisma.project.createMany({
        data: defaultProjects.map((item, index) =>
          toCreateData(
            {
              title: item.title,
              slug: item.slug,
              shortDescription: item.shortDescription,
              fullDescription: item.fullDescription,
              thumbnailUrl: item.thumbnailUrl,
              images: item.images,
              demoVideoUrl: item.demoVideoUrl,
              category: item.category,
              technologies: item.technologies,
              features: item.features,
              architecture: item.architecture,
              problem: item.problem,
              requirements: item.requirements,
              solution: item.solution,
              challenges: item.challenges,
              solutions: item.solutions,
              lessons: item.lessons,
              status: item.status,
              startDate: item.startDate,
              endDate: item.endDate,
              githubUrl: item.githubUrl,
              liveUrl: item.liveUrl,
              docsUrl: item.docsUrl,
              featured: item.featured,
              published: item.published ?? true,
              seoTitle: item.seoTitle,
              seoDescription: item.seoDescription,
            },
            index,
          ),
        ),
        skipDuplicates: true,
      });
    } catch {
      // Another request may have seeded the same rows.
    }

    const seeded = await prisma.project.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
    return seeded.map(toRecord);
  },

  async getBySlug(slug: string) {
    const projects = await projectsRepository.list();
    const project = projects.find((item) => item.slug === slug);
    if (!project) {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Project not found", 404);
    }
    return {
      project,
      related: relatedProjects(project, projects),
    };
  },

  async replaceAll(input: UpdateProjectListInput): Promise<ProjectRecord[]> {
    await prisma.$transaction(async (tx) => {
      await tx.project.deleteMany();
      if (input.projects.length === 0) {
        return;
      }
      await tx.project.createMany({
        data: input.projects.map((item, index) => toCreateData(item, index)),
      });
    });

    const rows = await prisma.project.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
    return rows.map(toRecord);
  },
};
