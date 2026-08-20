import { useMemo, useState } from "react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { ContentCard } from "@/components/ui/ContentCard";
import { FilterChip, FilterGroups, FilterRow, FilterSearch, FilterToolbar } from "@/components/ui/FilterBar";
import { featuredServices, publishedServices, useServices } from "@/features/services/useServices";
import {
  catalogPriceBandLabels,
  catalogPriceBandsOf,
  catalogSortLabels,
  catalogYears,
  paidCents,
  sortCatalogItems,
  type CatalogSort,
} from "@/lib/catalogFilters";
import { matchesServiceFilters } from "@/types/services";

export function ServicesPage() {
  const { services, loading } = useServices();
  const published = publishedServices(services);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [technology, setTechnology] = useState("");
  const [year, setYear] = useState("");
  const [price, setPrice] = useState("");
  const [sort, setSort] = useState<CatalogSort>("");
  const categories = useMemo(
    () => [...new Set(published.map((item) => item.category).filter((item): item is string => Boolean(item)))],
    [published],
  );
  const technologies = useMemo(
    () => [...new Set(published.flatMap((item) => item.technologies).filter(Boolean))],
    [published],
  );
  const years = useMemo(() => catalogYears(published.map((item) => item.publishedAt ?? "")), [published]);
  const prices = useMemo(
    () =>
      catalogPriceBandsOf(published.map((item) => ({ free: false, cents: paidCents(false, item.startingPrice) }))),
    [published],
  );
  const filtering = Boolean(query.trim() || category || technology || year || price || sort);
  const visible = sortCatalogItems(
    published.filter((item) => matchesServiceFilters(item, { query, category, technology, year, price })),
    sort,
    (item) => item.publishedAt ?? "",
    (item) => (item.featured ? 100 : 0),
  );
  const lead = !filtering ? (featuredServices(visible)[0] ?? visible[0]) : undefined;
  const grid = lead ? visible.filter((item) => item.slug !== lead.slug) : visible;
  const resultLabel = filtering
    ? `${visible.length} of ${published.length} ${published.length === 1 ? "service" : "services"}`
    : `${visible.length} ${visible.length === 1 ? "service" : "services"}`;

  function clearFilters() {
    setQuery("");
    setCategory("");
    setTechnology("");
    setYear("");
    setPrice("");
    setSort("");
  }

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
          <FilterToolbar>
            <FilterSearch
              id="service-search"
              label="Search services"
              value={query}
              placeholder="Title, category, or technology"
              resultLabel={resultLabel}
              filtering={filtering}
              onChange={setQuery}
              onClear={clearFilters}
            />
            {categories.length > 1 ||
            technologies.length > 1 ||
            years.length > 1 ||
            prices.length > 0 ||
            published.length > 1 ? (
              <FilterGroups count={[sort, year, category, technology, price].filter(Boolean).length}>
                {published.length > 1 ? (
                  <FilterRow label="Sort" groupLabel="Sort services">
                    <FilterChip label="Listed" active={!sort} onClick={() => setSort("")} />
                    <FilterChip
                      label={catalogSortLabels.newest}
                      active={sort === "newest"}
                      onClick={() => setSort("newest")}
                    />
                    <FilterChip
                      label={catalogSortLabels.popular}
                      active={sort === "popular"}
                      onClick={() => setSort("popular")}
                    />
                  </FilterRow>
                ) : null}
                {years.length > 1 ? (
                  <FilterRow label="Date" groupLabel="Filter by year">
                    <FilterChip label="All years" active={!year} onClick={() => setYear("")} />
                    {years.map((item) => (
                      <FilterChip
                        key={item}
                        label={item}
                        active={year === item}
                        onClick={() => setYear(item)}
                      />
                    ))}
                  </FilterRow>
                ) : null}
                {categories.length > 1 ? (
                  <FilterRow label="Category" groupLabel="Filter by category">
                    <FilterChip label="All" active={!category} onClick={() => setCategory("")} />
                    {categories.map((item) => (
                      <FilterChip
                        key={item}
                        label={item}
                        active={category === item}
                        onClick={() => setCategory(item)}
                      />
                    ))}
                  </FilterRow>
                ) : null}
                {technologies.length > 1 ? (
                  <FilterRow label="Technology" groupLabel="Filter by technology">
                    <FilterChip label="All" active={!technology} onClick={() => setTechnology("")} />
                    {technologies.map((item) => (
                      <FilterChip
                        key={item}
                        label={item}
                        active={technology === item}
                        onClick={() => setTechnology(item)}
                      />
                    ))}
                  </FilterRow>
                ) : null}
                {prices.length > 0 ? (
                  <FilterRow label="Price" groupLabel="Filter by price">
                    <FilterChip label="All prices" active={!price} onClick={() => setPrice("")} />
                    {prices.map((item) => (
                      <FilterChip
                        key={item}
                        label={catalogPriceBandLabels[item]}
                        active={price === item}
                        onClick={() => setPrice(item)}
                      />
                    ))}
                  </FilterRow>
                ) : null}
              </FilterGroups>
            ) : null}
          </FilterToolbar>

          {loading && published.length === 0 ? (
            <div className="grid gap-5 md:grid-cols-2">
              <div className="h-64 animate-pulse rounded-[1.75rem] bg-surface" />
              <div className="h-64 animate-pulse rounded-[1.75rem] bg-surface" />
            </div>
          ) : visible.length === 0 ? (
            <EmptyState
              title={filtering ? "No services match" : "No services yet"}
              description={
                filtering
                  ? "Try another search, category, or technology."
                  : "Offerings will appear here once they are published from Studio."
              }
              action={
                filtering ? { label: "Clear filters", to: "/services" } : { label: "Back home", to: "/" }
              }
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
