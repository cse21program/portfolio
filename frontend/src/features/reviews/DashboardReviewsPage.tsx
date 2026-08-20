import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormSelect, FormTextArea } from "@/components/ui/FormField";
import { AuthError } from "@/features/auth/AuthForm";
import { StarRating } from "@/features/reviews/StarRating";
import { useMyReviews } from "@/features/reviews/useReviews";
import { useFormErrors } from "@/lib/useFormErrors";
import { collectErrors, validateComment } from "@/lib/validation";
import {
  formatReviewDate,
  reviewKindLabel,
  reviewStatusLabel,
  type ReviewKind,
} from "@/types/review";

function productKey(kind: string, slug: string) {
  return `${kind}:${slug}`;
}

export function DashboardReviewsPage() {
  const { reviews, products, loading, error, createReview, removeReview } = useMyReviews();
  const [kindSlug, setKindSlug] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [pending, setPending] = useState("");
  const { fieldErrors, formError, resetErrors, applyFieldErrors, applyCaughtError, clearField } =
    useFormErrors<"product" | "comment">();

  useEffect(() => {
    if (kindSlug || products.length !== 1) {
      return;
    }
    const item = products[0];
    if (item) {
      setKindSlug(productKey(item.kind, item.slug));
    }
  }, [kindSlug, products]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const [kind, ...rest] = kindSlug.split(":");
    const slug = rest.join(":");
    resetErrors();
    if (
      applyFieldErrors(
        collectErrors({
          product: !kind || !slug ? "Choose a purchase to review" : undefined,
          comment: validateComment(comment),
        }),
      )
    ) {
      return;
    }
    setPending("create");
    try {
      await createReview({ kind: kind as ReviewKind, slug, rating, comment: comment.trim() });
      setComment("");
      setKindSlug("");
      setRating(5);
    } catch (caught) {
      applyCaughtError(caught, "Could not submit that review");
    } finally {
      setPending("");
    }
  }

  async function remove(id: string) {
    resetErrors();
    setPending(id);
    try {
      await removeReview(id);
    } catch (caught) {
      applyCaughtError(caught, "Could not remove that review");
    } finally {
      setPending("");
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs tracking-[0.16em] text-muted uppercase">Account</p>
        <h1 className="mt-2 font-display text-3xl text-ink">Reviews</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Rate a paid course, tutorial, or service package. Studio publishes verified reviews on the public
          page.
        </p>
      </div>

      {error ? <AuthError>{error}</AuthError> : null}
      {formError ? <AuthError>{formError}</AuthError> : null}

      {products.length > 0 ? (
        <form className="space-y-5 rounded-[1.75rem] border border-line bg-surface p-6" onSubmit={handleSubmit} noValidate>
          <FormSelect
            label="Purchase"
            name="product"
            value={kindSlug}
            error={fieldErrors.product}
            onChange={(event) => {
              setKindSlug(event.target.value);
              clearField("product");
            }}
          >
            <option value="">Choose a purchase</option>
            {products.map((item) => (
              <option key={productKey(item.kind, item.slug)} value={productKey(item.kind, item.slug)}>
                {reviewKindLabel(item.kind)} · {item.title}
              </option>
            ))}
          </FormSelect>
          <div>
            <p className="text-sm text-ink">Rating</p>
            <div className="mt-2">
              <StarRating value={rating} onChange={setRating} />
            </div>
          </div>
          <FormTextArea
            label="Comment"
            name="comment"
            rows={4}
            value={comment}
            error={fieldErrors.comment}
            hint={fieldErrors.comment ? undefined : "At least 20 characters. Studio reads this before it goes public."}
            onChange={(event) => {
              setComment(event.target.value);
              clearField("comment");
            }}
          />
          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition hover:bg-accent disabled:opacity-60"
            disabled={pending === "create"}
          >
            {pending === "create" ? "Submitting…" : "Submit review"}
          </button>
        </form>
      ) : null}

      {loading && reviews.length === 0 && products.length === 0 ? (
        <div className="h-40 animate-pulse rounded-[1.75rem] bg-paper-muted" />
      ) : reviews.length === 0 && products.length === 0 ? (
        <EmptyState
          title="No reviews yet"
          description="Paid checkouts can be reviewed from this page after payment lands."
          action={{ label: "View purchases", to: "/dashboard/purchases" }}
        />
      ) : reviews.length === 0 ? (
        <p className="text-sm text-ink-soft">You have a purchase waiting for a review.</p>
      ) : (
        <ul className="space-y-3">
          {reviews.map((review) => (
            <li key={review.id} className="rounded-[1.75rem] border border-line bg-surface p-6">
              <p className="text-xs tracking-[0.16em] text-muted uppercase">
                {reviewStatusLabel(review.status)} · {reviewKindLabel(review.kind)} · {formatReviewDate(review.createdAt)}
              </p>
              <h2 className="mt-2 font-display text-2xl text-ink">{review.title}</h2>
              <div className="mt-3">
                <StarRating value={review.rating} />
              </div>
              <p className="mt-3 text-sm leading-7 text-ink-soft">{review.comment}</p>
              <div className="mt-4 flex flex-wrap gap-4">
                <Link to={review.href} className="text-sm font-medium text-accent hover:text-accent-dark">
                  Open page →
                </Link>
                {review.status !== "approved" ? (
                  <button
                    type="button"
                    className="text-sm font-medium text-accent hover:text-accent-dark disabled:opacity-60"
                    disabled={pending === review.id}
                    onClick={() => void remove(review.id)}
                  >
                    {pending === review.id ? "Removing…" : "Remove"}
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
