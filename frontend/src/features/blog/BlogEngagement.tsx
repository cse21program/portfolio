import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { Container } from "@/components/ui/Container";
import { FormTextArea } from "@/components/ui/FormField";
import { AuthError } from "@/features/auth/AuthForm";
import { useAuth } from "@/features/auth/AuthContext";
import { apiDelete, apiGet, apiPost } from "@/lib/api";
import { useFormErrors } from "@/lib/useFormErrors";
import { collectErrors, validateMessage } from "@/lib/validation";
import { formatBlogDate } from "@/types/blog";

export type BlogComment = {
  id: string;
  slug: string;
  body: string;
  author: string;
  userId: string;
  createdAt: string;
};

type Engagement = {
  comments: BlogComment[];
  likeCount: number;
  liked: boolean;
  bookmarked: boolean;
};

const emptyEngagement: Engagement = {
  comments: [],
  likeCount: 0,
  liked: false,
  bookmarked: false,
};

function asEngagement(payload: Partial<Engagement> | null | undefined): Engagement {
  return {
    comments: Array.isArray(payload?.comments) ? payload.comments : [],
    likeCount: typeof payload?.likeCount === "number" ? payload.likeCount : 0,
    liked: Boolean(payload?.liked),
    bookmarked: Boolean(payload?.bookmarked),
  };
}

export function BlogEngagement({ slug }: { slug: string }) {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const [engagement, setEngagement] = useState<Engagement>(emptyEngagement);
  const [pending, setPending] = useState<"like" | "save" | "comment" | string>("");
  const {
    fieldErrors,
    formError,
    setFieldError,
    clearField,
    resetErrors,
    applyFieldErrors,
    applyCaughtError,
  } = useFormErrors<"body">();

  const from = location.pathname;

  useEffect(() => {
    let cancelled = false;
    void apiGet<Partial<Engagement>>(`/blogs/${slug}/engagement`)
      .then((payload) => {
        if (!cancelled) {
          setEngagement(asEngagement(payload));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setEngagement(emptyEngagement);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  async function toggleLike() {
    if (!user || pending) {
      return;
    }
    setPending("like");
    try {
      const payload = await apiPost<{ liked: boolean; likeCount: number }>(`/blogs/${slug}/like`);
      setEngagement((current) => ({
        ...current,
        liked: payload.liked,
        likeCount: payload.likeCount,
      }));
    } catch {
      // Keep the last known counts if the toggle fails.
    } finally {
      setPending("");
    }
  }

  async function toggleBookmark() {
    if (!user || pending) {
      return;
    }
    setPending("save");
    try {
      const payload = await apiPost<{ bookmarked: boolean }>(`/blogs/${slug}/bookmark`);
      setEngagement((current) => ({ ...current, bookmarked: payload.bookmarked }));
    } catch {
      // Keep the last known state if the toggle fails.
    } finally {
      setPending("");
    }
  }

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      return;
    }
    const form = event.currentTarget;
    const body = String(new FormData(form).get("body") ?? "");
    resetErrors();
    if (applyFieldErrors(collectErrors({ body: validateMessage(body, 8) }))) {
      return;
    }
    setPending("comment");
    try {
      const payload = await apiPost<{ comment: BlogComment }>(`/blogs/${slug}/comments`, { body });
      form.reset();
      setEngagement((current) => ({
        ...current,
        comments: [...current.comments, payload.comment],
      }));
    } catch (caught) {
      applyCaughtError(caught, "Could not post comment");
    } finally {
      setPending("");
    }
  }

  async function removeComment(id: string) {
    setPending(id);
    try {
      await apiDelete(`/blogs/comments/${id}`);
      setEngagement((current) => ({
        ...current,
        comments: current.comments.filter((item) => item.id !== id),
      }));
    } catch {
      // Leave the comment visible if delete fails.
    } finally {
      setPending("");
    }
  }

  const { comments, likeCount, liked, bookmarked } = engagement;

  return (
    <section className="border-b border-line py-14 sm:py-16">
      <Container className="max-w-3xl space-y-10">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={!user || pending === "like"}
            className={`inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
              liked
                ? "bg-ink text-paper hover:bg-accent"
                : "border border-line bg-surface text-ink hover:border-accent/40"
            }`}
            onClick={() => void toggleLike()}
          >
            {liked ? "Liked" : "Like"}
            {likeCount > 0 ? ` · ${likeCount}` : ""}
          </button>
          <button
            type="button"
            disabled={!user || pending === "save"}
            className={`inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
              bookmarked
                ? "bg-ink text-paper hover:bg-accent"
                : "border border-line bg-surface text-ink hover:border-accent/40"
            }`}
            onClick={() => void toggleBookmark()}
          >
            {bookmarked ? "Saved" : "Save"}
          </button>
          <p className="text-sm text-muted">
            {likeCount === 1 ? "1 like" : `${likeCount} likes`}
          </p>
        </div>

        <div>
          <h2 className="font-display text-3xl tracking-tight text-ink">Comments</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Signed-in readers can leave a note. Comments appear as soon as they are posted.
          </p>

          {comments.length === 0 ? (
            <p className="mt-6 text-sm text-muted">No comments yet.</p>
          ) : (
            <ul className="mt-6 space-y-4">
              {comments.map((comment) => (
                <li key={comment.id} className="rounded-[1.5rem] border border-line bg-surface p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-ink">{comment.author}</p>
                      <p className="text-xs text-muted">{formatBlogDate(comment.createdAt)}</p>
                    </div>
                    {user && (user.id === comment.userId || user.role === "ADMIN") ? (
                      <button
                        type="button"
                        className="cursor-pointer text-sm text-accent hover:text-accent-dark disabled:opacity-60"
                        disabled={pending === comment.id}
                        onClick={() => void removeComment(comment.id)}
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                  <p className="mt-3 text-sm leading-7 text-ink-soft">{comment.body}</p>
                </li>
              ))}
            </ul>
          )}

          {authLoading ? null : user ? (
            <form className="mt-8 space-y-4" onSubmit={submitComment} noValidate>
              <AuthError>{formError}</AuthError>
              <FormTextArea
                label="Comment"
                name="body"
                rows={4}
                hint="At least 8 characters"
                error={fieldErrors.body}
                onChange={() => clearField("body")}
                onBlur={(event) => setFieldError("body", validateMessage(event.target.value, 8))}
              />
              <button
                type="submit"
                disabled={pending === "comment"}
                className="inline-flex min-h-11 cursor-pointer items-center rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper hover:bg-accent disabled:opacity-60"
              >
                Post comment
              </button>
            </form>
          ) : (
            <p className="mt-8 text-sm text-ink-soft">
              <Link to="/login" state={{ from }} className="font-medium text-accent hover:text-accent-dark">
                Sign in
              </Link>{" "}
              or{" "}
              <Link
                to="/register"
                state={{ from }}
                className="font-medium text-accent hover:text-accent-dark"
              >
                create an account
              </Link>{" "}
              to like, save, and comment.
            </p>
          )}
        </div>
      </Container>
    </section>
  );
}
