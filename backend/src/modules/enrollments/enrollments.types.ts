import type { CourseCertificateSummary } from "../course-certificates/course-certificates.types";
import type { CourseProgress } from "./enrollments.progress";

export type { CourseProgress } from "./enrollments.progress";
export type { CourseCertificateSummary } from "../course-certificates/course-certificates.types";

export const enrollmentStatuses = ["active", "canceled"] as const;
export const enrollmentSources = ["self", "admin", "purchase"] as const;

export type EnrollmentStatus = (typeof enrollmentStatuses)[number];
export type EnrollmentSource = (typeof enrollmentSources)[number];

export type EnrollmentCourseSummary = {
  slug: string;
  title: string;
  subtitle: string;
  thumbnailUrl: string | null;
  free: boolean;
  difficulty: string;
  duration: string;
  skill: string;
  certificateAvailable: boolean;
} | null;

export type EnrollmentRecord = {
  id: string;
  userId: string;
  courseSlug: string;
  courseTitle: string;
  status: EnrollmentStatus;
  source: EnrollmentSource;
  grantedByUserId: string | null;
  enrolledAt: string;
  canceledAt: string | null;
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
  course: EnrollmentCourseSummary;
  progress: CourseProgress;
  certificate: CourseCertificateSummary | null;
  user?: {
    id: string;
    email: string;
    name: string | null;
  };
};
