import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AuthError } from "@/features/auth/AuthForm";
import { AuthScreen } from "@/features/auth/AuthScreen";
import { useAuth } from "@/features/auth/AuthContext";
import { ApiRequestError, apiPost } from "@/lib/api";

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const { refreshUser, user } = useAuth();
  const token = params.get("token") ?? "";
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("This verification link is missing a token.");
      return;
    }

    let cancelled = false;

    void apiPost("/auth/verify-email", { token })
      .then(async () => {
        if (cancelled) {
          return;
        }
        await refreshUser().catch(() => undefined);
        setDone(true);
      })
      .catch((caught) => {
        if (!cancelled) {
          setError(caught instanceof ApiRequestError ? caught.message : "Could not verify email");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token, refreshUser]);

  const continueHref = user ? (user.role === "ADMIN" ? "/admin" : "/dashboard") : "/login";

  return (
    <AuthScreen
      title="Verify email"
      description="Confirming the email on this account."
      footer={
        error || done ? (
          <p>
            <Link to={done ? continueHref : "/login"} className="font-medium text-ink underline decoration-line underline-offset-4 transition hover:text-accent hover:decoration-accent">
              {done ? "Continue" : "Back to sign in"}
            </Link>
          </p>
        ) : null
      }
    >
      {done ? (
        <div className="rounded-2xl border border-line bg-surface p-5 text-sm leading-6 text-ink-soft">
          <p>Email verified{user?.email ? ` for ${user.email}` : ""}.</p>
        </div>
      ) : (
        <div className="space-y-3 text-sm text-ink-soft">
          <AuthError>{error}</AuthError>
          {!error ? <p>Verifying…</p> : null}
        </div>
      )}
    </AuthScreen>
  );
}
