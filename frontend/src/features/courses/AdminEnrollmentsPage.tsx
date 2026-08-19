import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { FilterSearch, FilterToolbar } from "@/components/ui/FilterBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormField, FormSelect } from "@/components/ui/FormField";
import { AuthError } from "@/features/auth/AuthForm";
import { useCourses } from "@/features/courses/useCourses";
import { apiDelete, apiGet, apiPost } from "@/lib/api";
import { useFormErrors } from "@/lib/useFormErrors";
import { collectErrors, validateEmail, validateRequired } from "@/lib/validation";
import { publishedCourses } from "@/types/course";
import type { Enrollment } from "@/types/enrollment";

type GrantFields = "email" | "courseSlug";

function statusLabel(status: string) {
  return status === "canceled" ? "Canceled" : "Active";
}

function sourceLabel(source: string) {
  return source === "admin" ? "Granted" : "Self";
}

function formatWhen(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function AdminEnrollmentsPage() {
  const { courses } = useCourses();
  const published = publishedCourses(courses);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [pending, setPending] = useState("");
  const {
    fieldErrors,
    formError,
    setFieldError,
    clearField,
    resetErrors,
    applyFieldErrors,
    applyCaughtError,
  } = useFormErrors<GrantFields>();

  const reload = useCallback(async () => {
    try {
      const payload = await apiGet<{ enrollments: Enrollment[] }>("/enrollments/admin", { cache: "no-store" });
      setEnrollments(payload.enrollments ?? []);
      setError("");
    } catch {
      setError("Could not load enrollments");
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return enrollments;
    }
    return enrollments.filter((item) => {
      const haystack = [
        item.user?.email ?? "",
        item.user?.name ?? "",
        item.courseTitle,
        item.courseSlug,
        item.status,
        item.source,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [enrollments, query]);

  async function grantSeat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const email = String(data.get("email"));
    const courseSlug = String(data.get("courseSlug"));
    resetErrors();
    setNote("");
    setError("");

    if (
      applyFieldErrors(
        collectErrors({
          email: validateEmail(email),
          courseSlug: validateRequired(courseSlug, "Course"),
        }),
      )
    ) {
      return;
    }

    setPending("grant");
    try {
      await apiPost("/enrollments/admin", { email, courseSlug });
      form.reset();
      setNote("Seat granted.");
      await reload();
    } catch (caught) {
      applyCaughtError(caught, "Could not grant that seat");
    } finally {
      setPending("");
    }
  }

  async function revokeSeat(id: string) {
    setPending(id);
    setNote("");
    setError("");
    try {
      await apiDelete(`/enrollments/admin/${id}`);
      await reload();
    } catch {
      setError("Could not revoke this seat");
    } finally {
      setPending("");
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs tracking-[0.16em] text-accent uppercase">Studio</p>
        <h1 className="mt-2 font-display text-4xl text-ink">Enrollments</h1>
        <p className="mt-3 max-w-2xl text-ink-soft">
          Grant a seat by account email. Free courses can self-enroll; premium courses stay locked until you grant
          access. Checkout is not wired yet, so there is no fake Buy button.
        </p>
      </div>

      <section className="space-y-5 rounded-3xl border border-line bg-surface p-6 shadow-[0_1px_0_rgb(26_22_18/0.04)] sm:p-7">
        <div>
          <h2 className="font-display text-2xl text-ink">Grant a seat</h2>
          <p className="mt-1 text-sm text-muted">The student must already have an account.</p>
        </div>
        <form className="space-y-4" onSubmit={grantSeat} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Student email"
              name="email"
              type="email"
              autoComplete="email"
              error={fieldErrors.email}
              onChange={() => clearField("email")}
              onBlur={(event) => setFieldError("email", validateEmail(event.target.value))}
            />
            <FormSelect
              label="Course"
              name="courseSlug"
              error={fieldErrors.courseSlug}
              onChange={() => clearField("courseSlug")}
              defaultValue=""
            >
              <option value="">Select a published course</option>
              {published.map((course) => (
                <option key={course.slug} value={course.slug}>
                  {course.title}
                  {course.free ? " · Free" : " · Premium"}
                </option>
              ))}
            </FormSelect>
          </div>
          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition hover:bg-accent disabled:opacity-60"
            disabled={pending === "grant"}
          >
            {pending === "grant" ? "Granting…" : "Grant seat"}
          </button>
        </form>
        {formError ? <AuthError>{formError}</AuthError> : null}
        {note ? <p className="text-sm text-ink-soft">{note}</p> : null}
      </section>

      {error ? <AuthError>{error}</AuthError> : null}

      <FilterToolbar>
        <FilterSearch
          id="search-enrollments"
          label="Search enrollments"
          value={query}
          placeholder="Email, name, or course"
          resultLabel={`${visible.length} ${visible.length === 1 ? "enrollment" : "enrollments"}`}
          filtering={query.trim().length > 0}
          onChange={setQuery}
          onClear={() => setQuery("")}
        />
      </FilterToolbar>

      {visible.length === 0 ? (
        <EmptyState
          title={enrollments.length === 0 ? "No enrollments yet" : "No matches"}
          description={
            enrollments.length === 0
              ? "Grant a seat above, or wait for a student to enroll in a free course."
              : "Try a different name, email, or course."
          }
        />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-3xl border border-line bg-surface">
          {visible.map((item) => {
            const email = item.user?.email ?? "Unknown account";
            const title = item.course?.title ?? item.courseTitle;
            return (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <p className="font-medium text-ink">{email}</p>
                  <p className="mt-1 text-sm text-ink-soft">
                    {title}
                    <span className="text-muted">
                      {" "}
                      · {statusLabel(item.status)} · {sourceLabel(item.source)}
                      {item.enrolledAt ? ` · ${formatWhen(item.enrolledAt)}` : ""}
                    </span>
                  </p>
                </div>
                {item.status === "active" ? (
                  <button
                    type="button"
                    className="text-sm font-medium text-accent hover:text-accent-dark disabled:opacity-60"
                    disabled={pending === item.id}
                    aria-label={`Revoke seat for ${email} in ${title}`}
                    onClick={() => void revokeSeat(item.id)}
                  >
                    {pending === item.id ? "Revoking…" : "Revoke seat"}
                  </button>
                ) : (
                  <p className="text-sm text-muted">Revoked</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
