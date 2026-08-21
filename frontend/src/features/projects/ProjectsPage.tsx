import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterChip, FilterGroups, FilterRow, FilterSearch, FilterToolbar } from "@/components/ui/FilterBar";
import { useProjects } from "@/features/projects/useProjects";
import { dateRange } from "@/features/resume/resumeView";
import { catalogSortLabels, catalogYears, sortCatalogItems, type CatalogSort } from "@/lib/catalogFilters";
import { matchesProjectFilters, publishedProjects, type Project } from "@/types/projects";

function Chip({
  children,
  accent = false,
}: {
  children: string;
  accent?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs ${
        accent
          ? "border-accent/25 bg-accent/10 text-accent-dark"
          : "border-line bg-paper text-ink-soft"
      }`}
    >
      {children}
    </span>
  );
}

function TechPills({ items }: { items: string[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <ul className="mt-6 flex flex-wrap gap-2">
      {items.map((tech) => (
        <li key={tech}>
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-1.5 text-xs text-ink">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
            {tech}
          </span>
        </li>
      ))}
    </ul>
  );
}

function ProjectCard({ project, featured = false }: { project: Project; featured?: boolean }) {
  const period = dateRange(project.startDate, project.endDate);
  const wide = featured && Boolean(project.thumbnailUrl);

  return (
    <Link
      to={`/projects/${project.slug}`}
      className={`group flex h-full overflow-hidden rounded-[1.75rem] border border-line bg-surface shadow-[0_1px_0_rgb(26_22_18/0.04)] transition duration-200 hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-[0_18px_40px_rgb(26_22_18/0.08)] ${
        wide ? "flex-col md:flex-row" : "flex-col"
      }`}
    >
      {project.thumbnailUrl ? (
        <img
          src={project.thumbnailUrl}
          alt=""
          className={`object-cover ${wide ? "aspect-[16/10] md:aspect-auto md:w-[46%]" : "aspect-[16/9] w-full"}`}
        />
      ) : null}
      <div className={`flex flex-1 flex-col p-5 sm:p-7 ${wide ? "md:p-8" : ""}`}>
        <div className="flex flex-wrap gap-2">
          {project.featured ? <Chip accent>Featured</Chip> : null}
          {project.status ? <Chip accent={!project.featured}>{project.status}</Chip> : null}
          {project.category ? <Chip>{project.category}</Chip> : null}
        </div>
        <h2
          className={`mt-5 font-display tracking-tight text-ink transition group-hover:text-accent-dark ${
            featured ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl"
          }`}
        >
          {project.title}
        </h2>
        <p className="mt-3 flex-1 text-base leading-8 text-ink-soft">{project.shortDescription}</p>
        <TechPills items={project.technologies.slice(0, featured ? 6 : 4)} />
        <div className="mt-6 flex items-center justify-between gap-3">
          {period ? <p className="text-xs text-muted">{period}</p> : <span />}
          <p className="text-sm font-medium text-accent group-hover:text-accent-dark">Read case study →</p>
        </div>
      </div>
    </Link>
  );
}

export function ProjectsPage() {
  const { projects: allProjects, loading } = useProjects();
  const projects = publishedProjects(allProjects);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [technology, setTechnology] = useState("");
  const [year, setYear] = useState("");
  const [sort, setSort] = useState<CatalogSort>("");
  const categories = useMemo(
    () => [...new Set(projects.map((item) => item.category).filter(Boolean))],
    [projects],
  );
  const technologies = useMemo(
    () => [...new Set(projects.flatMap((item) => item.technologies).filter(Boolean))],
    [projects],
  );
  const years = useMemo(() => catalogYears(projects.map((item) => item.startDate)), [projects]);
  const filtering = Boolean(query.trim() || category || technology || year || sort);
  const visible = sortCatalogItems(
    projects.filter((item) => matchesProjectFilters(item, { query, category, technology, year })),
    sort,
    (item) => item.startDate,
    (item) => (item.featured ? 100 : 0),
  );
  const lead = !filtering ? (visible.find((item) => item.featured) ?? visible[0]) : undefined;
  const grid = lead ? visible.filter((item) => item.slug !== lead.slug) : visible;
  const resultLabel = filtering
    ? `${visible.length} of ${projects.length} ${projects.length === 1 ? "case study" : "case studies"}`
    : `${visible.length} ${visible.length === 1 ? "case study" : "case studies"}`;

  function clearFilters() {
    setQuery("");
    setCategory("");
    setTechnology("");
    setYear("");
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
            Projects
          </p>
          <h1 className="mt-5 font-display text-4xl tracking-tight text-ink sm:text-5xl lg:text-6xl">
            Case studies
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-ink-soft">
            Selected work with the problem, the solution, the architecture, and what I would do
            again.
          </p>
          <div className="mt-8">
            <ButtonLink to="/resume" variant="secondary">
              View resume
            </ButtonLink>
          </div>
        </Container>
      </section>

      <section className="border-b border-line bg-paper-muted/35 py-12 sm:py-16">
        <Container className="space-y-8">
          <FilterToolbar>
            <FilterSearch
              id="project-search"
              label="Search projects"
              value={query}
              placeholder="Title, category, or technology"
              resultLabel={resultLabel}
              filtering={filtering}
              onChange={setQuery}
              onClear={clearFilters}
            />
            {categories.length > 1 || technologies.length > 1 || years.length > 1 || projects.length > 1 ? (
              <FilterGroups count={[sort, year, category, technology].filter(Boolean).length}>
                {projects.length > 1 ? (
                  <FilterRow label="Sort" groupLabel="Sort projects">
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
              </FilterGroups>
            ) : null}
          </FilterToolbar>

          {loading && projects.length === 0 ? (
            <div className="grid gap-5 md:grid-cols-2">
              <div className="h-64 animate-pulse rounded-[1.75rem] bg-surface" />
              <div className="h-64 animate-pulse rounded-[1.75rem] bg-surface" />
            </div>
          ) : visible.length === 0 ? (
            <EmptyState
              title={filtering ? "No case studies match" : "No projects yet"}
              description={
                filtering
                  ? "Try another search, category, or technology."
                  : "Case studies will appear here once they are published from Studio."
              }
              action={
                filtering
                  ? { label: "Clear filters", to: "/projects" }
                  : { label: "Back home", to: "/" }
              }
            />
          ) : (
            <div className="space-y-5">
              {lead ? <ProjectCard project={lead} featured /> : null}
              {grid.length > 0 ? (
                <div className="grid gap-5 md:grid-cols-2">
                  {grid.map((project) => (
                    <ProjectCard key={project.slug} project={project} />
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
