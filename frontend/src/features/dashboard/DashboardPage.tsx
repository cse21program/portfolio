import { useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { ActionCard } from "@/components/ui/ActionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { AuthError, AuthField, AuthSubmit } from "@/features/auth/AuthForm";
import { useAuth } from "@/features/auth/AuthContext";
import { CourseCard } from "@/features/courses/courseUi";
import { activeEnrollments, useEnrollments } from "@/features/courses/useEnrollments";
import { EmailVerifyBanner } from "@/features/dashboard/EmailVerifyBanner";
import { useFormErrors } from "@/lib/useFormErrors";
import {
  collectErrors,
  validateNewPassword,
  validatePassword,
  validatePasswordMatch,
  validateRequired,
} from "@/lib/validation";
import { formatCourseDate, lessonAnchor, type Course } from "@/types/course";
import type { CourseProgress } from "@/types/enrollment";

export function DashboardPage() {
  const { user } = useAuth();
  const firstName = user?.name?.trim().split(/\s+/)[0];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs tracking-[0.16em] text-accent uppercase">Your account</p>
        <h1 className="mt-2 font-display text-4xl text-ink">
          {firstName ? `Hello, ${firstName}` : "Hello"}
        </h1>
        <p className="mt-3 max-w-2xl text-ink-soft">
          Courses you enroll in, saved writing, service orders, and account settings live here. Free courses
          enroll from the catalog; premium seats are granted after you inquire.
        </p>
      </div>

      <EmailVerifyBanner />

      <div className="grid gap-4 md:grid-cols-2">
        <ActionCard
          to="/courses"
          eyebrow="Learn"
          title="Browse courses"
          description="Free courses enroll from the catalog. Premium seats appear here after they are granted."
          actionLabel="View catalog"
        />
        <ActionCard
          to="/services"
          eyebrow="Work together"
          title="Browse services"
          description="Service orders will show up here after a booking. You can still read packages on the public site."
          actionLabel="View services"
        />
        <ActionCard
          to="/dashboard/saved"
          eyebrow="Reading"
          title="Saved posts"
          description="Posts you bookmarked from the blog. Sign in on a post and choose Save."
          actionLabel="Open saved posts"
        />
        <ActionCard
          to="/dashboard/settings"
          eyebrow="Account"
          title="Settings"
          description="Verify email, connect Google, and set or change your password."
          actionLabel="Open settings"
        />
        <ActionCard
          to="/contact"
          eyebrow="Help"
          title="Contact"
          description="Questions about a course or a project? Send a message from the contact page."
          actionLabel="Get in touch"
        />
      </div>
    </div>
  );
}

