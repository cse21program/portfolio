import type { Service, ServiceFaq, ServicePackage } from "@/types/public";
import { matchesPriceBand, matchesYear, paidCents } from "@/lib/catalogFilters";

export type { Service, ServiceFaq, ServicePackage };

export const servicePricingTypes = ["Fixed price", "Starting from", "Hourly", "Custom quote"] as const;
export const servicePublishStatuses = ["draft", "published"] as const;

export function listFromLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function slugFromTitle(title: string) {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function parseFaq(value: ServiceFaq[] | undefined): ServiceFaq[] {
  return (value ?? [])
    .map((item) => ({
      question: item.question?.trim() ?? "",
      answer: item.answer?.trim() ?? "",
    }))
    .filter((item) => item.question && item.answer);
}

function parsePackages(value: ServicePackage[] | undefined): ServicePackage[] {
  return (value ?? [])
    .map((item) => ({
      name: item.name?.trim() ?? "",
      price: item.price?.trim() ?? "",
      deliveryTime: item.deliveryTime?.trim() ?? "",
      features: (item.features ?? []).map((entry) => entry.trim()).filter(Boolean),
    }))
    .filter((item) => item.name);
}

export function normalizeService(item: Partial<Service> & Pick<Service, "title" | "slug">): Service {
  return {
    id: typeof item.id === "string" && item.id.length > 0 ? item.id : undefined,
    title: item.title.trim(),
    slug: item.slug.trim().toLowerCase(),
    shortDescription: item.shortDescription?.trim() ?? "",
    description: item.description?.trim() ?? "",
    thumbnailUrl: item.thumbnailUrl?.trim() || null,
    category: item.category?.trim() ?? "",
    startingPrice: item.startingPrice?.trim() ?? "",
    pricingType: item.pricingType?.trim() || "Starting from",
    deliveryTime: item.deliveryTime?.trim() ?? "",
    featured: item.featured === true,
    available: item.available !== false,
    features: (item.features ?? []).map((entry) => entry.trim()).filter(Boolean),
    requirements: (item.requirements ?? []).map((entry) => entry.trim()).filter(Boolean),
    technologies: (item.technologies ?? []).map((entry) => entry.trim()).filter(Boolean),
    faq: parseFaq(item.faq),
    packages: parsePackages(item.packages),
    status: item.status?.trim() || "published",
    publishedAt: item.publishedAt?.trim() ?? "",
    seoTitle: item.seoTitle?.trim() ?? "",
    seoDescription: item.seoDescription?.trim() ?? "",
    canonicalUrl: item.canonicalUrl?.trim() ?? "",
    sortOrder: item.sortOrder,
  };
}

export function normalizeServiceList(items: Service[] | undefined) {
  return (items ?? []).map((item, index) =>
    normalizeService({
      ...item,
      sortOrder: item.sortOrder ?? index,
    }),
  );
}

export function publishedServices(items: Service[]) {
  return items.filter((item) => (item.status ?? "published") === "published");
}

export function featuredServices(items: Service[]) {
  const published = publishedServices(items);
  const featured = published.filter((item) => item.featured);
  return featured.length > 0 ? featured : published.slice(0, 3);
}

export function matchesServiceQuery(item: Service, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return true;
  }
  return [item.title, item.shortDescription, item.category, item.pricingType, ...(item.technologies ?? [])]
    .join(" ")
    .toLowerCase()
    .includes(needle);
}

export type ServiceFilters = {
  query: string;
  category: string;
  technology: string;
  year?: string;
  price?: string;
};

export function matchesServiceFilters(item: Service, filters: ServiceFilters) {
  if (!matchesServiceQuery(item, filters.query)) {
    return false;
  }
  if (filters.category && item.category !== filters.category) {
    return false;
  }
  if (filters.technology && !(item.technologies ?? []).includes(filters.technology)) {
    return false;
  }
  if (!matchesYear(item.publishedAt ?? "", filters.year ?? "")) {
    return false;
  }
  if (!matchesPriceBand(false, paidCents(false, item.startingPrice), filters.price ?? "")) {
    return false;
  }
  return true;
}

export function emptyFaq(): ServiceFaq {
  return { question: "", answer: "" };
}

export function emptyPackage(): ServicePackage {
  return { name: "", price: "", deliveryTime: "", features: [] };
}

export function emptyService(sortOrder = 0): Service {
  return {
    id: crypto.randomUUID(),
    title: "",
    slug: "",
    shortDescription: "",
    description: "",
    thumbnailUrl: null,
    category: "",
    startingPrice: "",
    pricingType: "Starting from",
    deliveryTime: "",
    featured: false,
    available: true,
    features: [],
    requirements: [],
    technologies: [],
    faq: [],
    packages: [],
    status: "published",
    publishedAt: "",
    seoTitle: "",
    seoDescription: "",
    canonicalUrl: "",
    sortOrder,
  };
}
