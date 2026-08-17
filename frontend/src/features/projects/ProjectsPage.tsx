import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { useProjects } from "@/features/projects/useProjects";
import { dateRange } from "@/features/resume/resumeView";
import type { Project } from "@/types/projects";

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
  const { projects, loading } = useProjects();
  const [category, setCategory] = useState("All");
  const categories = useMemo(
    () => ["All", ...new Set(projects.map((item) => item.category).filter(Boolean))],
    [projects],
  );
  const visible = projects.filter((item) => category === "All" || item.category === category);
  const lead =
    category === "All" ? (visible.find((item) => item.featured) ?? visible[0]) : undefined;
  const grid = lead ? visible.filter((item) => item.slug !== lead.slug) : visible;

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
              <p className="ml-1 text-sm text-muted">
                {visible.length} {visible.length === 1 ? "case study" : "case studies"}
              </p>
            </div>
          ) : null}

          {loading && projects.length === 0 ? (
            <div className="grid gap-5 md:grid-cols-2">
              <div className="h-64 animate-pulse rounded-[1.75rem] bg-surface" />
              <div className="h-64 animate-pulse rounded-[1.75rem] bg-surface" />
            </div>
          ) : visible.length === 0 ? (
            <EmptyState
              title="No projects yet"
              description="Case studies will appear here once they are published from Studio."
              action={{ label: "Back home", to: "/" }}
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
