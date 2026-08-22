import { ButtonLink } from "@/components/ui/ButtonLink";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { TestimonialCard } from "@/features/testimonials/TestimonialCard";
import { useTestimonials } from "@/features/testimonials/useTestimonials";

function recordKey(item: { id?: string; name: string }, index: number) {
  return item.id ?? `${item.name}-${index}`;
}

export function TestimonialsPage() {
  const { testimonials } = useTestimonials();

  return (
    <>
      <section className="relative overflow-hidden border-b border-line bg-surface">
        <div className="pointer-events-none absolute -top-28 left-1/3 h-80 w-80 rounded-full bg-accent/15 blur-3xl" />
        <div className="pointer-events-none absolute right-0 bottom-0 h-56 w-56 rounded-full bg-paper-muted blur-3xl" />
        <Container className="relative py-14 sm:py-20">
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/90 px-3 py-1 text-xs tracking-[0.16em] text-accent uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Testimonials
          </p>
          <h1 className="mt-5 font-display text-4xl tracking-tight text-ink sm:text-5xl lg:text-6xl">
            What people say
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-ink-soft">
            Quotes from clients, students, and collaborators. Studio can write these by hand or
            promote an approved review.
          </p>
          <div className="mt-8">
            <ButtonLink to="/contact" variant="secondary">
              Start a brief
            </ButtonLink>
          </div>
        </Container>
      </section>

      <section className="border-b border-line bg-paper-muted/35 py-12 sm:py-16">
        <Container>
          {testimonials.length === 0 ? (
            <EmptyState
              title="No testimonials published yet"
              description="Quotes will appear here once they are added in Studio."
              action={{ label: "Back home", to: "/" }}
            />
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {testimonials.map((item, index) => (
                <TestimonialCard key={recordKey(item, index)} item={item} />
              ))}
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
