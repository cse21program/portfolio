import { useMemo, useState } from "react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterChip, FilterGroups, FilterRow, FilterSearch, FilterToolbar } from "@/components/ui/FilterBar";
import { ArticleCard } from "@/features/blog/blogUi";
import { FollowButton } from "@/features/follow/FollowButton";
import { NewsletterForm } from "@/features/blog/NewsletterForm";
import { useBlogs } from "@/features/blog/useBlogs";
import { catalogSortLabels, catalogYears, sortCatalogItems, type CatalogSort } from "@/lib/catalogFilters";
import { matchesArticleFilters, publishedArticles } from "@/types/blog";

const TAG_PREVIEW = 4;

function visibleTags(all: string[], selected: string, expanded: boolean) {
  if (expanded || all.length <= TAG_PREVIEW) {
    return all;
  }
  const head = all.slice(0, TAG_PREVIEW);
  if (selected && !head.includes(selected)) {
    return [selected, ...head.slice(0, TAG_PREVIEW - 1)];
  }
  return head;
}

export function BlogPage() {
  const { articles, loading } = useBlogs();
  const published = publishedArticles(articles);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [skill, setSkill] = useState("");
  const [topic, setTopic] = useState("");
  const [tag, setTag] = useState("");
  const [year, setYear] = useState("");
  const [sort, setSort] = useState<CatalogSort>("");
  const [tagsOpen, setTagsOpen] = useState(false);

  const categories = useMemo(
    () => [...new Set(published.map((item) => item.category).filter(Boolean))],
    [published],
  );
  const skills = useMemo(
    () => [...new Set(published.map((item) => item.skill).filter(Boolean))],
    [published],
  );
  const topics = useMemo(
    () => [...new Set(published.map((item) => item.topic).filter((item): item is string => Boolean(item)))],
    [published],
  );
  const years = useMemo(() => catalogYears(published.map((item) => item.publishedAt)), [published]);
  const tags = useMemo(
    () => [...new Set(published.flatMap((item) => item.tags).filter(Boolean))],
    [published],
  );
  const shownTags = visibleTags(tags, tag, tagsOpen);
  const filtering = Boolean(query.trim() || category || skill || topic || tag || year || sort);
  const visible = sortCatalogItems(
    published.filter((item) =>
      matchesArticleFilters(item, { query, category, skill, tag, status: "", topic, year }),
    ),
    sort,
    (item) => item.publishedAt,
    (item) => item.likeCount ?? 0,
  );
  const lead = !filtering && visible.length > 1 ? visible[0] : undefined;
  const grid = lead ? visible.slice(1) : visible;
  const resultLabel = filtering
    ? `${visible.length} of ${published.length} ${published.length === 1 ? "post" : "posts"}`
    : `${visible.length} ${visible.length === 1 ? "post" : "posts"}`;

  function clearFilters() {
    setQuery("");
    setCategory("");
    setSkill("");
    setTopic("");
    setTag("");
    setYear("");
    setSort("");
    setTagsOpen(false);
  }

  return (
    <>
      <section className="relative overflow-hidden border-b border-line bg-surface">
        <div className="pointer-events-none absolute -top-28 left-1/3 h-80 w-80 rounded-full bg-accent/15 blur-3xl" />
        <div className="pointer-events-none absolute right-0 bottom-0 h-56 w-56 rounded-full bg-paper-muted blur-3xl" />
        <Container className="relative py-14 sm:py-20">
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/90 px-3 py-1 text-xs tracking-[0.16em] text-accent uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Blog
          </p>
          <h1 className="mt-5 font-display text-4xl tracking-tight text-ink sm:text-5xl lg:text-6xl">
            Writing
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-ink-soft">
            Notes on backend, DevOps, and how this platform is being built — the same standards I
            use in production systems.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <FollowButton compact />
            <ButtonLink to="/about" variant="secondary">
              About the author
            </ButtonLink>
            <p className="text-sm text-muted">
              {published.length} {published.length === 1 ? "published post" : "published posts"}
            </p>
          </div>
        </Container>
      </section>

      <section className="border-b border-line bg-paper-muted/35 py-10 sm:py-16">
        <Container className="space-y-8">
          <FilterToolbar>
            <FilterSearch
              id="blog-search"
              label="Search posts"
              value={query}
              placeholder="Title, tag, skill, or excerpt"
              resultLabel={resultLabel}
              filtering={filtering}
              onChange={setQuery}
              onClear={clearFilters}
            />
            {categories.length > 1 ||
            skills.length > 1 ||
            topics.length > 1 ||
            tags.length > 1 ||
            years.length > 1 ||
            published.length > 1 ? (
              <FilterGroups count={[sort, year, category, skill, topic, tag].filter(Boolean).length}>
                {published.length > 1 ? (
                  <FilterRow label="Sort" groupLabel="Sort posts">
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
                {topics.length > 1 ? (
                  <FilterRow label="Topic" groupLabel="Filter by topic">
                    <FilterChip label="All topics" active={!topic} onClick={() => setTopic("")} />
                    {topics.map((item) => (
                      <FilterChip
                        key={item}
                        label={item}
                        active={topic === item}
                        onClick={() => setTopic(item)}
                      />
                    ))}
                  </FilterRow>
                ) : null}
                {tags.length > 1 ? (
                  <FilterRow label="Tag" groupLabel="Filter by tag">
                    <FilterChip label="All tags" active={!tag} onClick={() => setTag("")} />
                    {shownTags.map((item) => (
                      <FilterChip
                        key={item}
                        label={item}
                        active={tag === item}
                        onClick={() => setTag(item)}
                      />
                    ))}
                    {tags.length > TAG_PREVIEW ? (
                      <button
                        type="button"
                        className="cursor-pointer rounded-full px-3 py-1.5 text-sm font-medium text-accent hover:text-accent-dark"
                        onClick={() => setTagsOpen((open) => !open)}
                      >
                        {tagsOpen ? "Fewer tags" : `+${tags.length - shownTags.length} more`}
                      </button>
                    ) : null}
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
              title="No posts match"
              description="Try another search, topic, date, or tag."
              action={{ label: "Clear filters", to: "/blog" }}
            />
          ) : (
            <div className="space-y-5">
              {lead ? <ArticleCard article={lead} featured /> : null}
              {grid.length > 0 ? (
                <div className="grid gap-5 md:grid-cols-2">
                  {grid.map((article) => (
                    <ArticleCard key={article.id ?? article.slug} article={article} />
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </Container>
      </section>

      <section className="border-b border-line py-14 sm:py-16">
        <Container className="grid items-end gap-8 md:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-xs tracking-[0.16em] text-accent uppercase">Newsletter</p>
            <h2 className="mt-3 font-display text-3xl tracking-tight text-ink">Get new posts</h2>
            <p className="mt-3 max-w-md text-sm leading-7 text-ink-soft">
              Occasional notes on backend and how this platform is built. Unsubscribe from any
              issue.
            </p>
          </div>
          <NewsletterForm />
        </Container>
      </section>
    </>
  );
}
