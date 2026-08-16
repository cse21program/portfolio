import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { AuthError, AuthField, AuthSubmit } from "@/features/auth/AuthForm";
import { apiPost } from "@/lib/api";
import { useFormErrors } from "@/lib/useFormErrors";
import { collectErrors, validatePassword, validatePasswordMatch } from "@/lib/validation";

type ResetFields = "password" | "confirmPassword";

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") ?? "";
  const [pending, setPending] = useState(false);
  const {
    fieldErrors,
    formError,
    setFormError,
    setFieldError,
    clearField,
    resetErrors,
    applyFieldErrors,
    applyCaughtError,
  } = useFormErrors<ResetFields>();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password"));
    const confirmPassword = String(form.get("confirmPassword"));
    resetErrors();

    if (!token) {
      setFormError("This reset link is missing a token.");
      return;
    }

    if (
      applyFieldErrors(
        collectErrors<ResetFields>({
          password: validatePassword(password, "New password"),
          confirmPassword: validatePasswordMatch(password, confirmPassword),
        }),
      )
    ) {
      return;
    }

    setPending(true);
    try {
      await apiPost("/auth/reset-password", { token, password });
      navigate("/login", { replace: true });
    } catch (caught) {
      applyCaughtError(caught, "Could not update password");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Account"
        title="Choose a new password"
        description="This link is single-use and expires after one hour."
      />
      <Container className="max-w-md py-16">
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <AuthError>{formError || (!token ? "This reset link is missing a token." : "")}</AuthError>
          <AuthField
            label="New password"
            name="password"
            type="password"
            autoComplete="new-password"
            hint="8–72 characters"
            disabled={!token}
            error={fieldErrors.password}
            onChange={() => clearField("password")}
            onBlur={(event) => setFieldError("password", validatePassword(event.target.value, "New password"))}
          />
          <AuthField
            label="Confirm password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            disabled={!token}
            error={fieldErrors.confirmPassword}
            onChange={() => clearField("confirmPassword")}
            onBlur={(event) => {
              const password = String(
                (event.currentTarget.form?.elements.namedItem("password") as HTMLInputElement | null)
                  ?.value ?? "",
              );
              setFieldError("confirmPassword", validatePasswordMatch(password, event.target.value));
            }}
          />
          <AuthSubmit pending={pending}>Update password</AuthSubmit>
        </form>
        <p className="mt-4 text-sm text-muted">
          <Link to="/login" className="text-accent">
            Back to sign in
          </Link>
        </p>
      </Container>
    </>
  );
}
