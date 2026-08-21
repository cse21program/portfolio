import { isLiveContent } from "@/lib/publishing";
import type { Certificate } from "@/types/public";

export type { Certificate };

export function slugFromTitle(title: string) {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function normalizeCertificate(
  item: Partial<Certificate> & Pick<Certificate, "title" | "slug" | "organization">,
): Certificate {
  return {
    id: typeof item.id === "string" && item.id.length > 0 ? item.id : undefined,
    title: item.title.trim(),
    slug: item.slug.trim().toLowerCase(),
    organization: item.organization.trim(),
    issueDate: item.issueDate?.trim() ?? "",
    expiryDate: item.expiryDate?.trim() ?? "",
    credentialId: item.credentialId?.trim() ?? "",
    skill: item.skill?.trim() ?? "",
    featured: item.featured === true,
    description: item.description?.trim() ?? "",
    imageUrl: item.imageUrl?.trim() || null,
    documentUrl: item.documentUrl?.trim() || null,
    documentName: item.documentName?.trim() || null,
    verificationUrl: item.verificationUrl?.trim() || null,
    status: item.status?.trim() || "published",
    publishedAt: item.publishedAt?.trim() ?? "",
    seoTitle: item.seoTitle?.trim() ?? "",
    seoDescription: item.seoDescription?.trim() ?? "",
    sortOrder: item.sortOrder,
  };
}

export function normalizeCertificateList(items: Certificate[] | undefined) {
  return (items ?? []).map((item, index) =>
    normalizeCertificate({
      ...item,
      sortOrder: item.sortOrder ?? index,
    }),
  );
}

export function publishedCertificates(items: Certificate[]) {
  return items.filter((item) => isLiveContent(item));
}

export function featuredCertificates(items: Certificate[]) {
  const live = publishedCertificates(items);
  const featured = live.filter((item) => item.featured);
  return featured.length > 0 ? featured : live.slice(0, 3);
}

export function findCertificate(items: Certificate[], slug: string) {
  return items.find((item) => item.slug === slug);
}

export function emptyCertificate(sortOrder = 0): Certificate {
  return {
    id: crypto.randomUUID(),
    title: "",
    slug: "",
    organization: "",
    issueDate: "",
    expiryDate: "",
    credentialId: "",
    skill: "",
    featured: false,
    description: "",
    imageUrl: null,
    documentUrl: null,
    documentName: null,
    verificationUrl: null,
    status: "draft",
    publishedAt: "",
    seoTitle: "",
    seoDescription: "",
    sortOrder,
  };
}
