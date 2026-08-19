import { useMemo, useState } from "react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterChip, FilterGroups, FilterRow, FilterSearch, FilterToolbar } from "@/components/ui/FilterBar";
import { CourseCard } from "@/features/courses/courseUi";
import { useCourses } from "@/features/courses/useCourses";
import { matchesCourseFilters, publishedCourses } from "@/types/course";

export function CoursesPage() {
  const { courses, loading } = useCourses();
  const published = publishedCourses(courses);
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [skill, setSkill] = useState("");
  const [access, setAccess] = useState("");
  const [featured, setFeatured] = useState("");

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
  const hasFeatured = published.some((item) => item.featured);
  const filtering = Boolean(query.trim() || difficulty || skill || access || featured);
  const visible = published.filter((item) =>
    matchesCourseFilters(item, { query, difficulty, skill, access, featured, status: "" }),
  );
  const lead = !filtering && visible.length > 1 ? visible[0] : undefined;
  const grid = lead ? visible.slice(1) : visible;
  const resultLabel = filtering
    ? `${visible.length} of ${published.length} ${published.length === 1 ? "course" : "courses"}`
    : `${visible.length} ${visible.length === 1 ? "course" : "courses"}`;

  function clearFilters() {
    setQuery("");
    setDifficulty("");
    setSkill("");
    setAccess("");
    setFeatured("");
  }

  return (
    <>
      <section className="relative overflow-hidden border-b border-line bg-surface">
        <div className="pointer-events-none absolute -top-28 left-1/3 h-80 w-80 rounded-full bg-accent/15 blur-3xl" />
        <div className="pointer-events-none absolute right-0 bottom-0 h-56 w-56 rounded-full bg-paper-muted blur-3xl" />
        <Container className="relative py-14 sm:py-20">
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/90 px-3 py-1 text-xs tracking-[0.16em] text-accent uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Courses
          </p>
          <h1 className="mt-5 font-display text-4xl tracking-tight text-ink sm:text-5xl lg:text-6xl">
            Learn in sequence
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-ink-soft">
            Full courses with modules and lessons. Premium is labeled; checkout and enrollment are next.
            Inquire if you want a seat before that lands.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <ButtonLink to="/tutorials" variant="secondary">
              Browse tutorials
            </ButtonLink>
            <p className="text-sm text-muted">
              {published.length} {published.length === 1 ? "published course" : "published courses"}
            </p>
          </div>
        </Container>
      </section>

      <section className="border-b border-line bg-paper-muted/35 py-10 sm:py-16">
        <Container className="space-y-8">
          <FilterToolbar>
            <FilterSearch
              id="course-search"
              label="Search courses"
              value={query}
              placeholder="Title, skill, or lesson"
              resultLabel={resultLabel}
              filtering={filtering}
              onChange={setQuery}
              onClear={clearFilters}
            />
            {difficulties.length > 1 || skills.length > 1 || (hasFree && hasPremium) || hasFeatured ? (
              <FilterGroups>
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
                {hasFeatured ? (
                  <FilterRow label="Catalog" groupLabel="Filter featured courses">
                    <FilterChip label="All courses" active={!featured} onClick={() => setFeatured("")} />
                    <FilterChip
                      label="Featured"
                      active={featured === "featured"}
                      onClick={() => setFeatured("featured")}
                    />
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
              title="No courses match"
              description="Try another search, difficulty, skill, or catalog filter."
              action={{ label: "Clear filters", to: "/courses" }}
            />
          ) : (
            <div className="space-y-5">
              {lead ? <CourseCard course={lead} featured /> : null}
              {grid.length > 0 ? (
                <div className="grid gap-5 md:grid-cols-2">
                  {grid.map((course) => (
                    <CourseCard key={course.id ?? course.slug} course={course} />
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
