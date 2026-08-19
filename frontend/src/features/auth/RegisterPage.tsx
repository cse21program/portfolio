import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { AuthError, AuthField, AuthSubmit } from "@/features/auth/AuthForm";
import { AuthProviders } from "@/features/auth/GoogleSignInButton";
import { homeForRole, useAuth } from "@/features/auth/AuthContext";
import { useFormErrors } from "@/lib/useFormErrors";
import {
  collectErrors,
  validateEmail,
  validateName,
  validatePassword,
  validatePasswordMatch,
} from "@/lib/validation";

type RegisterFields = "name" | "email" | "password" | "confirmPassword";

export function RegisterPage() {
  const { register } = useAuth();
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
  } = useFormErrors<RegisterFields>();

  const from = (location.state as { from?: string } | null)?.from;

  function validate(name: string, email: string, password: string, confirmPassword: string) {
    return collectErrors<RegisterFields>({
      name: validateName(name),
      email: validateEmail(email),
      password: validatePassword(password),
      confirmPassword: validatePasswordMatch(password, confirmPassword),
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name"));
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    const confirmPassword = String(form.get("confirmPassword"));
    resetErrors();

    if (applyFieldErrors(validate(name, email, password, confirmPassword))) {
      return;
    }

    setPending(true);
    try {
      const payload = await register({ name, email, password });
      const next = from && from !== "/register" && from !== "/login" ? from : homeForRole(payload.user.role);
      navigate(next, {
        replace: true,
        state: { verificationUrl: payload.verificationUrl },
      });
    } catch (caught) {
      applyCaughtError(caught, "Could not create account");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Account"
        title="Create account"
        description="Customers can buy courses and services, or continue with Google."
      />
      <Container className="max-w-md py-16">
        <div className="space-y-4">
          <AuthError>{formError}</AuthError>
          <AuthProviders next={from && from !== "/register" ? from : undefined} />
          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <AuthField
              label="Name"
              name="name"
              autoComplete="name"
              error={fieldErrors.name}
              onChange={() => clearField("name")}
              onBlur={(event) => setFieldError("name", validateName(event.target.value))}
            />
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
              autoComplete="new-password"
              hint="8–72 characters"
              error={fieldErrors.password}
              onChange={() => clearField("password")}
              onBlur={(event) => setFieldError("password", validatePassword(event.target.value))}
            />
            <AuthField
              label="Confirm password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
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
            <AuthSubmit pending={pending}>Register</AuthSubmit>
          </form>
        </div>
        <p className="mt-4 text-sm text-muted">
          Already have an account?{" "}
          <Link to="/login" state={from ? { from } : undefined} className="text-accent">
            Sign in
          </Link>
        </p>
      </Container>
    </>
  );
}
