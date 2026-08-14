import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { AuthError, AuthField, AuthSubmit } from "@/features/auth/AuthForm";
import { homeForRole, useAuth } from "@/features/auth/AuthContext";
import { useFormErrors } from "@/lib/useFormErrors";
import { collectErrors, validateEmail, validateRequired } from "@/lib/validation";

type LoginFields = "email" | "password";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
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
      const from = (location.state as { from?: string } | null)?.from;
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
        description="Use the account you created on this site. Sessions are stored in httpOnly cookies."
      />
      <Container className="max-w-md py-16">
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <AuthError>{formError}</AuthError>
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
        <p className="mt-4 text-sm text-muted">
          <Link to="/forgot-password" className="text-accent">
            Forgot password
          </Link>
          {" · "}
          <Link to="/register" className="text-accent">
            Create account
          </Link>
        </p>
      </Container>
    </>
  );
}
