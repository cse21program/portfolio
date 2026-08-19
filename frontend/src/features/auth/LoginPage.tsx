import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { AuthError, AuthField, AuthSubmit } from "@/features/auth/AuthForm";
import { AuthProviders } from "@/features/auth/GoogleSignInButton";
import { homeForRole, useAuth } from "@/features/auth/AuthContext";
import { useFormErrors } from "@/lib/useFormErrors";
import { collectErrors, validateEmail, validateRequired } from "@/lib/validation";

const GOOGLE_ERRORS: Record<string, string> = {
  google_denied: "Google sign-in was cancelled.",
  google_failed: "Google sign-in failed. Try again.",
  google_not_configured: "Google sign-in is not configured yet.",
  google_email_unverified: "Google did not verify this email address.",
};

type LoginFields = "email" | "password";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [pending, setPending] = useState(false);
  const {
    fieldErrors,
    formError,
    setFieldError,
    clearField,
    resetErrors,
    applyFieldErrors,
    applyCaughtError,
  } = useFormErrors<LoginFields>();

  const from = (location.state as { from?: string } | null)?.from;
  const oauthError = GOOGLE_ERRORS[params.get("error") ?? ""] ?? "";

  function validate(email: string, password: string) {
    return collectErrors<LoginFields>({
      email: validateEmail(email),
      password: validateRequired(password, "Password"),
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    resetErrors();

    if (applyFieldErrors(validate(email, password))) {
      return;
    }

    setPending(true);
    try {
      const user = await login(email, password);
      navigate(from && from !== "/login" ? from : homeForRole(user.role), { replace: true });
    } catch (caught) {
      applyCaughtError(caught, "Could not sign in");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Account"
        title="Sign in"
        description="Use Google or the account you created on this site. Sessions are stored in httpOnly cookies."
      />
      <Container className="max-w-md py-16">
        <div className="space-y-4">
          <AuthError>{formError || oauthError}</AuthError>
          <AuthProviders next={from && from !== "/login" ? from : undefined} />
          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <AuthField
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              error={fieldErrors.email}
              onChange={() => clearField("email")}
              onBlur={(event) => setFieldError("email", validateEmail(event.target.value))}
            />
            <AuthField
              label="Password"
              name="password"
              type="password"
              autoComplete="current-password"
              error={fieldErrors.password}
              onChange={() => clearField("password")}
              onBlur={(event) => setFieldError("password", validateRequired(event.target.value, "Password"))}
            />
            <AuthSubmit pending={pending}>Sign in</AuthSubmit>
          </form>
        </div>
        <p className="mt-4 text-sm text-muted">
          <Link to="/forgot-password" className="text-accent">
            Forgot password
          </Link>
          {" · "}
          <Link to="/register" state={from ? { from } : undefined} className="text-accent">
            Create account
          </Link>
        </p>
      </Container>
    </>
  );
}
