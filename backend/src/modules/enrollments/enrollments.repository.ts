import { prisma } from "@common/database/prisma";
import { emptyProgress } from "./enrollments.progress";
import type { EnrollmentRecord, EnrollmentSource, EnrollmentStatus } from "./enrollments.types";

type EnrollmentRow = {
  id: string;
  userId: string;
  courseSlug: string;
  courseTitle: string;
  status: string;
  source: string;
  grantedByUserId: string | null;
  enrolledAt: Date;
  canceledAt: Date | null;
  lastActivityAt: Date;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    email: string;
    name: string | null;
  };
};

function asStatus(value: string): EnrollmentStatus {
  return value === "canceled" ? "canceled" : "active";
}

function asSource(value: string): EnrollmentSource {
  return value === "admin" ? "admin" : "self";
}

function toRecord(row: EnrollmentRow): EnrollmentRecord {
  const lastActivityAt = row.lastActivityAt.toISOString();
  return {
    id: row.id,
    userId: row.userId,
    courseSlug: row.courseSlug,
    courseTitle: row.courseTitle,
    status: asStatus(row.status),
    source: asSource(row.source),
    grantedByUserId: row.grantedByUserId,
    enrolledAt: row.enrolledAt.toISOString(),
    canceledAt: row.canceledAt ? row.canceledAt.toISOString() : null,
    lastActivityAt,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    course: null,
    progress: emptyProgress(lastActivityAt),
    user: row.user,
  };
}

const userSelect = { id: true, email: true, name: true } as const;

export const enrollmentsRepository = {
  async findForUserCourse(userId: string, courseSlug: string) {
    const row = await prisma.enrollment.findUnique({
      where: { userId_courseSlug: { userId, courseSlug } },
    });
    return row ? toRecord(row) : null;
  },

  async getById(id: string) {
    const row = await prisma.enrollment.findUnique({
      where: { id },
      include: { user: { select: userSelect } },
    });
    return row ? toRecord(row) : null;
  },

  async listForUser(userId: string): Promise<EnrollmentRecord[]> {
    const rows = await prisma.enrollment.findMany({
      where: { userId },
      orderBy: { enrolledAt: "desc" },
    });
    return rows.map(toRecord);
  },

  async listAll(): Promise<EnrollmentRecord[]> {
    const rows = await prisma.enrollment.findMany({
      include: { user: { select: userSelect } },
      orderBy: [{ status: "asc" }, { enrolledAt: "desc" }],
    });
    return rows.map(toRecord);
  },

  async listCompletedKeys(enrollmentIds: string[]) {
    const completed = new Map<string, string[]>();
    if (enrollmentIds.length === 0) {
      return completed;
    }

    const rows = await prisma.lessonProgress.findMany({
      where: { enrollmentId: { in: enrollmentIds } },
      select: { enrollmentId: true, lessonKey: true },
    });

    for (const id of enrollmentIds) {
      completed.set(id, []);
    }
    for (const row of rows) {
      const keys = completed.get(row.enrollmentId);
      if (keys) {
        keys.push(row.lessonKey);
      } else {
        completed.set(row.enrollmentId, [row.lessonKey]);
      }
    }
    return completed;
  },

  async upsertActive(input: {
    userId: string;
    courseSlug: string;
    courseTitle: string;
    source: EnrollmentSource;
    grantedByUserId?: string | null;
  }): Promise<EnrollmentRecord> {
    const now = new Date();
    const row = await prisma.enrollment.upsert({
      where: { userId_courseSlug: { userId: input.userId, courseSlug: input.courseSlug } },
      create: {
        userId: input.userId,
        courseSlug: input.courseSlug,
        courseTitle: input.courseTitle,
        status: "active",
        source: input.source,
        grantedByUserId: input.grantedByUserId ?? null,
        enrolledAt: now,
        canceledAt: null,
        lastActivityAt: now,
      },
      update: {
        courseTitle: input.courseTitle,
        status: "active",
        source: input.source,
        grantedByUserId: input.grantedByUserId ?? null,
        enrolledAt: now,
        canceledAt: null,
      },
      include: { user: { select: userSelect } },
    });
    return toRecord(row);
  },

  async cancel(id: string): Promise<EnrollmentRecord> {
    const row = await prisma.enrollment.update({
      where: { id },
      data: { status: "canceled", canceledAt: new Date() },
      include: { user: { select: userSelect } },
    });
    return toRecord(row);
  },

  async setLessonCompleted(enrollmentId: string, lessonKey: string, completed: boolean) {
    if (completed) {
      await prisma.lessonProgress.upsert({
        where: { enrollmentId_lessonKey: { enrollmentId, lessonKey } },
        create: { enrollmentId, lessonKey },
        update: { completedAt: new Date() },
      });
    } else {
      await prisma.lessonProgress.deleteMany({
        where: { enrollmentId, lessonKey },
      });
    }

    const row = await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { lastActivityAt: new Date() },
      include: { user: { select: userSelect } },
    });
    return toRecord(row);
  },
};
