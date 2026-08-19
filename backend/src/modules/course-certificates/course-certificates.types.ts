export type CourseCertificateSummary = {
  publicId: string;
  issuedAt: string;
  verifyPath: string;
};

export type CourseCertificatePublic = {
  publicId: string;
  courseTitle: string;
  courseSlug: string;
  instructor: string;
  recipientName: string;
  issuedAt: string;
  verifyPath: string;
};

export function certificatePath(publicId: string) {
  return `/course-certificates/${publicId}`;
}

export function toCertificateSummary(row: {
  publicId: string;
  issuedAt: Date | string;
}): CourseCertificateSummary {
  const issuedAt = row.issuedAt instanceof Date ? row.issuedAt.toISOString() : row.issuedAt;
  return {
    publicId: row.publicId,
    issuedAt,
    verifyPath: certificatePath(row.publicId),
  };
}

export function toPublicCertificate(row: {
  publicId: string;
  courseTitle: string;
  courseSlug: string;
  instructor: string;
  recipientName: string;
  issuedAt: Date | string;
}): CourseCertificatePublic {
  const issuedAt = row.issuedAt instanceof Date ? row.issuedAt.toISOString() : row.issuedAt;
  return {
    publicId: row.publicId,
    courseTitle: row.courseTitle,
    courseSlug: row.courseSlug,
    instructor: row.instructor,
    recipientName: row.recipientName,
    issuedAt,
    verifyPath: certificatePath(row.publicId),
  };
}
