import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { AuthError } from "@/features/auth/AuthForm";
import { ApiRequestError, apiPost } from "@/lib/api";

export function UnsubscribePage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [error, setError] = useState(token ? "" : "This unsubscribe link is missing a token.");
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  async function confirm() {
    if (!token || pending) {
      return;
    }
    setPending(true);
    setError("");
    try {
      await apiPost("/newsletter/unsubscribe", { token });
      setDone(true);
    } catch (caught) {
      setError(caught instanceof ApiRequestError ? caught.message : "Could not unsubscribe");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Newsletter"
        title="Unsubscribe"
        description="Stop receiving notes from this site. You can subscribe again later."
      />
      <Container className="max-w-md py-16">
        {done ? (
          <div className="space-y-3 rounded-2xl border border-line bg-surface p-6 text-sm text-ink-soft">
            <p>You are unsubscribed.</p>
            <Link to="/blog" className="text-accent">
              Back to writing
            </Link>
          </div>
        ) : (
          <div className="space-y-4 rounded-2xl border border-line bg-surface p-6">
            <AuthError>{error}</AuthError>
            {token ? (
              <button
                type="button"
                disabled={pending}
                className="inline-flex min-h-11 cursor-pointer items-center rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper hover:bg-accent disabled:opacity-60"
                onClick={() => void confirm()}
              >
                Unsubscribe
              </button>
            ) : (
              <Link to="/blog" className="text-sm text-accent">
                Back to writing
              </Link>
            )}
          </div>
        )}
      </Container>
    </>
  );
}
