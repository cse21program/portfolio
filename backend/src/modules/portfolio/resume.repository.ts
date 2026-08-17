import { prisma } from "@common/database/prisma";
import {
  DEFAULT_RESUME_ID,
  defaultResume,
  parseCredits,
  type ResumeDocument,
} from "./resume.types";
import type { UpdateResumeInput } from "./resume.validation";

type ResumeRow = {
  headline: string | null;
  summary: string | null;
  awards: unknown;
  publications: unknown;
  pdfUrl: string | null;
  pdfFileName: string | null;
  version: number;
  updatedAt: Date;
};

function toResume(row: ResumeRow): ResumeDocument {
  return {
    headline: row.headline,
    summary: row.summary,
    awards: parseCredits(row.awards),
    publications: parseCredits(row.publications),
    pdfUrl: row.pdfUrl,
    pdfFileName: row.pdfFileName,
    version: row.version,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export const resumeRepository = {
  async getOrCreate(): Promise<ResumeDocument> {
    const existing = await prisma.resume.findUnique({
      where: { id: DEFAULT_RESUME_ID },
    });

    if (existing) {
      return toResume(existing);
    }

    const created = await prisma.resume.create({
      data: {
        id: DEFAULT_RESUME_ID,
        ...defaultResume,
        awards: defaultResume.awards,
        publications: defaultResume.publications,
      },
    });

    return toResume(created);
  },

  async update(input: UpdateResumeInput, expectedVersion: number): Promise<ResumeDocument | null> {
    const result = await prisma.resume.updateMany({
      where: { id: DEFAULT_RESUME_ID, version: expectedVersion },
      data: {
        headline: input.headline,
        summary: input.summary,
        awards: input.awards,
        publications: input.publications,
        pdfUrl: input.pdfUrl,
        pdfFileName: input.pdfFileName,
        version: expectedVersion + 1,
      },
    });

    if (result.count === 0) {
      return null;
    }

    return this.getOrCreate();
  },
};
