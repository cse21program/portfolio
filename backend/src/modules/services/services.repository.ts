import { prisma } from "@common/database/prisma";
import { AppError, ErrorCode } from "@common/errors/AppError";
import {
  defaultServices,
  emptyToNull,
  parseServiceFaq,
  parseServicePackages,
  relatedServices,
  type ServiceRecord,
} from "./services.types";
import type { ServiceItemInput, UpdateServiceListInput } from "./services.validation";

type ServiceRow = Omit<ServiceRecord, "updatedAt" | "faq" | "packages"> & {
  updatedAt: Date;
  faq: unknown;
  packages: unknown;
};

function toRecord(row: ServiceRow): ServiceRecord {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    shortDescription: row.shortDescription,
    description: row.description,
    thumbnailUrl: row.thumbnailUrl,
    category: row.category,
    startingPrice: row.startingPrice,
    pricingType: row.pricingType,
    deliveryTime: row.deliveryTime,
    features: row.features,
    requirements: row.requirements,
    technologies: row.technologies,
    faq: parseServiceFaq(row.faq),
    packages: parseServicePackages(row.packages),
    available: row.available,
    featured: row.featured,
    status: row.status,
    publishedAt: row.publishedAt,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    canonicalUrl: row.canonicalUrl,
    sortOrder: row.sortOrder,
    updatedAt: row.updatedAt.toISOString().slice(0, 10),
  };
}

function toCreateData(item: ServiceItemInput, index: number) {
  return {
    ...(item.id ? { id: item.id } : {}),
    title: item.title,
    slug: item.slug,
    shortDescription: item.shortDescription,
    description: item.description,
    thumbnailUrl: emptyToNull(item.thumbnailUrl),
    category: item.category,
    startingPrice: item.startingPrice,
    pricingType: item.pricingType,
    deliveryTime: item.deliveryTime,
    features: item.features,
    requirements: item.requirements,
    technologies: item.technologies,
    faq: parseServiceFaq(item.faq),
    packages: parseServicePackages(item.packages),
    available: item.available,
    featured: item.featured,
    status: item.status,
    publishedAt: item.publishedAt,
    seoTitle: item.seoTitle,
    seoDescription: item.seoDescription,
    canonicalUrl: item.canonicalUrl,
    sortOrder: item.sortOrder ?? index,
  };
}

export const servicesRepository = {
  async list(): Promise<ServiceRecord[]> {
    const rows = await prisma.service.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    if (rows.length > 0) {
      return rows.map(toRecord);
    }

    try {
      await prisma.service.createMany({
        data: defaultServices.map((item, index) =>
          toCreateData(
            {
              title: item.title,
              slug: item.slug,
              shortDescription: item.shortDescription,
              description: item.description,
              thumbnailUrl: item.thumbnailUrl,
              category: item.category,
              startingPrice: item.startingPrice,
              pricingType: item.pricingType as ServiceItemInput["pricingType"],
              deliveryTime: item.deliveryTime,
              features: item.features,
              requirements: item.requirements,
              technologies: item.technologies,
              faq: item.faq,
              packages: item.packages,
              available: item.available,
              featured: item.featured,
              status: item.status as ServiceItemInput["status"],
              publishedAt: item.publishedAt,
              seoTitle: item.seoTitle,
              seoDescription: item.seoDescription,
              canonicalUrl: item.canonicalUrl,
            },
            index,
          ),
        ),
        skipDuplicates: true,
      });
    } catch {
      // Another request may have seeded the same rows.
    }

    const seeded = await prisma.service.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
    return seeded.map(toRecord);
  },

  async getBySlug(slug: string) {
    const services = await servicesRepository.list();
    const service = services.find((item) => item.slug === slug);
    if (!service) {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Service not found", 404);
    }
    return {
      service,
      related: relatedServices(service, services.filter((item) => item.status === "published")),
    };
  },

  async replaceAll(input: UpdateServiceListInput): Promise<ServiceRecord[]> {
    await prisma.$transaction(async (tx) => {
      await tx.service.deleteMany();
      if (input.services.length === 0) {
        return;
      }
      await tx.service.createMany({
        data: input.services.map((item, index) => toCreateData(item, index)),
      });
    });

    const rows = await prisma.service.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
    return rows.map(toRecord);
  },
};