function EnrollmentProgress({
  slug,
  progress,
  lastActivityAt,
}: {
  slug: string;
  progress?: CourseProgress;
  lastActivityAt: string;
}) {
  const lessonsTotal = progress?.lessonsTotal ?? 0;
  const lessonsCompleted = progress?.lessonsCompleted ?? 0;
  const lessonsRemaining = progress?.lessonsRemaining ?? Math.max(lessonsTotal - lessonsCompleted, 0);
  const percent = progress?.percent ?? 0;
  const completed = progress?.completed === true;
  const current = progress?.currentLesson;
  const activity = formatCourseDate(progress?.lastActivityAt || lastActivityAt);
  const continueHash =
    current && !completed ? `#${lessonAnchor(current.index, current.title)}` : "";
  const continueTo = `/courses/${slug}${continueHash}`;

  return (
    <div className="rounded-2xl border border-line bg-paper/60 px-5 py-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs tracking-[0.16em] text-muted uppercase">Course progress</p>
          <p className="mt-1 font-display text-2xl text-ink">{percent}%</p>
        </div>
        {lessonsTotal > 0 ? (
          <Link to={continueTo} className="text-sm font-medium text-accent hover:text-accent-dark">
            {completed ? "Review course" : "Continue"}
          </Link>
        ) : null}
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-paper-muted" aria-hidden="true">
        <div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(Math.max(percent, 0), 100)}%` }} />
      </div>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted">Lessons completed</dt>
          <dd className="mt-0.5 text-ink">{lessonsCompleted}</dd>
        </div>
        <div>
          <dt className="text-muted">Lessons remaining</dt>
          <dd className="mt-0.5 text-ink">{lessonsRemaining}</dd>
        </div>
        <div>
          <dt className="text-muted">Current lesson</dt>
          <dd className="mt-0.5 text-ink">
            {completed ? "Course complete" : current?.title || "Not started"}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Last activity</dt>
          <dd className="mt-0.5 text-ink">{activity || "—"}</dd>
        </div>
      </dl>
    </div>
  );
}

export function DashboardCoursesPage() {
  const { enrollments, loading, error, leave } = useEnrollments();
  const [pendingSlug, setPendingSlug] = useState("");
  const [leaveError, setLeaveError] = useState("");
  const active = activeEnrollments(enrollments);

  async function leaveCourse(courseSlug: string) {
    setLeaveError("");
    setPendingSlug(courseSlug);
    try {
      await leave(courseSlug);
    } catch (caught) {
      setLeaveError(caught instanceof Error ? caught.message : "Could not leave this course");
    } finally {
      setPendingSlug("");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs tracking-[0.16em] text-muted uppercase">Learning</p>
        <h1 className="mt-2 font-display text-3xl text-ink">My courses</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Enrolled courses, lesson progress, and the next lesson to open.
        </p>
      </div>
      {leaveError ? <AuthError>{leaveError}</AuthError> : null}
      {error ? <AuthError>{error}</AuthError> : null}
      {loading && active.length === 0 ? (
        <div className="h-40 animate-pulse rounded-[1.75rem] bg-paper-muted" />
      ) : active.length === 0 ? (
        <EmptyState
          title="No courses yet"
          description="Enroll in a free course from the catalog, or inquire about a premium seat. Granted courses appear here."
          action={{ label: "Browse courses", to: "/courses" }}
        />
      ) : (
        <div className="space-y-4">
          {active.map((enrollment) => {
            const course = enrollment.course;
            const cardCourse: Course | null = course
              ? {
                  slug: course.slug,
                  title: course.title,
                  subtitle: course.subtitle,
                  description: course.subtitle || enrollment.courseTitle,
                  skill: course.skill,
                  difficulty: course.difficulty,
                  duration: course.duration,
                  thumbnailUrl: course.thumbnailUrl,
                  outcomes: [],
                  modules: [],
                  price: course.free ? "Free" : "",
                  free: course.free,
                  featured: false,
                }
              : null;
            return (
              <div key={enrollment.id} className="space-y-2">
                {cardCourse ? (
                  <CourseCard course={cardCourse} />
                ) : (
                  <div className="rounded-[1.75rem] border border-line bg-surface p-6">
                    <h2 className="font-display text-2xl text-ink">{enrollment.courseTitle}</h2>
                    <p className="mt-2 text-sm text-muted">This course is no longer in the public catalog.</p>
                  </div>
                )}
                <EnrollmentProgress
                  slug={enrollment.courseSlug}
                  progress={enrollment.progress}
                  lastActivityAt={enrollment.lastActivityAt ?? enrollment.enrolledAt}
                />
                <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                  <p className="text-xs text-muted">
                    {enrollment.source === "admin" ? "Granted seat" : "Enrolled"}
                    {enrollment.course ? "" : " · Unavailable"}
                  </p>
                  <button
                    type="button"
                    className="text-sm font-medium text-accent hover:text-accent-dark disabled:opacity-60"
                    disabled={pendingSlug === enrollment.courseSlug}
                    onClick={() => void leaveCourse(enrollment.courseSlug)}
                  >
                    {pendingSlug === enrollment.courseSlug ? "Leaving…" : "Leave course"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function DashboardOrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs tracking-[0.16em] text-muted uppercase">Purchases</p>
        <h1 className="mt-2 font-display text-3xl text-ink">Orders</h1>
        <p className="mt-2 text-sm text-ink-soft">Course, tutorial, and service order history.</p>
      </div>
      <EmptyState
        title="No orders yet"
        description="When you buy a course or book a service, receipts and status will show here."
        action={{ label: "View services", to: "/services" }}
      />
    </div>
  );
}

export function DashboardSettingsPage() {
  const { user, changePassword } = useAuth();
  const location = useLocation();
  const verificationUrl = (location.state as { verificationUrl?: string } | null)?.verificationUrl;
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const {
    fieldErrors,
    formError,
    setFieldError,
    clearField,
    resetErrors,
    applyFieldErrors,
    applyCaughtError,
  } = useFormErrors<"currentPassword" | "newPassword" | "confirmPassword">();

  async function handlePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const currentPassword = user?.hasPassword ? String(data.get("currentPassword")) : "";
    const newPassword = String(data.get("newPassword"));
    const confirmPassword = String(data.get("confirmPassword"));
    resetErrors();
    setMessage("");

    if (
      applyFieldErrors(
        collectErrors({
          currentPassword: user?.hasPassword
            ? validateRequired(currentPassword, "Current password")
            : undefined,
          newPassword: user?.hasPassword
            ? validateNewPassword(currentPassword, newPassword)
            : validatePassword(newPassword, "New password"),
          confirmPassword: validatePasswordMatch(newPassword, confirmPassword),
        }),
      )
    ) {
      return;
    }

    setPending(true);
    try {
      await changePassword(user?.hasPassword ? currentPassword : undefined, newPassword);
      form.reset();
      setMessage("Password updated.");
    } catch (caught) {
      applyCaughtError(caught, "Could not update password");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs tracking-[0.16em] text-muted uppercase">Account</p>
        <h1 className="mt-2 font-display text-3xl text-ink">Settings</h1>
        <p className="mt-2 text-sm text-ink-soft">Email, sign-in methods, and password.</p>
      </div>

      <EmailVerifyBanner />

      <section className="rounded-3xl border border-line bg-surface p-6">
        <h2 className="font-display text-xl text-ink">Profile</h2>
        <p className="mt-3 text-lg text-ink">{user?.name ?? "Unnamed account"}</p>
        <p className="text-sm text-ink-soft">{user?.email}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-line px-3 py-1 text-ink-soft">
            {user?.role === "ADMIN" ? "Administrator" : "Customer"}
          </span>
          <span className="rounded-full border border-line px-3 py-1 text-ink-soft">
            {user?.emailVerified ? "Email verified" : "Email not verified"}
          </span>
          {user?.googleLinked ? (
            <span className="rounded-full border border-line px-3 py-1 text-ink-soft">Google connected</span>
          ) : null}
          <span className="rounded-full border border-line px-3 py-1 text-ink-soft">
            {user?.hasPassword ? "Password sign-in" : "Google only"}
          </span>
        </div>
        {verificationUrl ? (
          <p className="mt-4 break-all text-sm text-ink-soft">
            Dev verification link:{" "}
            <Link className="text-accent" to={verificationUrl.replace(/^https?:\/\/[^/]+/, "")}>
              Open link
            </Link>
          </p>
        ) : null}
      </section>

      <section className="max-w-md rounded-3xl border border-line bg-surface p-6">
        <h2 className="font-display text-xl text-ink">
          {user?.hasPassword ? "Change password" : "Set a password"}
        </h2>
        <form className="mt-4 space-y-4" onSubmit={handlePassword} noValidate>
          <AuthError>{formError}</AuthError>
          {message && !formError ? (
            <p className="text-sm text-ink-soft" role="status">
              {message}
            </p>
          ) : null}
          {user?.hasPassword ? (
            <AuthField
              label="Current password"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              error={fieldErrors.currentPassword}
              onChange={() => clearField("currentPassword")}
              onBlur={(event) =>
                setFieldError("currentPassword", validateRequired(event.target.value, "Current password"))
              }
            />
          ) : (
            <p className="text-sm text-ink-soft">
              This account uses Google sign-in. Add a password if you also want to sign in with email.
            </p>
          )}
          <AuthField
            label="New password"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            hint="8–72 characters"
            error={fieldErrors.newPassword}
            onChange={() => clearField("newPassword")}
            onBlur={(event) => {
              const currentPassword = String(
                (event.currentTarget.form?.elements.namedItem("currentPassword") as HTMLInputElement | null)
                  ?.value ?? "",
              );
              setFieldError(
                "newPassword",
                user?.hasPassword
                  ? validateNewPassword(currentPassword, event.target.value)
                  : validatePassword(event.target.value, "New password"),
              );
            }}
          />
          <AuthField
            label="Confirm new password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            error={fieldErrors.confirmPassword}
            onChange={() => clearField("confirmPassword")}
            onBlur={(event) => {
              const newPassword = String(
                (event.currentTarget.form?.elements.namedItem("newPassword") as HTMLInputElement | null)
                  ?.value ?? "",
              );
              setFieldError("confirmPassword", validatePasswordMatch(newPassword, event.target.value));
            }}
          />
          <AuthSubmit pending={pending}>
            {user?.hasPassword ? "Update password" : "Set password"}
          </AuthSubmit>
        </form>
      </section>
    </div>
  );
}
