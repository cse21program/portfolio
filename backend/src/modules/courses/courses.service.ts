import { AppError, ErrorCode } from "@common/errors/AppError";
import { logger } from "@common/utils/logger";
import { enrollmentsRepository } from "../enrollments/enrollments.repository";
import { progressForEnrollment } from "../enrollments/enrollments.service";
import { courseCertificatesRepository } from "../course-certificates/course-certificates.repository";
import { siteAccessService } from "../site-access/site-access.service";
import { coursesRepository } from "./courses.repository";
import {
  isPublishedCourse,
  publicCourseModules,
  stripLessonContent,
  type CourseAccess,
  type CourseRecord,
} from "./courses.types";
import type { UpdateCourseListInput } from "./courses.validation";

type Actor = { id: string; email?: string; role?: "CUSTOMER" | "ADMIN" };

async function accessFor(actor: Actor | undefined, courseSlug: string): Promise<CourseAccess> {
  if (!actor?.id) {
    return { enrolled: false, canReadLessons: false, status: null };
  }

  const row = await enrollmentsRepository.findForUserCourse(actor.id, courseSlug);
  const enrolled = row?.status === "active";
  const status = row?.status === "active" || row?.status === "canceled" ? row.status : null;

  return {
    enrolled,
    canReadLessons: actor.role === "ADMIN" || enrolled,
    status,
  };
}

function forReader(course: CourseRecord, actor?: Actor, canReadLessons = false): CourseRecord {
  const visible =
    actor?.role === "ADMIN" ? course : { ...course, modules: publicCourseModules(course.modules) };
  if (actor?.role === "ADMIN" || canReadLessons) {
    return visible;
  }
  return stripLessonContent(visible);
}

export const coursesService = {
  async list(actor?: Actor) {
    if (!(await siteAccessService.isOpen("courses", actor))) {
      return [];
    }
    const courses = await coursesRepository.list();
    if (actor?.role === "ADMIN") {
      return courses;
    }
    return courses.filter(isPublishedCourse).map((course) => forReader(course, actor));
  },

  async getBySlug(slug: string, actor?: Actor) {
    const payload = await coursesRepository.getBySlug(slug, { includeUnpublished: actor?.role === "ADMIN" });
    const access = await accessFor(actor, slug);
    if (!(await siteAccessService.isOpen("courses", actor)) && !access.enrolled) {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Course not found", 404);
    }
    const course = forReader(payload.course, actor, access.canReadLessons);
    const progress =
      actor?.id && access.enrolled ? await progressForEnrollment(actor.id, slug, course) : null;
    const enrollment =
      actor?.id && access.enrolled ? await enrollmentsRepository.findForUserCourse(actor.id, slug) : null;
    const certificate = enrollment ? await courseCertificatesRepository.findByEnrollmentId(enrollment.id) : null;
    return {
      course,
      related: payload.related.map((item) => forReader(item, actor)),
      access,
      progress,
      certificate,
    };
  },

  async replaceAll(input: UpdateCourseListInput, actor: { id: string; email: string }) {
    const courses = await coursesRepository.replaceAll(input);

    logger.info("courses.updated", {
      actorId: actor.id,
      actorEmail: actor.email,
      count: courses.length,
    });

    return courses;
  },
};
