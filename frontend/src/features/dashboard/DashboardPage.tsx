import { useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { ActionCard } from "@/components/ui/ActionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { AuthError, AuthField, AuthSubmit } from "@/features/auth/AuthForm";
import { useAuth } from "@/features/auth/AuthContext";
import { EmailVerifyBanner } from "@/features/dashboard/EmailVerifyBanner";
import { useFormErrors } from "@/lib/useFormErrors";
import {
  collectErrors,
  validateNewPassword,
  validatePassword,
  validatePasswordMatch,
  validateRequired,
} from "@/lib/validation";

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
          Courses you buy, service orders, and account settings will live here. Until then, you can
          browse the public site or update your password.
        </p>
      </div>

      <EmailVerifyBanner />

      <div className="grid gap-4 md:grid-cols-2">
        <ActionCard
          to="/courses"
          eyebrow="Learn"
          title="Browse courses"
          description="Nothing is enrolled yet. When checkout is live, purchased courses will appear under My courses."
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

export function DashboardCoursesPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs tracking-[0.16em] text-muted uppercase">Learning</p>
        <h1 className="mt-2 font-display text-3xl text-ink">My courses</h1>
        <p className="mt-2 text-sm text-ink-soft">Enrollments, progress, and the next lesson.</p>
      </div>
      <EmptyState
        title="No courses yet"
        description="You have not enrolled in a course. Browse the catalog on the public site; purchased courses will appear here after checkout ships."
        action={{ label: "Browse courses", to: "/courses" }}
      />
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
