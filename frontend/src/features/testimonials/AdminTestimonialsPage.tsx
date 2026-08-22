import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { FormField, FormTextArea } from "@/components/ui/FormField";
import { AuthError } from "@/features/auth/AuthForm";
import { LogoPicker } from "@/features/experience/LogoPicker";
import { StarRating } from "@/features/reviews/StarRating";
import { apiGet, apiPost, apiPut } from "@/lib/api";
import { useFormErrors } from "@/lib/useFormErrors";
import { collectErrors } from "@/lib/validation";
import { reviewKindLabel } from "@/types/review";
import {
  emptyTestimonial,
  normalizeTestimonialList,
  type Testimonial,
  type TestimonialSource,
} from "@/types/testimonials";

type TestimonialFields = "testimonials";

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-5 rounded-3xl border border-line bg-surface p-6 shadow-[0_1px_0_rgb(26_22_18/0.04)] sm:p-7">
      <div>
        <h2 className="font-display text-2xl text-ink">{title}</h2>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
      {children}
    </section>
  );
}

function readyTestimonials(items: Testimonial[]) {
  return items.map((item, index) => ({
    id: item.id,
    name: item.name.trim(),
    position: item.position.trim(),
    company: item.company.trim(),
    imageUrl: item.imageUrl?.trim() || null,
    comment: item.comment.trim(),
    rating: item.rating,
    featured: item.featured === true,
    reviewId: item.reviewId?.trim() || null,
    sortOrder: index,
  }));
}

function listError(items: Testimonial[]) {
  const reviewIds = items.map((item) => item.reviewId?.trim()).filter(Boolean);
  if (new Set(reviewIds).size !== reviewIds.length) {
    return "Each review can become only one testimonial";
  }
  for (const [index, item] of items.entries()) {
    const label = `Quote ${index + 1}`;
    if (item.name.trim().length < 2) {
      return `${label}: name must be at least 2 characters`;
    }
    if (item.comment.trim().length < 12) {
      return `${label}: comment must be at least 12 characters`;
    }
  }
}

