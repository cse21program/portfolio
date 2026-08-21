import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { AuthError, AuthField, AuthSubmit } from "@/features/auth/AuthForm";
import { AuthScreen } from "@/features/auth/AuthScreen";
import { apiPost } from "@/lib/api";
import { useFormErrors } from "@/lib/useFormErrors";
import { collectErrors, validateEmail } from "@/lib/validation";
import type { AuthPayload } from "@/types/auth";

type ForgotFields = "email";

export function ForgotPasswordPage() {
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [resetUrl, setResetUrl] = useState<string>();
  const {
    fieldErrors,
    formError,
    setFieldError,
    clearField,
    resetErrors,
    applyFieldErrors,
    applyCaughtError,
  } = useFormErrors<ForgotFields>();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email"));
    resetErrors();

    if (applyFieldErrors(collectErrors<ForgotFields>({ email: validateEmail(email) }))) {
      return;
    }

    setPending(true);
    try {
      const payload = await apiPost<AuthPayload>("/auth/forgot-password", { email });
      setResetUrl(payload.resetUrl);
      setSent(true);
    } catch (caught) {
      applyCaughtError(caught, "Could not send reset link");
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthScreen
      title="Reset password"
      description="We’ll send a reset link if this email is on an account."
      footer={
        <p>
          Remembered it?{" "}
          <Link
            to="/login"
            className="font-medium text-ink underline decoration-line underline-offset-4 transition hover:text-accent hover:decoration-accent"
          >
            Sign in
          </Link>
        </p>
      }
    >
      {sent ? (
        <div className="space-y-3 rounded-2xl border border-line bg-surface p-5 text-sm leading-6 text-ink-soft">
          <p>If that email is registered, a reset link is ready.</p>
          {resetUrl ? (
            <p>
              Dev link:{" "}
              <Link className="break-all text-accent" to={resetUrl.replace(/^https?:\/\/[^/]+/, "")}>
                {resetUrl}
              </Link>
            </p>
          ) : null}
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <AuthError>{formError}</AuthError>
          <AuthField
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="you@mail.com"
            spellCheck={false}
            error={fieldErrors.email}
            onChange={() => clearField("email")}
            onBlur={(event) => setFieldError("email", validateEmail(event.target.value))}
          />
          <AuthSubmit pending={pending}>Send reset link</AuthSubmit>
        </form>
      )}
    </AuthScreen>
  );
}
