import { logger } from "@common/utils/logger";
import { enrollmentsRepository } from "../enrollments/enrollments.repository";
import { progressForEnrollment } from "../enrollments/enrollments.service";
import { courseCertificatesRepository } from "../course-certificates/course-certificates.repository";
import { coursesRepository } from "./courses.repository";
import {
  isPublishedCourse,
  stripLessonContent,
  type CourseAccess,
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

export const coursesService = {
  async list(actor?: Actor) {
    const courses = await coursesRepository.list();
    if (actor?.role === "ADMIN") {
      return courses;
    }
    return courses.filter(isPublishedCourse).map(stripLessonContent);
  },

  async getBySlug(slug: string, actor?: Actor) {
    const payload = await coursesRepository.getBySlug(slug);
    const access = await accessFor(actor, slug);
    const progress =
      actor?.id && access.enrolled ? await progressForEnrollment(actor.id, slug, payload.course) : null;
    const enrollment =
      actor?.id && access.enrolled ? await enrollmentsRepository.findForUserCourse(actor.id, slug) : null;
    const certificate = enrollment ? await courseCertificatesRepository.findByEnrollmentId(enrollment.id) : null;
    return {
      course: access.canReadLessons ? payload.course : stripLessonContent(payload.course),
      related: payload.related.map(stripLessonContent),
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
