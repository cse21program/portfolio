import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthContext";
import { useFormErrors } from "@/lib/useFormErrors";

export function EmailVerifyBanner() {
  const { user, resendVerification, refreshUser } = useAuth();
  const [message, setMessage] = useState("");
  const { formError, resetErrors, applyCaughtError } = useFormErrors<"form">();

  if (!user || user.emailVerified) {
    return null;
  }

  async function handleResend() {
    resetErrors();
    setMessage("");
    try {
      const result = await resendVerification();
      await refreshUser();
      setMessage(
        result.alreadyVerified ? "Email already verified." : "Verification email sent. Check your inbox.",
      );
    } catch (caught) {
      applyCaughtError(caught, "Could not resend verification");
    }
  }

  return (
    <div className="rounded-3xl border border-accent/30 bg-accent/5 px-5 py-4" role="status">
      <p className="font-medium text-ink">Verify your email</p>
      <p className="mt-1 text-sm leading-6 text-ink-soft">
        Some account actions stay locked until <span className="text-ink">{user.email}</span> is
        verified.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <button type="button" className="text-sm text-accent hover:text-accent-dark" onClick={() => void handleResend()}>
          Resend verification
        </button>
        <Link to="/dashboard/settings" className="text-sm text-ink-soft hover:text-ink">
          Account settings
        </Link>
      </div>
      {formError ? (
        <p className="mt-3 text-sm text-accent" role="alert">
          {formError}
        </p>
      ) : null}
      {message ? <p className="mt-3 text-sm text-ink-soft">{message}</p> : null}
    </div>
  );
}
