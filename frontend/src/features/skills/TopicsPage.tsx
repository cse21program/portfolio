import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterChip, FilterGroups, FilterRow, FilterSearch, FilterToolbar } from "@/components/ui/FilterBar";
import { ViewPageLink } from "@/components/ui/ViewPageLink";
import { useTopics } from "@/features/skills/useTopics";
import { groupTopicsBySkill, matchesTopicFilters, publishedKnowledgeTopics } from "@/types/topics";

export function TopicsPage() {
  const { topics, loading } = useTopics();
  const published = publishedKnowledgeTopics(topics);
  const [query, setQuery] = useState("");
  const [skill, setSkill] = useState("");
  const [field, setField] = useState("");
  const skills = useMemo(
    () => [...new Set(published.map((item) => item.skill).filter(Boolean))],
    [published],
  );
  const fields = useMemo(
    () => [...new Set(published.map((item) => item.field).filter(Boolean))],
    [published],
  );
  const filtering = Boolean(query.trim() || skill || field);
  const visible = published.filter((item) =>
    matchesTopicFilters(item, { query, skill, field, status: "published" }),
  );
  const chapters = groupTopicsBySkill(visible);
  const resultLabel = filtering
    ? `${visible.length} of ${published.length} ${published.length === 1 ? "topic" : "topics"}`
    : `${visible.length} ${visible.length === 1 ? "topic" : "topics"}`;

  function clearFilters() {
    setQuery("");
    setSkill("");
    setField("");
  }

  return (
    <>
      <section className="relative overflow-hidden border-b border-line bg-surface">
        <div className="pointer-events-none absolute -top-28 left-1/3 h-80 w-80 rounded-full bg-accent/15 blur-3xl" />
        <div className="pointer-events-none absolute right-0 bottom-0 h-56 w-56 rounded-full bg-paper-muted blur-3xl" />
        <Container className="relative py-14 sm:py-20">
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/90 px-3 py-1 text-xs tracking-[0.16em] text-accent uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Topics
          </p>
          <h1 className="mt-5 max-w-3xl font-display text-4xl tracking-tight text-ink sm:text-5xl lg:text-6xl">
            Lessons under each skill
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-ink-soft">
            Overviews, video, code, and related writing. Field, then skill, then topic.
          </p>
        </Container>
      </section>

      <section className="border-b border-line bg-paper-muted/35 py-12 sm:py-16">
        <Container className="space-y-7">
          <FilterToolbar>
            <FilterSearch
              id="topic-search"
              label="Search topics"
              value={query}
              placeholder="Topic, skill, or field"
              resultLabel={resultLabel}
              filtering={filtering}
              onChange={setQuery}
              onClear={clearFilters}
            />
            {skills.length > 1 || fields.length > 1 ? (
              <FilterGroups count={[field, skill].filter(Boolean).length}>
                {fields.length > 1 ? (
                  <FilterRow label="Field" groupLabel="Filter by field">
                    <FilterChip label="All" active={!field} onClick={() => setField("")} />
                    {fields.map((item) => (
                      <FilterChip
                        key={item}
                        label={item}
                        active={field === item}
                        onClick={() => setField(item)}
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
              </FilterGroups>
            ) : null}
          </FilterToolbar>

          {loading && chapters.length === 0 && published.length === 0 ? (
            <div className="h-64 animate-pulse rounded-[1.75rem] bg-paper-muted" />
          ) : published.length === 0 ? (
            <EmptyState
              title="No topics published yet"
              description="Topics will appear here once they are added under a skill."
              action={{ label: "Back to skills", to: "/skills" }}
            />
          ) : chapters.length === 0 ? (
            <EmptyState
              title="No topics match"
              description="Try another search, field, or skill."
              action={{ label: "Clear filters", to: "/topics" }}
            />
          ) : (
            chapters.map((chapter) => (
              <section
                key={chapter.skillSlug}
                className="overflow-hidden rounded-[1.75rem] border border-line bg-surface shadow-[0_1px_0_rgb(26_22_18/0.04)]"
              >
                <header className="flex items-start justify-between gap-4 border-b border-line bg-paper/70 px-5 py-6 sm:px-8">
                  <div>
                    <p className="text-xs tracking-[0.14em] text-muted uppercase">{chapter.field}</p>
                    <h2 className="mt-1 font-display text-2xl tracking-tight text-ink sm:text-3xl">
                      <Link to={`/skills/${chapter.skillSlug}`} className="hover:text-accent-dark">
                        {chapter.skill}
                      </Link>
                    </h2>
                  </div>
                  <ViewPageLink to={`/skills/${chapter.skillSlug}`} subject={chapter.skill} />
                </header>
                <ul className="divide-y divide-line">
                  {chapter.topics.map((topic) => (
                    <li
                      key={topic.id ?? `${topic.skillSlug}-${topic.slug}`}
                      className="flex items-start justify-between gap-4 px-5 py-5 sm:px-8"
                    >
                      <div>
                        <h3 className="font-display text-2xl text-ink">
                          <Link
                            to={`/topics/${topic.skillSlug}/${topic.slug}`}
                            className="hover:text-accent-dark"
                          >
                            {topic.title}
                          </Link>
                        </h3>
                        <p className="mt-1 text-sm leading-7 text-ink-soft">{topic.summary}</p>
                      </div>
                      <ViewPageLink
                        to={`/topics/${topic.skillSlug}/${topic.slug}`}
                        subject={topic.title}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </Container>
      </section>
    </>
  );
}
