import { useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { PagePlaceholder } from "@/components/ui/PagePlaceholder";
import { AuthError, AuthField, AuthSubmit } from "@/features/auth/AuthForm";
import { useAuth } from "@/features/auth/AuthContext";
import { useFormErrors } from "@/lib/useFormErrors";
import {
  collectErrors,
  validateNewPassword,
  validatePasswordMatch,
  validateRequired,
} from "@/lib/validation";

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <PagePlaceholder
        title={`Hello${user?.name ? `, ${user.name}` : ""}`}
        description="Purchased courses, orders, and account overview will live here."
      />
    </div>
  );
}

export function DashboardCoursesPage() {
  return <PagePlaceholder title="My courses" description="Enrollments and learning progress." />;
}

export function DashboardOrdersPage() {
  return <PagePlaceholder title="Orders" description="Course and service order history." />;
}

export function DashboardSettingsPage() {
  const { user, resendVerification, changePassword, refreshUser } = useAuth();
  const location = useLocation();
  const verificationUrl = (location.state as { verificationUrl?: string } | null)?.verificationUrl;
  const [message, setMessage] = useState(verificationUrl ?? "");
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

  async function handleResend() {
    resetErrors();
    try {
      const result = await resendVerification();
      await refreshUser();
      setMessage(result.verificationUrl ?? (result.alreadyVerified ? "Email already verified." : "Verification email sent."));
    } catch (caught) {
      applyCaughtError(caught, "Could not resend verification");
    }
  }

  async function handlePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const currentPassword = String(data.get("currentPassword"));
    const newPassword = String(data.get("newPassword"));
    const confirmPassword = String(data.get("confirmPassword"));
    resetErrors();
    setMessage("");

    if (
      applyFieldErrors(
        collectErrors({
          currentPassword: validateRequired(currentPassword, "Current password"),
          newPassword: validateNewPassword(currentPassword, newPassword),
          confirmPassword: validatePasswordMatch(newPassword, confirmPassword),
        }),
      )
    ) {
      return;
    }

    setPending(true);
    try {
      await changePassword(currentPassword, newPassword);
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
        <p className="text-xs font-semibold tracking-wide text-muted uppercase">Account</p>
        <h1 className="mt-2 font-display text-3xl text-ink">Settings</h1>
      </div>

      <section className="rounded-2xl border border-line bg-surface p-6">
        <p className="text-sm text-muted">Signed in as</p>
        <p className="mt-1 text-lg text-ink">{user?.name}</p>
        <p className="text-sm text-ink-soft">{user?.email}</p>
        <p className="mt-3 text-sm text-muted">
          Role: {user?.role === "ADMIN" ? "Administrator" : "Customer"}
          {" · "}
          {user?.emailVerified ? "Email verified" : "Email not verified"}
        </p>
        {!user?.emailVerified ? (
          <button type="button" className="mt-4 text-sm text-accent" onClick={() => void handleResend()}>
            Resend verification
          </button>
        ) : null}
        {verificationUrl ? (
          <p className="mt-3 break-all text-sm text-ink-soft">
            Dev verification link:{" "}
            <Link className="text-accent" to={verificationUrl.replace(/^https?:\/\/[^/]+/, "")}>
              {verificationUrl}
            </Link>
          </p>
        ) : null}
      </section>

      <section className="max-w-md rounded-2xl border border-line bg-surface p-6">
        <h2 className="font-display text-xl text-ink">Change password</h2>
        <form className="mt-4 space-y-4" onSubmit={handlePassword} noValidate>
          <AuthError>{formError}</AuthError>
          {message && !formError ? <p className="text-sm text-ink-soft">{message}</p> : null}
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
              setFieldError("newPassword", validateNewPassword(currentPassword, event.target.value));
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
          <AuthSubmit pending={pending}>Update password</AuthSubmit>
        </form>
      </section>
    </div>
  );
}
