export type EnrollmentStatus = "active" | "canceled";
export type EnrollmentSource = "self" | "admin";

export type CourseAccess = {
  enrolled: boolean;
  canReadLessons: boolean;
  status: EnrollmentStatus | null;
};

export type CourseProgress = {
  lessonsTotal: number;
  lessonsCompleted: number;
  lessonsRemaining: number;
  percent: number;
  currentLesson: {
    key: string;
    title: string;
    moduleTitle: string;
    index: number;
  } | null;
  lastActivityAt: string;
  completedKeys: string[];
  completed: boolean;
};

export const defaultCourseAccess: CourseAccess = {
  enrolled: false,
  canReadLessons: false,
  status: null,
};

export const emptyCourseProgress = (lastActivityAt = ""): CourseProgress => ({
  lessonsTotal: 0,
  lessonsCompleted: 0,
  lessonsRemaining: 0,
  percent: 0,
  currentLesson: null,
  lastActivityAt,
  completedKeys: [],
  completed: false,
});

export type EnrollmentCourseSummary = {
  slug: string;
  title: string;
  subtitle: string;
  thumbnailUrl: string | null;
  free: boolean;
  difficulty: string;
  duration: string;
  skill: string;
  certificateAvailable?: boolean;
} | null;

export type Enrollment = {
  id: string;
  courseSlug: string;
  courseTitle: string;
  status: EnrollmentStatus;
  source: EnrollmentSource;
  enrolledAt: string;
  canceledAt: string | null;
  lastActivityAt?: string;
  course: EnrollmentCourseSummary;
  progress?: CourseProgress;
  certificate?: CourseCertificateSummary | null;
  user?: {
    id: string;
    email: string;
    name: string | null;
  };
};

export type CourseCertificateSummary = {
  publicId: string;
  issuedAt: string;
  verifyPath: string;
};

export type CourseCertificatePublic = {
  publicId: string;
  courseTitle: string;
  courseSlug: string;
  instructor: string;
  recipientName: string;
  issuedAt: string;
  verifyPath: string;
};

export function parseCourseAccess(value: unknown): CourseAccess {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return defaultCourseAccess;
  }
  const row = value as Record<string, unknown>;
  const status = row.status === "active" || row.status === "canceled" ? row.status : null;
  return {
    enrolled: row.enrolled === true,
    canReadLessons: row.canReadLessons === true,
    status,
  };
}

export function parseCourseProgress(value: unknown): CourseProgress | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const row = value as Record<string, unknown>;
  const current = row.currentLesson;
  const currentLesson =
    current && typeof current === "object" && !Array.isArray(current)
      ? {
          key: typeof (current as { key?: unknown }).key === "string" ? (current as { key: string }).key : "",
          title: typeof (current as { title?: unknown }).title === "string" ? (current as { title: string }).title : "",
          moduleTitle:
            typeof (current as { moduleTitle?: unknown }).moduleTitle === "string"
              ? (current as { moduleTitle: string }).moduleTitle
              : "",
          index:
            typeof (current as { index?: unknown }).index === "number" ? (current as { index: number }).index : 0,
        }
      : null;
  const completedKeys = Array.isArray(row.completedKeys)
    ? row.completedKeys.filter((entry): entry is string => typeof entry === "string")
    : [];
  const lessonsTotal = typeof row.lessonsTotal === "number" ? row.lessonsTotal : 0;
  const lessonsCompleted = typeof row.lessonsCompleted === "number" ? row.lessonsCompleted : 0;
  return {
    lessonsTotal,
    lessonsCompleted,
    lessonsRemaining: typeof row.lessonsRemaining === "number" ? row.lessonsRemaining : Math.max(lessonsTotal - lessonsCompleted, 0),
    percent: typeof row.percent === "number" ? row.percent : 0,
    currentLesson: currentLesson && currentLesson.key ? currentLesson : null,
    lastActivityAt: typeof row.lastActivityAt === "string" ? row.lastActivityAt : "",
    completedKeys,
    completed: row.completed === true,
  };
}

export function parseCourseCertificate(value: unknown): CourseCertificateSummary | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const row = value as Record<string, unknown>;
  const publicId = typeof row.publicId === "string" ? row.publicId : "";
  if (!publicId) {
    return null;
  }
  return {
    publicId,
    issuedAt: typeof row.issuedAt === "string" ? row.issuedAt : "",
    verifyPath: typeof row.verifyPath === "string" ? row.verifyPath : `/course-certificates/${publicId}`,
  };
}

