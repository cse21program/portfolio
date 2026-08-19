import { AppError, ErrorCode } from "@common/errors/AppError";
import { sendMailSafe } from "@common/mailer/mailer";
import { enrollmentConfirmedEmail } from "@common/mailer/mailer.templates";
import { env } from "@common/config/env";
import { logger } from "@common/utils/logger";
import { authRepository } from "../auth/auth.repository";
import { coursesRepository } from "../courses/courses.repository";
import { isPublishedCourse, type CourseRecord } from "../courses/courses.types";
import { computeCourseProgress, curriculumLessons, type CourseProgress } from "./enrollments.progress";
import { enrollmentsRepository } from "./enrollments.repository";
import type { EnrollmentCourseSummary, EnrollmentRecord } from "./enrollments.types";
import type { EnrollInput, GrantEnrollmentInput, LessonProgressInput } from "./enrollments.validation";

type Actor = { id: string; email: string; role: "CUSTOMER" | "ADMIN" };

function courseUrl(slug: string) {
  return `${env.FRONTEND_URL.replace(/\/$/, "")}/courses/${slug}`;
}

function courseSummary(
  course:
    | {
        slug: string;
        title: string;
        subtitle: string;
        thumbnailUrl: string | null;
        free: boolean;
        difficulty: string;
        duration: string;
        skill: string;
      }
    | undefined,
): EnrollmentCourseSummary {
  if (!course) {
    return null;
  }
  return {
    slug: course.slug,
    title: course.title,
    subtitle: course.subtitle,
    thumbnailUrl: course.thumbnailUrl,
    free: course.free,
    difficulty: course.difficulty,
    duration: course.duration,
    skill: course.skill,
  };
}

async function publishedCourseBySlug(slug: string) {
  const courses = await coursesRepository.list();
  return courses.find((item) => item.slug === slug && isPublishedCourse(item)) ?? null;
}

async function attachCourses(rows: EnrollmentRecord[]): Promise<EnrollmentRecord[]> {
  const courses = await coursesRepository.list();
  const bySlug = new Map(courses.filter(isPublishedCourse).map((item) => [item.slug, item]));
  const completed = await enrollmentsRepository.listCompletedKeys(rows.map((row) => row.id));
  return rows.map((row) => {
    const course = bySlug.get(row.courseSlug);
    return {
      ...row,
      course: courseSummary(course),
      progress: computeCourseProgress({
        modules: course?.modules,
        completedKeys: completed.get(row.id) ?? [],
        lastActivityAt: row.lastActivityAt,
      }),
    };
  });
}

async function hydrate(row: EnrollmentRecord, extra?: Partial<EnrollmentRecord>) {
  const [hydrated] = await attachCourses([{ ...row, ...extra }]);
  if (!hydrated) {
    throw new AppError(ErrorCode.INTERNAL_ERROR, "Could not load enrollment", 500);
  }
  return hydrated;
}

export async function progressForEnrollment(
  userId: string,
  courseSlug: string,
  course: CourseRecord,
): Promise<CourseProgress | null> {
  const existing = await enrollmentsRepository.findForUserCourse(userId, courseSlug);
  if (!existing || existing.status !== "active") {
    return null;
  }
  const completed = await enrollmentsRepository.listCompletedKeys([existing.id]);
  return computeCourseProgress({
    modules: course.modules,
    completedKeys: completed.get(existing.id) ?? [],
    lastActivityAt: existing.lastActivityAt,
  });
}

async function notifyEnrolled(input: {
  email: string;
  name: string | null;
  courseTitle: string;
  courseSlug: string;
  granted: boolean;
}) {
  await sendMailSafe({
    to: input.email,
    ...enrollmentConfirmedEmail({
      name: input.name ?? "",
      courseTitle: input.courseTitle,
      url: courseUrl(input.courseSlug),
      granted: input.granted,
    }),
  });
}

