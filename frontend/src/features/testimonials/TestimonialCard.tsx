import { attribution, type Testimonial } from "@/types/testimonials";

export function TestimonialCard({ item }: { item: Testimonial }) {
  const byline = attribution(item);

  return (
    <blockquote className="relative overflow-hidden rounded-3xl border border-line bg-surface p-6">
      <span className="pointer-events-none absolute -top-3 right-4 font-display text-7xl text-accent/15">
        “
      </span>
      <div className="relative flex items-start gap-4">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt=""
            className="h-12 w-12 shrink-0 rounded-full border border-line object-cover"
          />
        ) : (
          <span
            className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-ink font-display text-lg text-paper"
            aria-hidden="true"
          >
            {item.name.trim().slice(0, 1) || "“"}
          </span>
        )}
        <div className="min-w-0">
          <p className="text-sm leading-7 text-ink-soft">{item.comment}</p>
          <footer className="mt-5 text-sm text-ink">
            {item.name}
            {byline ? <span className="block text-muted">{byline}</span> : null}
            <span className="mt-1 block text-xs tracking-[0.14em] text-muted uppercase">
              {item.rating} / 5
            </span>
          </footer>
        </div>
      </div>
    </blockquote>
  );
}
