import { useMemo, useState } from "react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterChip, FilterGroups, FilterRow, FilterSearch, FilterToolbar } from "@/components/ui/FilterBar";
import { TutorialCard } from "@/features/tutorials/tutorialUi";
import { useTutorials } from "@/features/tutorials/useTutorials";
import {
  catalogPriceBandLabels,
  catalogPriceBandsOf,
  catalogSortLabels,
  catalogYears,
  paidCents,
  sortCatalogItems,
  type CatalogSort,
} from "@/lib/catalogFilters";
import { matchesTutorialFilters, publishedTutorials } from "@/types/tutorial";

export function TutorialsPage() {
  const { tutorials, loading } = useTutorials();
  const published = publishedTutorials(tutorials);
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [skill, setSkill] = useState("");
  const [access, setAccess] = useState("");
  const [year, setYear] = useState("");
  const [price, setPrice] = useState("");
  const [sort, setSort] = useState<CatalogSort>("");

  const difficulties = useMemo(
    () => [...new Set(published.map((item) => item.difficulty).filter(Boolean))],
    [published],
  );
  const skills = useMemo(
    () => [...new Set(published.map((item) => item.skill).filter(Boolean))],
    [published],
  );
  const hasFree = published.some((item) => item.free);
  const hasPremium = published.some((item) => !item.free);
  const years = useMemo(() => catalogYears(published.map((item) => item.publishedAt ?? "")), [published]);
  const prices = useMemo(
    () => catalogPriceBandsOf(published.map((item) => ({ free: item.free, cents: paidCents(item.free, item.price) }))),
    [published],
  );
  const filtering = Boolean(query.trim() || difficulty || skill || access || year || price || sort);
  const visible = sortCatalogItems(
    published.filter((item) =>
      matchesTutorialFilters(item, { query, difficulty, skill, access, status: "", year, price }),
    ),
    sort,
    (item) => item.publishedAt ?? "",
    () => 0,
  );
  const lead = !filtering && visible.length > 1 ? visible[0] : undefined;
  const grid = lead ? visible.slice(1) : visible;
  const resultLabel = filtering
    ? `${visible.length} of ${published.length} ${published.length === 1 ? "tutorial" : "tutorials"}`
    : `${visible.length} ${visible.length === 1 ? "tutorial" : "tutorials"}`;

  function clearFilters() {
    setQuery("");
    setDifficulty("");
    setSkill("");
    setAccess("");
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
            Tutorials
          </p>
          <h1 className="mt-5 font-display text-4xl tracking-tight text-ink sm:text-5xl lg:text-6xl">
            Structured walkthroughs
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-ink-soft">
            Longer than a blog post, more linear than a course. Free ones are open; premium is labeled
            but not gated yet.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <ButtonLink to="/courses" variant="secondary">
              Browse courses
            </ButtonLink>
            <p className="text-sm text-muted">
              {published.length} {published.length === 1 ? "published tutorial" : "published tutorials"}
            </p>
          </div>
        </Container>
      </section>

      <section className="border-b border-line bg-paper-muted/35 py-10 sm:py-16">
        <Container className="space-y-8">
          <FilterToolbar>
            <FilterSearch
              id="tutorial-search"
              label="Search tutorials"
              value={query}
              placeholder="Title, skill, or section"
              resultLabel={resultLabel}
              filtering={filtering}
              onChange={setQuery}
              onClear={clearFilters}
            />
            {difficulties.length > 1 ||
            skills.length > 1 ||
            (hasFree && hasPremium) ||
            years.length > 1 ||
            prices.length > 0 ||
            published.length > 1 ? (
              <FilterGroups count={[sort, year, difficulty, skill, access, price].filter(Boolean).length}>
                {published.length > 1 ? (
                  <FilterRow label="Sort" groupLabel="Sort tutorials">
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
                {difficulties.length > 1 ? (
                  <FilterRow label="Difficulty" groupLabel="Filter by difficulty">
                    <FilterChip label="All" active={!difficulty} onClick={() => setDifficulty("")} />
                    {difficulties.map((item) => (
                      <FilterChip
                        key={item}
                        label={item}
                        active={difficulty === item}
                        onClick={() => setDifficulty(item)}
                      />
                    ))}
                  </FilterRow>
                ) : null}
                {skills.length > 1 ? (
                  <FilterRow label="Skill" groupLabel="Filter by skill">
                    <FilterChip label="All skills" active={!skill} onClick={() => setSkill("")} />
                    {skills.map((item) => (
                      <FilterChip
                        key={item}
                        label={item}
                        active={skill === item}
                        onClick={() => setSkill(item)}
                      />
                    ))}
                  </FilterRow>
                ) : null}
                {hasFree && hasPremium ? (
                  <FilterRow label="Access" groupLabel="Filter by access">
                    <FilterChip label="All access" active={!access} onClick={() => setAccess("")} />
                    <FilterChip label="Free" active={access === "free"} onClick={() => setAccess("free")} />
                    <FilterChip
                      label="Premium"
                      active={access === "premium"}
                      onClick={() => setAccess("premium")}
                    />
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
            <div className="space-y-5">
              <div className="h-72 animate-pulse rounded-[1.75rem] bg-surface" />
              <div className="grid gap-5 md:grid-cols-2">
                <div className="h-64 animate-pulse rounded-[1.75rem] bg-surface" />
                <div className="h-64 animate-pulse rounded-[1.75rem] bg-surface" />
              </div>
            </div>
          ) : visible.length === 0 ? (
            <EmptyState
              title="No tutorials match"
              description="Try another search, difficulty, skill, or access filter."
              action={{ label: "Clear filters", to: "/tutorials" }}
            />
          ) : (
            <div className="space-y-5">
              {lead ? <TutorialCard tutorial={lead} featured /> : null}
              {grid.length > 0 ? (
                <div className="grid gap-5 md:grid-cols-2">
                  {grid.map((tutorial) => (
                    <TutorialCard key={tutorial.id ?? tutorial.slug} tutorial={tutorial} />
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
