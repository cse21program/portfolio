import { prisma } from "@common/database/prisma";
import { AppError, ErrorCode } from "@common/errors/AppError";
import {
  defaultCertificates,
  emptyToNull,
  isPublishedCertificate,
  type CertificateRecord,
} from "./certificates.types";
import type { CertificateItemInput, UpdateCertificateListInput } from "./certificates.validation";

type CertificateRow = CertificateRecord;

function toRecord(row: CertificateRow): CertificateRecord {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    organization: row.organization,
    issueDate: row.issueDate,
    expiryDate: row.expiryDate,
    credentialId: row.credentialId,
    skill: row.skill,
    description: row.description,
    imageUrl: row.imageUrl,
    documentUrl: row.documentUrl,
    documentName: row.documentName,
    verificationUrl: row.verificationUrl,
    featured: row.featured,
    status: row.status,
    publishedAt: row.publishedAt,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    sortOrder: row.sortOrder,
  };
}

function toCreateData(item: CertificateItemInput, index: number) {
  return {
    ...(item.id ? { id: item.id } : {}),
    title: item.title,
    slug: item.slug,
    organization: item.organization,
    issueDate: item.issueDate,
    expiryDate: item.expiryDate,
    credentialId: item.credentialId,
    skill: item.skill,
    description: item.description,
    imageUrl: emptyToNull(item.imageUrl),
    documentUrl: emptyToNull(item.documentUrl),
    documentName: emptyToNull(item.documentName),
    verificationUrl: emptyToNull(item.verificationUrl),
    featured: item.featured,
    status: item.status,
    publishedAt: item.publishedAt,
    seoTitle: item.seoTitle,
    seoDescription: item.seoDescription,
    sortOrder: item.sortOrder ?? index,
  };
}

export const certificatesRepository = {
  async list(): Promise<CertificateRecord[]> {
    const rows = await prisma.certificate.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    if (rows.length > 0) {
      return rows.map(toRecord);
    }

    try {
      await prisma.certificate.createMany({
        data: defaultCertificates.map((item, index) =>
          toCreateData(
            {
              title: item.title,
              slug: item.slug,
              organization: item.organization,
              issueDate: item.issueDate,
              expiryDate: item.expiryDate,
              credentialId: item.credentialId,
              skill: item.skill,
              description: item.description,
              imageUrl: item.imageUrl,
              documentUrl: item.documentUrl,
              documentName: item.documentName,
              verificationUrl: item.verificationUrl,
              featured: item.featured,
              status: item.status as CertificateItemInput["status"],
              publishedAt: item.publishedAt,
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

    const seeded = await prisma.certificate.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
    return seeded.map(toRecord);
  },

  async getBySlug(slug: string, options?: { includeUnpublished?: boolean }) {
    const certificates = await certificatesRepository.list();
    const certificate = certificates.find(
      (item) => item.slug === slug && (options?.includeUnpublished || isPublishedCertificate(item)),
    );
    if (!certificate) {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Certificate not found", 404);
    }
    return { certificate };
  },

  async replaceAll(input: UpdateCertificateListInput): Promise<CertificateRecord[]> {
    await prisma.$transaction(async (tx) => {
      await tx.certificate.deleteMany();
      if (input.certificates.length === 0) {
        return;
      }
      await tx.certificate.createMany({
        data: input.certificates.map((item, index) => toCreateData(item, index)),
      });
    });

    const rows = await prisma.certificate.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
    return rows.map(toRecord);
  },
};
