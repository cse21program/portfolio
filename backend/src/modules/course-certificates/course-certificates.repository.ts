import { randomBytes } from "node:crypto";
import { prisma } from "@common/database/prisma";
import { toCertificateSummary, toPublicCertificate, type CourseCertificateSummary } from "./course-certificates.types";

type CertificateRow = {
  publicId: string;
  courseTitle: string;
  courseSlug: string;
  instructor: string;
  recipientName: string;
  issuedAt: Date;
};

function newPublicId() {
  return `RK-${randomBytes(5).toString("hex").toUpperCase()}`;
}

export const courseCertificatesRepository = {
  async listByEnrollmentIds(enrollmentIds: string[]) {
    const map = new Map<string, CourseCertificateSummary>();
    if (enrollmentIds.length === 0) {
      return map;
    }
    const rows = await prisma.courseCertificate.findMany({
      where: { enrollmentId: { in: enrollmentIds } },
    });
    for (const row of rows) {
      map.set(row.enrollmentId, toCertificateSummary(row));
    }
    return map;
  },

  async findByEnrollmentId(enrollmentId: string) {
    const row = await prisma.courseCertificate.findUnique({ where: { enrollmentId } });
    return row ? toCertificateSummary(row) : null;
  },

  async getByPublicId(publicId: string) {
    const row = await prisma.courseCertificate.findUnique({ where: { publicId } });
    return row ? toPublicCertificate(row) : null;
  },

  async issue(input: {
    enrollmentId: string;
    userId: string;
    courseSlug: string;
    courseTitle: string;
    instructor: string;
    recipientName: string;
    recipientEmail: string;
  }): Promise<{ certificate: CourseCertificateSummary; created: boolean }> {
    const existing = await prisma.courseCertificate.findUnique({
      where: { enrollmentId: input.enrollmentId },
    });
    if (existing) {
      return { certificate: toCertificateSummary(existing), created: false };
    }

    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const row = await prisma.courseCertificate.create({
          data: {
            publicId: newPublicId(),
            enrollmentId: input.enrollmentId,
            userId: input.userId,
            courseSlug: input.courseSlug,
            courseTitle: input.courseTitle,
            instructor: input.instructor,
            recipientName: input.recipientName,
            recipientEmail: input.recipientEmail,
          },
        });
        return { certificate: toCertificateSummary(row), created: true };
      } catch (error) {
        const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
        if (code === "P2002") {
          const raced = await prisma.courseCertificate.findUnique({
            where: { enrollmentId: input.enrollmentId },
          });
          if (raced) {
            return { certificate: toCertificateSummary(raced), created: false };
          }
          continue;
        }
        throw error;
      }
    }

    const fallback = await prisma.courseCertificate.findUnique({
      where: { enrollmentId: input.enrollmentId },
    });
    if (fallback) {
      return { certificate: toCertificateSummary(fallback), created: false };
    }
    throw new Error("Could not issue a certificate id");
  },
};

export type { CertificateRow };
