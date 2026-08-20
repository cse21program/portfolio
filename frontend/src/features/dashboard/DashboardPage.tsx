import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { ActionCard } from "@/components/ui/ActionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { AuthError, AuthField, AuthSubmit } from "@/features/auth/AuthForm";
import { useAuth } from "@/features/auth/AuthContext";
import { CourseCard } from "@/features/courses/courseUi";
import { activeEnrollments, useEnrollments } from "@/features/courses/useEnrollments";
import { EmailVerifyBanner } from "@/features/dashboard/EmailVerifyBanner";
import { useServiceOrders } from "@/features/services/useServiceOrders";
import { apiGet } from "@/lib/api";
import { mediaHref } from "@/lib/mediaUrl";
import { useFormErrors } from "@/lib/useFormErrors";
import {
  collectErrors,
  validateNewPassword,
  validatePassword,
  validatePasswordMatch,
  validateRequired,
} from "@/lib/validation";
import { profileGaps, userInitials } from "@/types/auth";
import { formatCourseDate, lessonAnchor, type Course } from "@/types/course";
import type { CourseCertificateSummary, CourseProgress, Enrollment } from "@/types/enrollment";
import { isOpenServiceOrder, serviceOrderStatusLabel } from "@/types/serviceOrder";

function continueEnrollment(items: Enrollment[]) {
  const active = activeEnrollments(items);
  if (active.length === 0) {
    return null;
  }
  return [...active].sort((left, right) => {
    const leftTime = Date.parse(left.progress?.lastActivityAt || left.lastActivityAt || left.enrolledAt);
    const rightTime = Date.parse(right.progress?.lastActivityAt || right.lastActivityAt || right.enrolledAt);
    return (Number.isNaN(rightTime) ? 0 : rightTime) - (Number.isNaN(leftTime) ? 0 : leftTime);
  })[0]!;
}

function profilePrompt(gaps: string[]) {
  if (gaps.length === 0) {
    return "";
  }
  if (gaps.length === 1) {
    return `Add ${gaps[0]} to finish your profile.`;
  }
  if (gaps.length === 2) {
    return `Add ${gaps[0]} and ${gaps[1]} to finish your profile.`;
  }
  return `Add ${gaps[0]}, ${gaps[1]}, and ${gaps[2]} to finish your profile.`;
}

