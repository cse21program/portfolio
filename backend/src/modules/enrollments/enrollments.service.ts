import { AppError, ErrorCode } from "@common/errors/AppError";
import { sendMailSafe } from "@common/mailer/mailer";
import { courseCertificateEmail, enrollmentConfirmedEmail } from "@common/mailer/mailer.templates";
import { env } from "@common/config/env";
import { logger } from "@common/utils/logger";
import { authRepository } from "../auth/auth.repository";
import { courseCertificatesRepository } from "../course-certificates/course-certificates.repository";
import { certificatePath } from "../course-certificates/course-certificates.types";
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

function certificateUrl(publicId: string) {
  return `${env.FRONTEND_URL.replace(/\/$/, "")}${certificatePath(publicId)}`;
}

function recipientName(name: string | null | undefined, email: string) {
  const trimmed = name?.trim() ?? "";
  if (trimmed) {
    return trimmed;
  }
  const local = email.split("@")[0]?.trim() ?? "";
  return local || "Student";
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
        certificateAvailable?: boolean;
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
    certificateAvailable: Boolean(course.certificateAvailable),
  };
}

async function publishedCourseBySlug(slug: string) {
  const courses = await coursesRepository.list();
  return courses.find((item) => item.slug === slug && isPublishedCourse(item)) ?? null;
}

async function attachCourses(rows: EnrollmentRecord[]): Promise<EnrollmentRecord[]> {
  const courses = await coursesRepository.list();
  const bySlug = new Map(courses.filter(isPublishedCourse).map((item) => [item.slug, item]));
  const ids = rows.map((row) => row.id);
  const [completed, certificates] = await Promise.all([
    enrollmentsRepository.listCompletedKeys(ids),
    courseCertificatesRepository.listByEnrollmentIds(ids),
  ]);
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
      certificate: certificates.get(row.id) ?? null,
    };
  });
}

async function issueCertificateIfEligible(input: {
  enrollment: EnrollmentRecord;
  course: CourseRecord;
  recipientName: string;
  recipientEmail: string;
}): Promise<EnrollmentRecord> {
  if (!input.enrollment.progress.completed) {
    return input.enrollment;
  }

  const { certificate, created } = await courseCertificatesRepository.issue({
    enrollmentId: input.enrollment.id,
    userId: input.enrollment.userId,
    courseSlug: input.course.slug,
    courseTitle: input.course.title,
    instructor: input.course.instructor?.trim() || "Rezaul Karim",
    recipientName: input.recipientName,
    recipientEmail: input.recipientEmail,
  });

  if (created) {
    logger.info("certificates.issued", {
      enrollmentId: input.enrollment.id,
      courseSlug: input.course.slug,
      publicId: certificate.publicId,
    });
    await sendMailSafe({
      to: input.recipientEmail,
      ...courseCertificateEmail({
        name: input.recipientName,
        courseTitle: input.course.title,
        publicId: certificate.publicId,
        url: certificateUrl(certificate.publicId),
      }),
    });
  }

  return { ...input.enrollment, certificate };
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
    const [rows, user] = await Promise.all([
      enrollmentsRepository.listForUser(userId).then(attachCourses),
      authRepository.findById(userId),
    ]);
    if (!user?.email) {
      return rows;
    }

    const courses = await coursesRepository.list();
    const bySlug = new Map(courses.filter(isPublishedCourse).map((item) => [item.slug, item]));
    return Promise.all(
      rows.map((row) => {
        const course = bySlug.get(row.courseSlug);
        if (!course || row.status !== "active") {
          return row;
        }
        return issueCertificateIfEligible({
          enrollment: row,
          course,
          recipientName: recipientName(user.name, user.email),
          recipientEmail: user.email,
        });
      }),
    );
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
    const hydrated = await hydrate(updated);
    return issueCertificateIfEligible({
      enrollment: hydrated,
      course,
      recipientName: recipientName(updated.user?.name, actor.email),
      recipientEmail: actor.email,
    });
  },

  async claimCertificate(courseSlug: string, actor: Actor) {
    const course = await publishedCourseBySlug(courseSlug);
    if (!course) {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, "Course not found", 404);
    }

    const existing = await enrollmentsRepository.findForUserCourse(actor.id, course.slug);
    if (!existing || existing.status !== "active") {
      throw new AppError(ErrorCode.FORBIDDEN, "Enroll in this course before claiming a certificate", 403);
    }

    const hydrated = await hydrate(existing);
    if (!hydrated.progress.completed) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "Finish every lesson before a certificate is issued", 400);
    }

    const user = await authRepository.findById(actor.id);
    return issueCertificateIfEligible({
      enrollment: hydrated,
      course,
      recipientName: recipientName(user?.name, actor.email),
      recipientEmail: actor.email,
    });
  },
};