export function AdminTestimonialsPage() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [sources, setSources] = useState<TestimonialSource[]>([]);
  const [openIndex, setOpenIndex] = useState(-1);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [promoting, setPromoting] = useState("");
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const { fieldErrors, formError, resetErrors, applyFieldErrors, applyCaughtError } =
    useFormErrors<TestimonialFields>();

  useEffect(() => {
    void apiGet<{ testimonials: Testimonial[]; sources: TestimonialSource[] }>("/testimonials/admin", {
      cache: "no-store",
    })
      .then((payload) => {
        setItems(normalizeTestimonialList(payload.testimonials));
        setSources(payload.sources);
      })
      .catch((caught: unknown) => {
        applyCaughtError(caught, "Could not load testimonials");
      })
      .finally(() => setLoading(false));
  }, [applyCaughtError]);

  function patch(index: number, patchValue: Partial<Testimonial>) {
    setItems((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patchValue } : item)),
    );
    setDirty(true);
    setSaved(false);
  }

  function move(index: number, offset: number) {
    const nextIndex = index + offset;
    setItems((current) => {
      if (nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }
      const next = [...current];
      const [removed] = next.splice(index, 1);
      next.splice(nextIndex, 0, removed!);
      return next;
    });
    setOpenIndex((current) => {
      if (nextIndex < 0 || nextIndex >= items.length) {
        return current;
      }
      if (current === index) {
        return nextIndex;
      }
      if (current === nextIndex) {
        return index;
      }
      return current;
    });
    setDirty(true);
    setSaved(false);
  }

  async function promote(source: TestimonialSource) {
    resetErrors();
    setPromoting(source.reviewId);
    try {
      const payload = await apiPost<{ testimonial: Testimonial }>("/testimonials/from-review", {
        reviewId: source.reviewId,
      });
      setItems((current) => normalizeTestimonialList([...current, payload.testimonial]));
      setSources((current) => current.filter((item) => item.reviewId !== source.reviewId));
      setOpenIndex(items.length);
      setSaved(true);
    } catch (caught) {
      applyCaughtError(caught, "Could not promote that review");
    } finally {
      setPromoting("");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = readyTestimonials(items);
    resetErrors();
    setSaved(false);
    if (applyFieldErrors(collectErrors({ testimonials: listError(next) }))) {
      return;
    }

    setPending(true);
    try {
      const payload = await apiPut<{ testimonials: Testimonial[] }>("/testimonials", {
        testimonials: next,
      });
      setItems(normalizeTestimonialList(payload.testimonials));
      setDirty(false);
      setSaved(true);
    } catch (caught) {
      applyCaughtError(caught, "Could not save testimonials");
    } finally {
      setPending(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 animate-pulse rounded-full bg-paper-muted" />
        <div className="h-48 animate-pulse rounded-3xl bg-paper-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.18em] text-accent uppercase">Portfolio</p>
          <h1 className="mt-2 font-display text-3xl text-ink">Testimonials</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-ink-soft">
            Curated quotes on Home and the public testimonials page. Write them here, or promote an
            approved review. Featured quotes lead the Home section.
          </p>
        </div>
        <a href="/testimonials" className="text-sm text-accent hover:text-accent-dark">
          View public page →
        </a>
      </div>

      <AuthError>{formError}</AuthError>
      {fieldErrors.testimonials ? (
        <p className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-accent" role="alert">
          {fieldErrors.testimonials}
        </p>
      ) : null}
      {saved ? (
        <p className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink" role="status">
          Testimonials published.
        </p>
      ) : null}

      {sources.length > 0 ? (
        <SectionCard
          title="From approved reviews"
          description="A review becomes a quote you can still edit. Name, rating, and comment come from the review. Add role and photo before you publish if you want them public."
        >
          <ul className="space-y-4">
            {sources.map((source) => (
              <li key={source.reviewId} className="rounded-2xl border border-line bg-paper px-4 py-4">
                <p className="text-xs tracking-[0.14em] text-muted uppercase">
                  {reviewKindLabel(source.kind)} · {source.title}
                </p>
                <p className="mt-2 text-sm leading-6 text-ink-soft">{source.comment}</p>
                <p className="mt-2 text-sm text-ink">
                  {source.name}
                  <span className="text-muted"> · {source.rating} / 5</span>
                </p>
                <button
                  className="mt-3 cursor-pointer text-sm text-accent hover:text-accent-dark disabled:opacity-50"
                  type="button"
                  disabled={Boolean(promoting)}
                  onClick={() => void promote(source)}
                >
                  {promoting === source.reviewId ? "Promoting…" : "Use as testimonial"}
                </button>
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted">
            Moderate reviews first on{" "}
            <Link className="text-accent hover:text-accent-dark" to="/admin/reviews">
              Reviews
            </Link>
            .
          </p>
        </SectionCard>
      ) : null}

      <form className="space-y-6" onSubmit={handleSubmit} noValidate>
        {items.map((item, index) => {
          const expanded = openIndex === index;
          return (
            <SectionCard
              key={item.id ?? `quote-${index}`}
              title={item.name.trim() || `Quote ${index + 1}`}
              description={`${[item.position, item.company].filter(Boolean).join(" · ") || "Attribution"} · ${item.rating} / 5`}
            >
              <div className="flex flex-wrap gap-2">
                <button
                  className="cursor-pointer text-sm text-accent hover:text-accent-dark"
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => setOpenIndex(expanded ? -1 : index)}
                >
                  {expanded ? "Collapse" : "Edit"}
                </button>
                <button
                  className="cursor-pointer text-sm text-muted hover:text-ink disabled:opacity-40"
                  type="button"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  Move up
                </button>
                <button
                  className="cursor-pointer text-sm text-muted hover:text-ink disabled:opacity-40"
                  type="button"
                  disabled={index === items.length - 1}
                  onClick={() => move(index, 1)}
                >
                  Move down
                </button>
                <button
                  className="cursor-pointer text-sm text-muted hover:text-ink"
                  type="button"
                  onClick={() => {
                    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
                    setOpenIndex(-1);
                    setDirty(true);
                    setSaved(false);
                  }}
                >
                  Remove
                </button>
              </div>
              {!expanded ? (
                <p className="text-sm text-muted">
                  {item.featured ? "Featured · " : ""}
                  {item.reviewId ? "From a review · " : ""}
                  {item.comment.trim() || "No comment yet"}
                </p>
              ) : null}
              {expanded ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      label="Name"
                      name={`name-${index}`}
                      value={item.name}
                      onChange={(event) => patch(index, { name: event.target.value })}
                    />
                    <FormField
                      label="Position"
                      name={`position-${index}`}
                      value={item.position}
                      onChange={(event) => patch(index, { position: event.target.value })}
                    />
                    <FormField
                      label="Company"
                      name={`company-${index}`}
                      value={item.company}
                      onChange={(event) => patch(index, { company: event.target.value })}
                    />
                  </div>
                  <div>
                    <p className="mb-2 text-sm text-ink">Rating</p>
                    <StarRating
                      name={`rating-${index}`}
                      value={item.rating}
                      onChange={(value) => patch(index, { rating: value })}
                    />
                  </div>
                  <FormTextArea
                    label="Comment"
                    name={`comment-${index}`}
                    rows={4}
                    maxLength={1200}
                    value={item.comment}
                    onChange={(event) => patch(index, { comment: event.target.value })}
                  />
                  <label className="flex items-center gap-2 text-sm text-ink">
                    <input
                      type="checkbox"
                      checked={item.featured === true}
                      onChange={(event) => patch(index, { featured: event.target.checked })}
                    />
                    Feature on Home
                  </label>
                  <LogoPicker
                    url={item.imageUrl ?? null}
                    disabled={pending}
                    label="Portrait"
                    hint="Optional. A square photo works best."
                    onChange={(url) => patch(index, { imageUrl: url })}
                  />
                </>
              ) : null}
            </SectionCard>
          );
        })}

        <button
          className="cursor-pointer rounded-full border border-line bg-surface px-4 py-2 text-sm text-ink hover:border-accent"
          type="button"
          onClick={() => {
            setItems((current) => [...current, emptyTestimonial(current.length)]);
            setOpenIndex(items.length);
            setDirty(true);
            setSaved(false);
          }}
        >
          Add testimonial
        </button>

        <div className="sticky bottom-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface/95 px-4 py-3 shadow-lg backdrop-blur">
          <p className="text-xs text-muted">{dirty ? "Unsaved changes" : "All changes saved"}</p>
          <button
            className="rounded-full bg-ink px-5 py-2.5 text-sm text-paper hover:bg-accent disabled:opacity-60"
            type="submit"
            disabled={pending}
          >
            {pending ? "Publishing…" : "Publish testimonials"}
          </button>
        </div>
      </form>
    </div>
  );
}