export function DashboardPage() {
  const { user } = useAuth();
  const { enrollments, loading: coursesLoading } = useEnrollments();
  const { orders, loading: ordersLoading } = useServiceOrders();
  const [savedCount, setSavedCount] = useState(0);
  const firstName = user?.name?.trim().split(/\s+/)[0];
  const photo = mediaHref(user?.imageUrl);
  const gaps = profileGaps(user);
  const active = activeEnrollments(enrollments);
  const openOrders = orders.filter((order) => isOpenServiceOrder(order.status));
  const nextCourse = continueEnrollment(enrollments);
  const recentOrders = orders.slice(0, 3);
  const nextProgress = nextCourse?.progress;
  const nextCompleted = nextProgress?.completed === true;
  const nextCurrent = nextProgress?.currentLesson;
  const continueHash =
    nextCurrent && !nextCompleted ? `#${lessonAnchor(nextCurrent.index, nextCurrent.title)}` : "";

  useEffect(() => {
    void apiGet<{ blogs: unknown[] }>("/blogs/bookmarks", { cache: "no-store" })
      .then((payload) => setSavedCount(payload.blogs?.length ?? 0))
      .catch(() => setSavedCount(0));
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-5">
        {photo ? (
          <img
            src={photo}
            alt=""
            className="h-16 w-16 rounded-full border border-line object-cover"
          />
        ) : (
          <span className="grid h-16 w-16 place-items-center rounded-full bg-paper-muted font-display text-xl text-ink">
            {userInitials(user)}
          </span>
        )}
        <div>
          <p className="text-xs tracking-[0.16em] text-accent uppercase">Your account</p>
          <h1 className="mt-2 font-display text-4xl text-ink">
            {firstName ? `Hello, ${firstName}` : "Hello"}
          </h1>
          <p className="mt-3 max-w-2xl text-ink-soft">
            Courses, progress, service orders, and your profile live here.
          </p>
        </div>
      </div>

      <EmailVerifyBanner />

      {gaps.length > 0 ? (
        <section className="rounded-[1.75rem] border border-line bg-surface px-6 py-5">
          <p className="text-xs tracking-[0.16em] text-muted uppercase">Profile</p>
          <p className="mt-2 text-sm leading-7 text-ink-soft">{profilePrompt(gaps)}</p>
          <Link to="/dashboard/profile" className="mt-3 inline-block text-sm font-medium text-accent hover:text-accent-dark">
            Complete profile →
          </Link>
        </section>
      ) : null}

      <dl className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-surface px-4 py-3">
          <dt className="text-xs tracking-[0.16em] text-muted uppercase">Courses</dt>
          <dd className="mt-1 font-display text-2xl text-ink">{coursesLoading ? "—" : active.length}</dd>
        </div>
        <div className="rounded-2xl border border-line bg-surface px-4 py-3">
          <dt className="text-xs tracking-[0.16em] text-muted uppercase">Open orders</dt>
          <dd className="mt-1 font-display text-2xl text-ink">{ordersLoading ? "—" : openOrders.length}</dd>
        </div>
        <div className="rounded-2xl border border-line bg-surface px-4 py-3">
          <dt className="text-xs tracking-[0.16em] text-muted uppercase">Saved posts</dt>
          <dd className="mt-1 font-display text-2xl text-ink">{savedCount}</dd>
        </div>
      </dl>

      {nextCourse ? (
        <section className="rounded-[1.75rem] border border-line bg-surface p-6">
          <p className="text-xs tracking-[0.16em] text-muted uppercase">
            {nextCompleted ? "Review" : "Continue learning"}
          </p>
          <h2 className="mt-2 font-display text-2xl text-ink">{nextCourse.courseTitle}</h2>
          {nextProgress ? (
            <>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-paper-muted" aria-hidden="true">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${Math.min(Math.max(nextProgress.percent, 0), 100)}%` }}
                />
              </div>
              <p className="mt-3 text-sm text-ink-soft">
                {nextCompleted
                  ? "Course complete"
                  : nextCurrent?.title
                    ? `Next: ${nextCurrent.title}`
                    : "Not started"}
                {` · ${nextProgress.percent}%`}
              </p>
            </>
          ) : null}
          <Link
            to={`/courses/${nextCourse.courseSlug}${continueHash}`}
            className="mt-4 inline-block text-sm font-medium text-accent hover:text-accent-dark"
          >
            {nextCompleted ? "Review course →" : "Continue →"}
          </Link>
        </section>
      ) : null}

      {recentOrders.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs tracking-[0.16em] text-muted uppercase">Recent orders</p>
              <h2 className="mt-1 font-display text-2xl text-ink">Services</h2>
            </div>
            <Link to="/dashboard/orders" className="text-sm font-medium text-accent hover:text-accent-dark">
              All orders →
            </Link>
          </div>
          <ul className="space-y-3">
            {recentOrders.map((order) => (
              <li key={order.id} className="rounded-2xl border border-line bg-surface px-5 py-4">
                <p className="text-xs tracking-[0.16em] text-muted uppercase">
                  {serviceOrderStatusLabel(order.status)}
                </p>
                <p className="mt-1 font-medium text-ink">{order.serviceTitle}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

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
          description="Request a package from the catalog. Confirmed work shows up under Orders."
          actionLabel="View services"
        />
        <ActionCard
          to="/dashboard/purchases"
          eyebrow="Account"
          title="Purchases"
          description="Checkout orders from the cart. Pay through an enabled gateway; seats are granted after payment."
          actionLabel="View purchases"
        />
        <ActionCard
          to="/dashboard/profile"
          eyebrow="Account"
          title="Profile"
          description="Name, photo, phone, country, and email notices."
          actionLabel="Edit profile"
        />
        <ActionCard
          to="/dashboard/settings"
          eyebrow="Security"
          title="Settings"
          description="Verify email, connect Google, and set or change your password."
          actionLabel="Open settings"
        />
      </div>
    </div>
  );
}

function EnrollmentProgress({
  slug,
  progress,
  lastActivityAt,
  certificate,
  canClaim,
  claiming,
  onClaim,
}: {
  slug: string;
  progress?: CourseProgress;
  lastActivityAt: string;
  certificate?: CourseCertificateSummary | null;
  canClaim?: boolean;
  claiming?: boolean;
  onClaim?: () => Promise<void> | void;
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
          <p className="text-xs tracking-[0.16em] text-muted uppercase">
            {completed ? "Completed" : "Course progress"}
          </p>
          <p className="mt-1 font-display text-2xl text-ink">{percent}%</p>
        </div>
        {lessonsTotal > 0 ? (
          <div className="flex flex-wrap items-center gap-3">
            {certificate ? (
              <Link
                to={certificate.verifyPath}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition hover:bg-accent"
              >
                View certificate
              </Link>
            ) : canClaim ? (
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
                disabled={claiming}
                onClick={() => void onClaim?.()}
              >
                {claiming ? "Issuing…" : "Get certificate"}
              </button>
            ) : null}
            <Link to={continueTo} className="text-sm font-medium text-accent hover:text-accent-dark">
              {completed ? "Review course" : "Continue"}
            </Link>
          </div>
        ) : null}
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-paper-muted" aria-hidden="true">
        <div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(Math.max(percent, 0), 100)}%` }} />
      </div>
      {certificate ? (
        <p className="mt-3 text-xs text-muted">Certificate {certificate.publicId}</p>
      ) : null}
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
  const { enrollments, loading, error, leave, reload } = useEnrollments();
  const [pendingSlug, setPendingSlug] = useState("");
  const [claimSlug, setClaimSlug] = useState("");
  const [leaveError, setLeaveError] = useState("");
  const active = activeEnrollments(enrollments);

  async function claimCertificate(courseSlug: string) {
    setLeaveError("");
    setClaimSlug(courseSlug);
    try {
      await apiGet(`/enrollments/${courseSlug}/certificate`);
      await reload();
    } catch (caught) {
      setLeaveError(caught instanceof Error ? caught.message : "Could not issue a certificate");
    } finally {
      setClaimSlug("");
    }
  }

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
          Enrolled courses, lesson progress, certificates, and the next lesson to open.
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
                  <CourseCard course={cardCourse} lessonTotal={enrollment.progress?.lessonsTotal} />
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
                  certificate={enrollment.certificate}
                  canClaim={Boolean(enrollment.progress?.completed && !enrollment.certificate)}
                  claiming={claimSlug === enrollment.courseSlug}
                  onClaim={() => claimCertificate(enrollment.courseSlug)}
                />
                <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                  <p className="text-xs text-muted">
                    {enrollment.source === "admin"
                      ? "Granted seat"
                      : enrollment.source === "purchase"
                        ? "Purchased"
                        : "Enrolled"}
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
  const { orders, loading, error, cancelOrder } = useServiceOrders();
  const [pendingId, setPendingId] = useState("");
  const [leaveError, setLeaveError] = useState("");

  async function cancel(id: string) {
    setLeaveError("");
    setPendingId(id);
    try {
      await cancelOrder(id);
    } catch (caught) {
      setLeaveError(caught instanceof Error ? caught.message : "Could not cancel this request");
    } finally {
      setPendingId("");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs tracking-[0.16em] text-muted uppercase">Work</p>
        <h1 className="mt-2 font-display text-3xl text-ink">Orders</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Service requests and status. Catalog purchases live under Purchases.
        </p>
      </div>
      {leaveError ? <AuthError>{leaveError}</AuthError> : null}
      {error ? <AuthError>{error}</AuthError> : null}
      {loading && orders.length === 0 ? (
        <div className="h-40 animate-pulse rounded-[1.75rem] bg-paper-muted" />
      ) : orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          description="Request a service from the catalog. Confirmed work and delivery status will show here."
          action={{ label: "View services", to: "/services" }}
        />
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => (
            <li key={order.id} className="rounded-[1.75rem] border border-line bg-surface p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs tracking-[0.16em] text-muted uppercase">
                    {serviceOrderStatusLabel(order.status)}
                    {order.packageName ? ` · ${order.packageName}` : ""}
                  </p>
                  <h2 className="mt-2 font-display text-2xl text-ink">{order.serviceTitle}</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-ink-soft">{order.requirements}</p>
                </div>
                <Link to={`/services/${order.serviceSlug}`} className="text-sm font-medium text-accent hover:text-accent-dark">
                  Open service →
                </Link>
              </div>
              {order.status === "pending" ? (
                <button
                  type="button"
                  className="mt-4 text-sm font-medium text-accent hover:text-accent-dark disabled:opacity-60"
                  disabled={pendingId === order.id}
                  onClick={() => void cancel(order.id)}
                >
                  {pendingId === order.id ? "Cancelling…" : "Cancel request"}
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
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
        <p className="mt-2 text-sm text-ink-soft">Sign-in methods and password.</p>
      </div>

      <EmailVerifyBanner />

      <section className="rounded-3xl border border-line bg-surface p-6">
        <h2 className="font-display text-xl text-ink">Sign-in</h2>
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
        <Link to="/dashboard/profile" className="mt-4 inline-block text-sm font-medium text-accent hover:text-accent-dark">
          Edit profile →
        </Link>
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
