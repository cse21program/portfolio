import { prisma } from "@common/database/prisma";
import {
  defaultExperiences,
  emptyToNull,
  type ExperienceRecord,
} from "./experience.types";
import type { ExperienceItemInput, UpdateExperienceListInput } from "./experience.validation";

type ExperienceRow = {
  id: string;
  company: string;
  position: string;
  employmentType: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
  responsibilities: string[];
  achievements: string[];
  technologies: string[];
  logoUrl: string | null;
  website: string | null;
  sortOrder: number;
};

function toRecord(row: ExperienceRow): ExperienceRecord {
  return {
    id: row.id,
    company: row.company,
    position: row.position,
    type: row.employmentType,
    location: row.location,
    startDate: row.startDate,
    endDate: row.current ? row.endDate || "Present" : row.endDate,
    current: row.current,
    description: row.description,
    responsibilities: row.responsibilities,
    achievements: row.achievements,
    technologies: row.technologies,
    logoUrl: row.logoUrl,
    website: row.website,
    sortOrder: row.sortOrder,
  };
}

function toCreateData(item: ExperienceItemInput, index: number) {
  return {
    ...(item.id ? { id: item.id } : {}),
    company: item.company,
    position: item.position,
    employmentType: item.type,
    location: item.location,
    startDate: item.startDate,
    endDate: item.current ? "" : item.endDate,
    current: item.current,
    description: item.description,
    responsibilities: item.responsibilities,
    achievements: item.achievements,
    technologies: item.technologies,
    logoUrl: emptyToNull(item.logoUrl),
    website: emptyToNull(item.website),
    sortOrder: item.sortOrder ?? index,
  };
}

export const experienceRepository = {
  async list(): Promise<ExperienceRecord[]> {
    const rows = await prisma.experience.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    if (rows.length > 0) {
      return rows.map(toRecord);
    }

    await prisma.experience.createMany({
      data: defaultExperiences.map((item, index) =>
        toCreateData(
          {
            company: item.company,
            position: item.position,
            type: item.type,
            location: item.location,
            startDate: item.startDate,
            endDate: item.endDate,
            current: item.current,
            description: item.description,
            responsibilities: item.responsibilities,
            achievements: item.achievements,
            technologies: item.technologies,
            logoUrl: item.logoUrl,
            website: item.website,
          },
          index,
        ),
      ),
    });

    const seeded = await prisma.experience.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
    return seeded.map(toRecord);
  },

  async replaceAll(input: UpdateExperienceListInput): Promise<ExperienceRecord[]> {
    await prisma.$transaction(async (tx) => {
      await tx.experience.deleteMany();
      if (input.experiences.length === 0) {
        return;
      }
      await tx.experience.createMany({
        data: input.experiences.map((item, index) => toCreateData(item, index)),
      });
    });

    const rows = await prisma.experience.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
    return rows.map(toRecord);
  },
};
