import { AppError, ErrorCode } from "@common/errors/AppError";
import { isPublishedCourse } from "@modules/courses/courses.types";
import { coursesRepository } from "@modules/courses/courses.repository";
import { enrollmentsRepository } from "@modules/enrollments/enrollments.repository";
import { isPublishedService } from "@modules/services/services.types";
import { servicesRepository } from "@modules/services/services.repository";
import { isPublishedTutorial } from "@modules/tutorials/tutorials.types";
import { tutorialsRepository } from "@modules/tutorials/tutorials.repository";
import { parsePriceCents } from "./cart.money";
import type { CartItemKind, CatalogOffer } from "./cart.types";

function unpaidPrice(label: string, sale = "") {
  const saleCents = parsePriceCents(sale);
  if (saleCents) {
    return { unitLabel: sale.trim(), unitCents: saleCents };
  }
  const cents = parsePriceCents(label);
  if (!cents) {
    return null;
  }
  return { unitLabel: label.trim(), unitCents: cents };
}

async function resolveCourse(slug: string, userId: string): Promise<CatalogOffer> {
  const courses = await coursesRepository.list();
  const course = courses.find((item) => item.slug === slug && isPublishedCourse(item));
  if (!course) {
    throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Course not found", 404);
  }
  if (course.free) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "Free courses enroll from the catalog", 400);
  }
  const price = unpaidPrice(course.price, course.salePrice);
  if (!price) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "This course needs a request, not the cart", 400);
  }
  const enrollment = await enrollmentsRepository.findForUserCourse(userId, slug);
  if (enrollment?.status === "active") {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "You already have this course", 400);
  }
  return {
    kind: "course",
    slug: course.slug,
    title: course.title,
    packageName: "",
    href: `/courses/${course.slug}`,
    thumbnailUrl: course.thumbnailUrl,
    unitLabel: price.unitLabel,
    unitCents: price.unitCents,
    currency: course.currency.trim() || "USD",
  };
}

async function resolveTutorial(slug: string): Promise<CatalogOffer> {
  const tutorials = await tutorialsRepository.list();
  const tutorial = tutorials.find((item) => item.slug === slug && isPublishedTutorial(item));
  if (!tutorial) {
    throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Tutorial not found", 404);
  }
  if (tutorial.free) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "Free tutorials are open on the catalog", 400);
  }
  const price = unpaidPrice(tutorial.price);
  if (!price) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "This tutorial needs a request, not the cart", 400);
  }
  return {
    kind: "tutorial",
    slug: tutorial.slug,
    title: tutorial.title,
    packageName: "",
    href: `/tutorials/${tutorial.slug}`,
    thumbnailUrl: tutorial.thumbnailUrl,
    unitLabel: price.unitLabel,
    unitCents: price.unitCents,
    currency: "USD",
  };
}

async function resolveService(slug: string, packageName: string): Promise<CatalogOffer> {
  const listed = await servicesRepository.list();
  const service = listed.find((item) => item.slug === slug && isPublishedService(item) && item.available);
  if (!service) {
    throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Service not found", 404);
  }
  if (/hourly/i.test(service.pricingType) || /custom quote/i.test(service.pricingType)) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "Hourly and quote work stay on the request form", 400);
  }

  const wanted = packageName.trim();
  if (wanted) {
    const pack = service.packages.find((item) => item.name === wanted);
    if (!pack) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "That package is not on this service", 400);
    }
    const price = unpaidPrice(pack.price);
    if (!price) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "This package needs a request, not the cart", 400);
    }
    return {
      kind: "service",
      slug: service.slug,
      title: service.title,
      packageName: pack.name,
      href: `/services/${service.slug}`,
      thumbnailUrl: service.thumbnailUrl,
      unitLabel: price.unitLabel,
      unitCents: price.unitCents,
      currency: "USD",
    };
  }

  if (service.packages.length > 0) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "Choose a package for this service", 400);
  }
  const price = unpaidPrice(service.startingPrice);
  if (!price) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "This service needs a request, not the cart", 400);
  }
  return {
    kind: "service",
    slug: service.slug,
    title: service.title,
    packageName: "",
    href: `/services/${service.slug}`,
    thumbnailUrl: service.thumbnailUrl,
    unitLabel: price.unitLabel,
    unitCents: price.unitCents,
    currency: "USD",
  };
}

export async function resolveCatalogOffer(input: {
  kind: CartItemKind;
  slug: string;
  packageName: string;
  userId: string;
}): Promise<CatalogOffer> {
  if (input.kind === "course") {
    return resolveCourse(input.slug, input.userId);
  }
  if (input.kind === "tutorial") {
    return resolveTutorial(input.slug);
  }
  return resolveService(input.slug, input.packageName);
}

export async function refreshOffer(
  kind: CartItemKind,
  slug: string,
  packageName: string,
  userId: string,
): Promise<CatalogOffer | null> {
  try {
    return await resolveCatalogOffer({ kind, slug, packageName, userId });
  } catch {
    return null;
  }
}
