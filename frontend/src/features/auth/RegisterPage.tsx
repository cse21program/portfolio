import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthError, AuthField, AuthPasswordField, AuthSubmit } from "@/features/auth/AuthForm";
import { AuthProviders } from "@/features/auth/GoogleSignInButton";
import { AuthScreen } from "@/features/auth/AuthScreen";
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
    <AuthScreen
      eyebrow="Join"
      title="Create an account"
      description="A few details to get started."
      footer={
        <p>
          Already have an account?{" "}
          <Link
            to="/login"
            state={from ? { from } : undefined}
            className="font-medium text-ink underline decoration-line underline-offset-4 transition hover:text-accent hover:decoration-accent"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <AuthError>{formError}</AuthError>
      <AuthProviders next={from && from !== "/register" ? from : undefined} />
      <form className="space-y-3" onSubmit={handleSubmit} noValidate>
        <AuthField
          label="Full name"
          name="name"
          autoComplete="name"
          placeholder="Your full name"
          error={fieldErrors.name}
          onChange={() => clearField("name")}
          onBlur={(event) => setFieldError("name", validateName(event.target.value))}
        />
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
        <AuthPasswordField
          label="Password"
          name="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          error={fieldErrors.password}
          onChange={() => clearField("password")}
          onBlur={(event) => setFieldError("password", validatePassword(event.target.value))}
        />
        <AuthPasswordField
          label="Confirm password"
          name="confirmPassword"
          autoComplete="new-password"
          placeholder="Repeat password"
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
        <AuthSubmit pending={pending} pendingLabel="Creating account…">
          Create account
        </AuthSubmit>
      </form>
    </AuthScreen>
  );
}
