import { useMemo, useState } from "react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { ContentCard } from "@/components/ui/ContentCard";
import { featuredServices, publishedServices, useServices } from "@/features/services/useServices";

export function ServicesPage() {
  const { services, loading } = useServices();
  const published = publishedServices(services);
  const [category, setCategory] = useState("All");
  const categories = useMemo(
    () => ["All", ...new Set(published.map((item) => item.category).filter((item): item is string => Boolean(item)))],
    [published],
  );
  const visible = published.filter((item) => category === "All" || item.category === category);
  const lead = category === "All" ? (featuredServices(visible)[0] ?? visible[0]) : undefined;
  const grid = lead ? visible.filter((item) => item.slug !== lead.slug) : visible;

  return (
    <>
      <section className="relative overflow-hidden border-b border-line bg-surface">
        <div className="pointer-events-none absolute -top-28 left-1/3 h-80 w-80 rounded-full bg-accent/15 blur-3xl" />
        <div className="pointer-events-none absolute right-0 bottom-0 h-56 w-56 rounded-full bg-paper-muted blur-3xl" />
        <Container className="relative py-14 sm:py-20">
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/90 px-3 py-1 text-xs tracking-[0.16em] text-accent uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Services
          </p>
          <h1 className="mt-5 font-display text-4xl tracking-tight text-ink sm:text-5xl lg:text-6xl">
            Professional work
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-ink-soft">
            Backend, DevOps, reviews, and mentoring. Request a service with your requirements. Checkout
            comes later; this is the working inquiry and order path.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <ButtonLink to="/contact" variant="secondary">
              Prefer email? Contact
            </ButtonLink>
            <p className="text-sm text-muted">
              {published.length} {published.length === 1 ? "published service" : "published services"}
            </p>
          </div>
        </Container>
      </section>

      <section className="border-b border-line bg-paper-muted/35 py-12 sm:py-16">
        <Container className="space-y-8">
          {categories.length > 2 ? (
            <div className="flex flex-wrap items-center gap-2">
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={category === item}
                  className={`cursor-pointer rounded-full px-4 py-2 text-sm transition ${
                    category === item
                      ? "bg-ink text-paper"
                      : "border border-line bg-surface text-ink hover:border-accent"
                  }`}
                  onClick={() => setCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          ) : null}

          {loading && published.length === 0 ? (
            <div className="grid gap-5 md:grid-cols-2">
              <div className="h-64 animate-pulse rounded-[1.75rem] bg-surface" />
              <div className="h-64 animate-pulse rounded-[1.75rem] bg-surface" />
            </div>
          ) : visible.length === 0 ? (
            <EmptyState
              title="No services yet"
              description="Offerings will appear here once they are published from Studio."
              action={{ label: "Back home", to: "/" }}
            />
          ) : (
            <div className="space-y-5">
              {lead ? (
                <ContentCard
                  featured
                  to={`/services/${lead.slug}`}
                  eyebrow={lead.pricingType}
                  title={lead.title}
                  description={lead.shortDescription}
                  meta={`${lead.startingPrice} · ${lead.deliveryTime}`}
                  image={lead.thumbnailUrl}
                  tags={lead.technologies.slice(0, 4)}
                />
              ) : null}
              {grid.length > 0 ? (
                <div className="grid gap-5 md:grid-cols-2">
                  {grid.map((service) => (
                    <ContentCard
                      key={service.slug}
                      to={`/services/${service.slug}`}
                      eyebrow={service.pricingType}
                      title={service.title}
                      description={service.shortDescription}
                      meta={`${service.startingPrice} · ${service.deliveryTime}`}
                      image={service.thumbnailUrl}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