export const enrollmentsService = {
  async listMine(userId: string) {
    const rows = await enrollmentsRepository.listForUser(userId);
    return attachCourses(rows);
  },

  async listAdmin() {
    const rows = await enrollmentsRepository.listAll();
    return attachCourses(rows);
  },

  async enroll(input: EnrollInput, actor: Actor) {
    const course = await publishedCourseBySlug(input.courseSlug);
    if (!course) {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Course not found", 404);
    }
    if (!course.free) {
      throw new AppError(
        ErrorCode.FORBIDDEN,
        "Premium courses cannot be self-enrolled. Inquire for a seat.",
        400,
      );
    }

    const existing = await enrollmentsRepository.findForUserCourse(actor.id, course.slug);
    if (existing?.status === "active") {
      const record = await hydrate(existing);
      return { enrollment: record, created: false };
    }

    const enrollment = await enrollmentsRepository.upsertActive({
      userId: actor.id,
      courseSlug: course.slug,
      courseTitle: course.title,
      source: "self",
    });

    logger.info("enrollments.created", {
      actorId: actor.id,
      actorEmail: actor.email,
      courseSlug: course.slug,
      source: "self",
    });

    await notifyEnrolled({
      email: actor.email,
      name: null,
      courseTitle: course.title,
      courseSlug: course.slug,
      granted: false,
    });

    const hydrated = await hydrate(enrollment);
    return { enrollment: hydrated, created: true };
  },

  async cancelMine(courseSlug: string, actor: Actor) {
    const existing = await enrollmentsRepository.findForUserCourse(actor.id, courseSlug);
    if (!existing) {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Enrollment not found", 404);
    }
    if (existing.status === "canceled") {
      return hydrate(existing);
    }

    const canceled = await enrollmentsRepository.cancel(existing.id);
    logger.info("enrollments.canceled", {
      actorId: actor.id,
      actorEmail: actor.email,
      courseSlug: existing.courseSlug,
      enrollmentId: existing.id,
    });
    return hydrate(canceled);
  },

  async grant(input: GrantEnrollmentInput, actor: Actor) {
    const course = await publishedCourseBySlug(input.courseSlug);
    if (!course) {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Course not found", 404);
    }

    const user = await authRepository.findByEmail(input.email);
    if (!user || user.status !== "ACTIVE") {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "No account exists for that email", 404);
    }

    const existing = await enrollmentsRepository.findForUserCourse(user.id, course.slug);
    if (existing?.status === "active") {
      const record = await hydrate(existing, { user: { id: user.id, email: user.email, name: user.name } });
      return { enrollment: record, created: false };
    }

    const enrollment = await enrollmentsRepository.upsertActive({
      userId: user.id,
      courseSlug: course.slug,
      courseTitle: course.title,
      source: "admin",
      grantedByUserId: actor.id,
    });

    logger.info("enrollments.granted", {
      actorId: actor.id,
      actorEmail: actor.email,
      userId: user.id,
      userEmail: user.email,
      courseSlug: course.slug,
    });

    await notifyEnrolled({
      email: user.email,
      name: user.name,
      courseTitle: course.title,
      courseSlug: course.slug,
      granted: true,
    });

    const hydrated = await hydrate(enrollment, { user: { id: user.id, email: user.email, name: user.name } });
    return { enrollment: hydrated, created: true };
  },

  async revoke(id: string, actor: Actor) {
    const existing = await enrollmentsRepository.getById(id);
    if (!existing) {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Enrollment not found", 404);
    }
    if (existing.status === "canceled") {
      return hydrate(existing);
    }

    const canceled = await enrollmentsRepository.cancel(existing.id);
    logger.info("enrollments.revoked", {
      actorId: actor.id,
      actorEmail: actor.email,
      enrollmentId: existing.id,
      courseSlug: existing.courseSlug,
      userId: existing.userId,
    });
    return hydrate(canceled);
  },

  async setProgress(courseSlug: string, input: LessonProgressInput, actor: Actor) {
    const course = await publishedCourseBySlug(courseSlug);
    if (!course) {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Course not found", 404);
    }

    const existing = await enrollmentsRepository.findForUserCourse(actor.id, course.slug);
    if (!existing || existing.status !== "active") {
      throw new AppError(ErrorCode.FORBIDDEN, "Enroll in this course before tracking progress", 403);
    }

    const allowed = new Set(curriculumLessons(course.modules).map((item) => item.key));
    if (!allowed.has(input.lessonKey)) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "That lesson is not in this course", 400);
    }

    const updated = await enrollmentsRepository.setLessonCompleted(existing.id, input.lessonKey, input.completed);
    logger.info("enrollments.progress", {
      actorId: actor.id,
      actorEmail: actor.email,
      courseSlug: course.slug,
      lessonKey: input.lessonKey,
      completed: input.completed,
    });
    return hydrate(updated);
  },
};
