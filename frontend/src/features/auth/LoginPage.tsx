import { Link } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { Container } from "@/components/ui/Container";

export function LoginPage() {
  return (
    <>
      <PageHeader eyebrow="Account" title="Sign in" description="Authentication will be wired to the API next." />
      <Container className="max-w-md py-16">
        <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
          <input className="w-full rounded-xl border border-line px-4 py-3" type="email" placeholder="Email" />
          <input className="w-full rounded-xl border border-line px-4 py-3" type="password" placeholder="Password" />
          <button className="w-full rounded-full bg-ink py-3 text-sm text-paper" type="submit">
            Sign in
          </button>
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

export function RegisterPage() {
  return (
    <>
      <PageHeader eyebrow="Account" title="Create account" description="Static form. Email verification comes with auth." />
      <Container className="max-w-md py-16">
        <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
          <input className="w-full rounded-xl border border-line px-4 py-3" placeholder="Name" />
          <input className="w-full rounded-xl border border-line px-4 py-3" type="email" placeholder="Email" />
          <input className="w-full rounded-xl border border-line px-4 py-3" type="password" placeholder="Password" />
          <button className="w-full rounded-full bg-ink py-3 text-sm text-paper" type="submit">
            Register
          </button>
        </form>
      </Container>
    </>
  );
}

export function ForgotPasswordPage() {
  return (
    <>
      <PageHeader eyebrow="Account" title="Reset password" description="Static for now. Reset email will use the API." />
      <Container className="max-w-md py-16">
        <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
          <input className="w-full rounded-xl border border-line px-4 py-3" type="email" placeholder="Email" />
          <button className="w-full rounded-full bg-ink py-3 text-sm text-paper" type="submit">
            Send reset link
          </button>
        </form>
      </Container>
    </>
  );
}
