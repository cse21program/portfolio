import { useCallback, useEffect, useState } from "react";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import type { EligibleReviewProduct, Review, ReviewKind, ReviewStatus, ReviewSummary } from "@/types/review";

export function useProductReviews(kind: ReviewKind, slug: string) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<ReviewSummary>({ count: 0, average: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void apiGet<{ reviews: Review[]; summary: ReviewSummary }>(
      `/reviews?kind=${encodeURIComponent(kind)}&slug=${encodeURIComponent(slug)}`,
    )
      .then((payload) => {
        if (cancelled) {
          return;
        }
        setReviews(payload.reviews ?? []);
        setSummary(payload.summary ?? { count: 0, average: 0 });
      })
      .catch(() => {
        if (!cancelled) {
          setReviews([]);
          setSummary({ count: 0, average: 0 });
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [kind, slug]);

  return { reviews, summary, loading };
}

export function useMyReviews(enabled = true) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [products, setProducts] = useState<EligibleReviewProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    if (!enabled) {
      setReviews([]);
      setProducts([]);
      setError("");
      setLoading(false);
      return;
    }
    try {
      const [mine, eligible] = await Promise.all([
        apiGet<{ reviews: Review[] }>("/reviews/mine", { cache: "no-store" }),
        apiGet<{ products: EligibleReviewProduct[] }>("/reviews/eligible", { cache: "no-store" }),
      ]);
      setReviews(mine.reviews ?? []);
      setProducts(eligible.products ?? []);
      setError("");
    } catch {
      setReviews([]);
      setProducts([]);
      setError("Could not load reviews");
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const createReview = useCallback(
    async (input: { kind: ReviewKind; slug: string; rating: number; comment: string }) => {
      await apiPost("/reviews", input);
      await reload();
    },
    [reload],
  );

  const removeReview = useCallback(
    async (id: string) => {
      await apiDelete(`/reviews/${id}`);
      await reload();
    },
    [reload],
  );

  return { reviews, products, loading, error, reload, createReview, removeReview };
}

export function useAdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      const payload = await apiGet<{ reviews: Review[] }>("/reviews/admin", { cache: "no-store" });
      setReviews(payload.reviews ?? []);
      setError("");
    } catch {
      setError("Could not load reviews");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const updateReview = useCallback(async (id: string, input: { status?: ReviewStatus; adminNote?: string }) => {
    const payload = await apiPatch<{ review: Review }>(`/reviews/admin/${id}`, input);
    setReviews((current) => current.map((item) => (item.id === payload.review.id ? payload.review : item)));
    return payload.review;
  }, []);

  return { reviews, loading, error, reload, updateReview };
}
