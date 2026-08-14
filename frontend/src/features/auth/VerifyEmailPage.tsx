import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { AuthError } from "@/features/auth/AuthForm";
import { useAuth } from "@/features/auth/AuthContext";
import { ApiRequestError, apiPost } from "@/lib/api";
import type { AuthPayload } from "@/types/auth";

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

    void apiPost<AuthPayload>("/auth/verify-email", { token })
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

  return (
    <>
      <PageHeader
        eyebrow="Account"
        title="Verify email"
        description="Confirming the address attached to this account."
      />
      <Container className="max-w-md py-16">
        {done ? (
          <div className="space-y-3 rounded-2xl border border-line bg-surface p-6 text-sm text-ink-soft">
            <p>Email verified{user?.email ? ` for ${user.email}` : ""}.</p>
            <Link to={user ? (user.role === "ADMIN" ? "/admin" : "/dashboard") : "/login"} className="text-accent">
              Continue
            </Link>
          </div>
        ) : (
          <div className="space-y-3 text-sm text-ink-soft">
            <AuthError>{error}</AuthError>
            {!error ? <p>Verifying…</p> : (
              <Link to="/login" className="text-accent">
                Back to sign in
              </Link>
            )}
          </div>
        )}
      </Container>
    </>
  );
}
