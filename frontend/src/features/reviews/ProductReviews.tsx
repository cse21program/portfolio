import { Link } from "react-router-dom";
import { StarRating } from "@/features/reviews/StarRating";
import { useProductReviews } from "@/features/reviews/useReviews";
import { formatReviewAverage, formatReviewDate, type ReviewKind } from "@/types/review";

export function ProductReviews({ kind, slug }: { kind: ReviewKind; slug: string }) {
  const { reviews, summary, loading } = useProductReviews(kind, slug);

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl tracking-tight text-ink">Reviews</h2>
          <p className="mt-2 text-sm text-ink-soft">
            {summary.count === 0
              ? "Verified purchasers can rate this after checkout."
              : `${formatReviewAverage(summary.average)} / 5 from ${summary.count} ${summary.count === 1 ? "review" : "reviews"}.`}
          </p>
        </div>
        <Link to="/dashboard/reviews" className="text-sm font-medium text-accent hover:text-accent-dark">
          Write a review →
        </Link>
      </div>

      {loading ? (
        <div className="mt-6 h-28 animate-pulse rounded-[1.75rem] bg-paper-muted" />
      ) : reviews.length === 0 ? (
        <p className="mt-6 rounded-[1.75rem] border border-dashed border-line bg-paper/60 px-6 py-8 text-sm text-ink-soft">
          No published reviews yet.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {reviews.map((review) => (
            <li key={review.id} className="rounded-[1.75rem] border border-line bg-surface p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-ink">{review.authorName}</p>
                  <p className="mt-1 text-xs tracking-[0.16em] text-muted uppercase">
                    {review.verified ? "Verified purchase" : "Review"} · {formatReviewDate(review.createdAt)}
                  </p>
                </div>
                <StarRating value={review.rating} />
              </div>
              <p className="mt-4 text-sm leading-7 text-ink-soft">{review.comment}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
