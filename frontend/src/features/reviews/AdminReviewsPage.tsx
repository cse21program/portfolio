import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FilterChip, FilterGroups, FilterRow, FilterSearch, FilterToolbar } from "@/components/ui/FilterBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormTextArea } from "@/components/ui/FormField";
import { AuthError } from "@/features/auth/AuthForm";
import { StarRating } from "@/features/reviews/StarRating";
import { useAdminReviews } from "@/features/reviews/useReviews";
import {
  formatReviewDate,
  reviewKindLabel,
  reviewStatusLabel,
  type ReviewStatus,
} from "@/types/review";

type StatusFilter = "all" | ReviewStatus;

function matchesFilter(status: ReviewStatus, filter: StatusFilter) {
  if (filter === "all") {
    return true;
  }
  return status === filter;
}

export function AdminReviewsPage() {
  const { reviews, loading, error, updateReview } = useAdminReviews();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("pending");
  const [pending, setPending] = useState("");
  const [updateError, setUpdateError] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});

  const pendingCount = reviews.filter((item) => item.status === "pending").length;
  const publishedCount = reviews.filter((item) => item.status === "approved").length;

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return reviews.filter((item) => {
      if (!matchesFilter(item.status, filter)) {
        return false;
      }
      if (!needle) {
        return true;
      }
      const haystack = [
        item.title,
        item.comment,
        item.authorName,
        item.user?.email ?? "",
        item.kind,
        item.status,
        item.adminNote ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [filter, query, reviews]);

  async function setStatus(id: string, status: ReviewStatus) {
    setUpdateError("");
    setPending(`${id}:${status}`);
    try {
      await updateReview(id, { status, adminNote: notes[id] });
    } catch {
      setUpdateError("Could not update that review");
    } finally {
      setPending("");
    }
  }

  async function saveNote(id: string) {
    setUpdateError("");
    setPending(`${id}:note`);
    try {
      await updateReview(id, { adminNote: notes[id] ?? "" });
    } catch {
      setUpdateError("Could not save that note");
    } finally {
      setPending("");
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs tracking-[0.16em] text-accent uppercase">Studio</p>
        <h1 className="mt-2 font-display text-4xl text-ink">Reviews</h1>
        <p className="mt-3 max-w-2xl text-ink-soft">
          Verified purchasers submit ratings for courses, tutorials, and paid service packages. Approve a
          review to publish it on the product page, then promote it from{" "}
          <Link className="text-accent hover:text-accent-dark" to="/admin/testimonials">
            Testimonials
          </Link>
          .
        </p>
        <dl className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-line bg-surface px-4 py-3">
            <dt className="text-xs tracking-[0.16em] text-muted uppercase">Awaiting</dt>
            <dd className="mt-1 font-display text-2xl text-ink">{pendingCount}</dd>
          </div>
          <div className="rounded-2xl border border-line bg-surface px-4 py-3">
            <dt className="text-xs tracking-[0.16em] text-muted uppercase">Published</dt>
            <dd className="mt-1 font-display text-2xl text-ink">{publishedCount}</dd>
          </div>
          <div className="rounded-2xl border border-line bg-surface px-4 py-3">
            <dt className="text-xs tracking-[0.16em] text-muted uppercase">All</dt>
            <dd className="mt-1 font-display text-2xl text-ink">{reviews.length}</dd>
          </div>
        </dl>
      </div>

      {error ? <AuthError>{error}</AuthError> : null}
      {updateError ? <AuthError>{updateError}</AuthError> : null}

      {reviews.length > 0 ? (
        <FilterToolbar>
          <FilterSearch
            id="review-search"
            label="Search reviews"
            value={query}
            placeholder="Name, email, product, or comment"
            resultLabel={`${visible.length} ${visible.length === 1 ? "review" : "reviews"}`}
            filtering={query.trim().length > 0 || filter !== "pending"}
            onChange={setQuery}
            onClear={() => {
              setQuery("");
              setFilter("pending");
            }}
          />
          <FilterGroups count={filter !== "pending" ? 1 : 0}>
            <FilterRow label="Status" groupLabel="Filter by status">
              <FilterChip label="Awaiting" active={filter === "pending"} onClick={() => setFilter("pending")} />
              <FilterChip label="Published" active={filter === "approved"} onClick={() => setFilter("approved")} />
              <FilterChip
                label="Not published"
                active={filter === "rejected"}
                onClick={() => setFilter("rejected")}
              />
              <FilterChip label="All" active={filter === "all"} onClick={() => setFilter("all")} />
            </FilterRow>
          </FilterGroups>
        </FilterToolbar>
      ) : null}

      {loading && reviews.length === 0 ? (
        <div className="h-40 animate-pulse rounded-[1.75rem] bg-paper-muted" />
      ) : reviews.length === 0 ? (
        <EmptyState
          title="No reviews yet"
          description="Verified checkout purchases can leave a rating from the customer account."
        />
      ) : visible.length === 0 ? (
        <EmptyState title="No reviews in this view" description="Try another status or clear the search." />
      ) : (
        <ul className="space-y-3">
          {visible.map((review) => {
            const note = notes[review.id] ?? review.adminNote ?? "";
            const busy = pending.startsWith(`${review.id}:`);
            return (
              <li key={review.id} className="rounded-[1.75rem] border border-line bg-surface p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs tracking-[0.16em] text-muted uppercase">
                      {reviewStatusLabel(review.status)} · {reviewKindLabel(review.kind)} ·{" "}
                      {formatReviewDate(review.createdAt)}
                    </p>
                    <h2 className="mt-2 font-display text-2xl text-ink">{review.title}</h2>
                    <p className="mt-2 text-sm text-ink-soft">
                      {review.user?.name || review.authorName} · {review.user?.email}
                    </p>
                    <div className="mt-3">
                      <StarRating value={review.rating} />
                    </div>
                    <p className="mt-3 text-sm leading-7 text-ink">{review.comment}</p>
                  </div>
                  <Link to={review.href} className="text-sm font-medium text-accent hover:text-accent-dark">
                    Open page →
                  </Link>
                </div>
                <div className="mt-5 space-y-4 border-t border-line pt-5">
                  <FormTextArea
                    label="Studio note"
                    name={`note-${review.id}`}
                    rows={2}
                    hint="Internal. The customer does not see this."
                    value={note}
                    onChange={(event) => setNotes((current) => ({ ...current, [review.id]: event.target.value }))}
                  />
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      className="inline-flex min-h-11 items-center justify-center rounded-full border border-line bg-surface px-4 text-sm font-medium text-ink transition hover:border-accent disabled:opacity-60"
                      disabled={busy || note.trim() === (review.adminNote ?? "").trim()}
                      onClick={() => void saveNote(review.id)}
                    >
                      {pending === `${review.id}:note` ? "Saving…" : "Save note"}
                    </button>
                    {review.status !== "approved" ? (
                      <button
                        type="button"
                        className="text-sm font-medium text-accent hover:text-accent-dark disabled:opacity-60"
                        disabled={busy}
                        onClick={() => void setStatus(review.id, "approved")}
                      >
                        {pending === `${review.id}:approved` ? "Publishing…" : "Publish"}
                      </button>
                    ) : null}
                    {review.status !== "rejected" ? (
                      <button
                        type="button"
                        className="text-sm font-medium text-accent hover:text-accent-dark disabled:opacity-60"
                        disabled={busy}
                        onClick={() => void setStatus(review.id, "rejected")}
                      >
                        {pending === `${review.id}:rejected` ? "Hiding…" : "Keep private"}
                      </button>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
