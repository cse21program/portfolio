import { prisma } from "@common/database/prisma";
import {
  defaultEducation,
  emptyToNull,
  type EducationRecord,
} from "./education.types";
import type { EducationItemInput, UpdateEducationListInput } from "./education.validation";

type EducationRow = {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  current: boolean;
  grade: string;
  location: string;
  description: string;
  achievements: string[];
  logoUrl: string | null;
  documentUrl: string | null;
  documentName: string | null;
  website: string | null;
  sortOrder: number;
};

function toRecord(row: EducationRow): EducationRecord {
  return {
    id: row.id,
    institution: row.institution,
    degree: row.degree,
    field: row.field,
    startDate: row.startDate,
    endDate: row.current ? row.endDate || "Present" : row.endDate,
    current: row.current,
    grade: row.grade,
    location: row.location,
    description: row.description,
    achievements: row.achievements,
    logoUrl: row.logoUrl,
    documentUrl: row.documentUrl,
    documentName: row.documentName,
    website: row.website,
    sortOrder: row.sortOrder,
  };
}

function toCreateData(item: EducationItemInput, index: number) {
  return {
    ...(item.id ? { id: item.id } : {}),
    institution: item.institution,
    degree: item.degree,
    field: item.field,
    startDate: item.startDate,
    endDate: item.current ? "" : item.endDate,
    current: item.current,
    grade: item.grade,
    location: item.location,
    description: item.description,
    achievements: item.achievements,
    logoUrl: emptyToNull(item.logoUrl),
    documentUrl: emptyToNull(item.documentUrl),
    documentName: emptyToNull(item.documentName),
    website: emptyToNull(item.website),
    sortOrder: item.sortOrder ?? index,
  };
}

export const educationRepository = {
  async list(): Promise<EducationRecord[]> {
    const rows = await prisma.education.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    if (rows.length > 0) {
      return rows.map(toRecord);
    }

    await prisma.education.createMany({
      data: defaultEducation.map((item, index) =>
        toCreateData(
          {
            institution: item.institution,
            degree: item.degree,
            field: item.field,
            startDate: item.startDate,
            endDate: item.endDate,
            current: item.current,
            grade: item.grade,
            location: item.location,
            description: item.description,
            achievements: item.achievements,
            logoUrl: item.logoUrl,
            documentUrl: item.documentUrl,
            documentName: item.documentName,
            website: item.website,
          },
          index,
        ),
      ),
    });

    const seeded = await prisma.education.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
    return seeded.map(toRecord);
  },

  async replaceAll(input: UpdateEducationListInput): Promise<EducationRecord[]> {
    await prisma.$transaction(async (tx) => {
      await tx.education.deleteMany();
      if (input.education.length === 0) {
        return;
      }
      await tx.education.createMany({
        data: input.education.map((item, index) => toCreateData(item, index)),
      });
    });

    const rows = await prisma.education.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
    return rows.map(toRecord);
  },
};
