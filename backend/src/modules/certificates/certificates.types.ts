import { contentStatuses, isLiveContent } from "@common/publishing";

export type CertificateRecord = {
  id: string;
  title: string;
  slug: string;
  organization: string;
  issueDate: string;
  expiryDate: string;
  credentialId: string;
  skill: string;
  description: string;
  imageUrl: string | null;
  documentUrl: string | null;
  documentName: string | null;
  verificationUrl: string | null;
  featured: boolean;
  status: string;
  publishedAt: string;
  seoTitle: string;
  seoDescription: string;
  sortOrder: number;
};

export type CertificateWrite = Omit<CertificateRecord, "id" | "sortOrder"> & {
  id?: string;
  sortOrder?: number;
};

export const certificateStatuses = contentStatuses;

export function isPublishedCertificate(item: Pick<CertificateRecord, "status" | "publishedAt">) {
  return isLiveContent(item);
}

export function emptyToNull(value: string | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export const defaultCertificates: CertificateWrite[] = [
  {
    title: "AWS Cloud Practitioner path",
    slug: "aws-foundations",
    organization: "Amazon Web Services",
    issueDate: "In progress",
    expiryDate: "",
    credentialId: "",
    skill: "AWS",
    description:
      "Foundations across IAM, EC2, VPC, S3, and the shared-responsibility model. Credential details will be added when issued.",
    imageUrl: null,
    documentUrl: null,
    documentName: null,
    verificationUrl: null,
    featured: true,
    status: "published",
    publishedAt: "2026-01-01",
    seoTitle: "",
    seoDescription: "",
  },
  {
    title: "Docker & container fundamentals",
    slug: "docker-essentials",
    organization: "Self-directed",
    issueDate: "2025",
    expiryDate: "",
    credentialId: "",
    skill: "Docker",
    description:
      "Images, containers, volumes, networking, Compose, and a repeatable local production-shaped stack.",
    imageUrl: null,
    documentUrl: null,
    documentName: null,
    verificationUrl: null,
    featured: true,
    status: "published",
    publishedAt: "2025-01-01",
    seoTitle: "",
    seoDescription: "",
  },
  {
    title: "Spring Security & API auth",
    slug: "spring-security",
    organization: "Self-directed",
    issueDate: "2025",
    expiryDate: "",
    credentialId: "",
    skill: "Spring Boot",
    description: "JWT, session strategy, role-based access, and keeping authorization on the server.",
    imageUrl: null,
    documentUrl: null,
    documentName: null,
    verificationUrl: null,
    featured: false,
    status: "published",
    publishedAt: "2025-06-01",
    seoTitle: "",
    seoDescription: "",
  },
];
