import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { Container } from "@/components/ui/Container";
import { NotFoundState } from "@/components/ui/NotFoundState";
import { GalleryLightbox } from "@/features/about/GalleryViewer";
import { VideoPlayer } from "@/features/about/VideoPlayer";
import { isUsableHref } from "@/features/about/linkPlatforms";
import { useProjects } from "@/features/projects/useProjects";
import { dateRange } from "@/features/resume/resumeView";
import type { Project } from "@/types/projects";

function Chip({ children, accent = false }: { children: ReactNode; accent?: boolean }) {
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

function SectionHeading({ children }: { children: string }) {
  return <h2 className="font-display text-3xl tracking-tight text-ink">{children}</h2>;
}

function NoteList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3 text-base leading-7 text-ink-soft">
      {items.map((entry, index) => (
        <li key={`${entry}-${index}`} className="flex gap-3">
          <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
          <span>{entry}</span>
        </li>
      ))}
    </ul>
  );
}

function uniqueUrls(urls: Array<string | null | undefined>) {
  return [...new Set(urls.map((url) => url?.trim()).filter((url): url is string => Boolean(url)))];
}

function relatedFor(project: Project, all: Project[]) {
  const same = all.filter((item) => item.slug !== project.slug && item.category === project.category);
  const rest = all.filter((item) => item.slug !== project.slug && item.category !== project.category);
  return [...same, ...rest].slice(0, 3);
}

export function ProjectDetailPage() {
  const { slug = "" } = useParams();
  const { projects, loading } = useProjects();
  const project = projects.find((item) => item.slug === slug);
  const [photoIndex, setPhotoIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!project) {
      return;
    }
    const previous = document.title;
    document.title = project.seoTitle?.trim() || `${project.title} — Projects`;
    const description = project.seoDescription?.trim() || project.shortDescription;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", description);
    return () => {
      document.title = previous;
    };
  }, [project]);

  const gallery = useMemo(
    () => (project ? uniqueUrls([project.thumbnailUrl, ...(project.images ?? [])]) : []),
    [project],
  );

  if (loading && !project) {
    return (
      <Container className="space-y-6 py-16">
        <div className="h-10 w-64 animate-pulse rounded-full bg-paper-muted" />
        <div className="h-40 animate-pulse rounded-[1.75rem] bg-paper-muted" />
      </Container>
    );
  }

  if (!project) {
    return <NotFoundState title="Project not found" />;
  }

  const related = relatedFor(project, projects);
  const screenshots = uniqueUrls(project.images ?? []);
  const cover = project.thumbnailUrl?.trim() || screenshots[0] || null;
  const period = dateRange(project.startDate, project.endDate);
  const overview = project.fullDescription?.trim() ?? "";
  const problem = project.problem.trim();
  const requirements = (project.requirements ?? "").trim();
  const solution = project.solution.trim();
  const architecture = project.architecture.trim();
  const showOverview = overview.length > 0 && overview !== project.shortDescription.trim();
  const showSolution = solution.length > 0 && solution !== overview;
  const links = [
    { label: "Live demo", href: project.liveUrl },
    { label: "GitHub", href: project.githubUrl },
    { label: "Documentation", href: project.docsUrl },
  ].filter((item) => item.href && isUsableHref(item.href));
  const jumps = [
    showOverview ? { id: "overview", label: "Overview" } : null,
    problem ? { id: "problem", label: "Problem" } : null,
    showSolution ? { id: "solution", label: "Solution" } : null,
    project.features.length > 0 ? { id: "features", label: "Features" } : null,
    screenshots.length > 0 ? { id: "screenshots", label: "Photos" } : null,
    project.demoVideoUrl ? { id: "demo", label: "Demo" } : null,
    related.length > 0 ? { id: "related", label: "Related" } : null,
  ].filter((item): item is { id: string; label: string } => item !== null);

  function openPhoto(url: string) {
    const index = gallery.indexOf(url);
    if (index >= 0) {
      setPhotoIndex(index);
    }
  }

  function showPhoto(next: number) {
    if (gallery.length === 0) {
      return;
    }
    setPhotoIndex((next + gallery.length) % gallery.length);
  }

  return (
    <>
      <section className="relative overflow-hidden border-b border-line bg-surface">
        <div className="pointer-events-none absolute -top-28 left-1/3 h-80 w-80 rounded-full bg-accent/15 blur-3xl" />
        <div className="pointer-events-none absolute right-0 bottom-0 h-56 w-56 rounded-full bg-paper-muted blur-3xl" />
        <Container className="relative grid items-start gap-8 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:py-16">
          <div>
            <Link to="/projects" className="text-sm font-medium text-accent hover:text-accent-dark">
              ← All projects
            </Link>
            <h1 className="mt-5 font-display text-4xl tracking-tight text-ink sm:text-5xl lg:text-6xl">
              {project.title}
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-8 text-ink-soft">{project.shortDescription}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {project.status ? <Chip accent>{project.status}</Chip> : null}
              {project.category ? <Chip>{project.category}</Chip> : null}
              {period ? <Chip>{period}</Chip> : null}
            </div>
            {project.technologies.length > 0 ? (
              <ul className="mt-6 flex flex-wrap gap-2">
                {project.technologies.map((tech) => (
                  <li key={tech}>
                    <span className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-1.5 text-xs text-ink">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
                      {tech}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
            {links.length > 0 ? (
              <div className="mt-8 flex flex-wrap gap-3">
                {links.map((item, index) => (
                  <a
                    key={item.label}
                    href={item.href!}
                    className={`inline-flex min-h-11 items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium transition ${
                      index === 0
                        ? "bg-ink text-paper hover:bg-accent"
                        : "border border-line bg-surface text-ink hover:border-accent/40"
                    }`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          <div className="space-y-4">
            {cover ? (
              <button
                type="button"
                className="group relative block w-full cursor-zoom-in overflow-hidden rounded-[1.75rem] border border-line bg-paper"
                onClick={() => openPhoto(cover)}
                aria-label={`View photos of ${project.title}`}
              >
                <img src={cover} alt="" className="aspect-[16/10] w-full object-cover" />
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/35 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                <span className="pointer-events-none absolute right-3 bottom-3 rounded-full bg-surface/95 px-3 py-1 text-xs text-ink opacity-0 shadow-sm transition group-hover:opacity-100">
                  {gallery.length > 1 ? `View ${gallery.length} photos` : "View photo"}
                </span>
              </button>
            ) : (
              <aside className="rounded-[1.75rem] border border-line bg-paper/80 p-6 sm:p-7">
                <p className="text-sm font-medium text-ink">Open this project</p>
                <p className="mt-1 text-sm leading-6 text-ink-soft">
                  {links.length > 0
                    ? "Use the live site or the source. The write-up is below."
                    : "The write-up is below. Links will appear here when they are published."}
                </p>
              </aside>
            )}
          </div>
        </Container>
      </section>

      {jumps.length > 1 ? (
        <nav className="border-b border-line bg-paper-muted/35 py-4" aria-label="On this page">
          <Container className="flex flex-wrap items-center gap-2">
            <p className="mr-1 text-xs tracking-[0.16em] text-muted uppercase">On this page</p>
            {jumps.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-ink hover:border-accent"
              >
                {item.label}
              </a>
            ))}
          </Container>
        </nav>
      ) : null}

      {showOverview ? (
        <section id="overview" className="scroll-mt-24 border-b border-line py-14 sm:py-16">
          <Container className="max-w-3xl">
            <SectionHeading>Overview</SectionHeading>
            <p className="mt-4 text-lg leading-8 text-ink-soft">{overview}</p>
          </Container>
        </section>
      ) : null}

      {problem || showSolution ? (
        <section className="border-b border-line bg-paper-muted/35 py-14 sm:py-16">
          <Container className={`grid gap-5 ${problem && showSolution ? "lg:grid-cols-2" : ""}`}>
            {problem ? (
              <div id="problem" className="scroll-mt-24 rounded-[1.75rem] border border-line bg-surface p-6 sm:p-8">
                <SectionHeading>Problem</SectionHeading>
                <p className="mt-4 text-base leading-8 text-ink-soft">{problem}</p>
              </div>
            ) : null}
            {showSolution ? (
              <div id="solution" className="scroll-mt-24 rounded-[1.75rem] border border-line bg-surface p-6 sm:p-8">
                <SectionHeading>Solution</SectionHeading>
                <p className="mt-4 text-base leading-8 text-ink-soft">{solution}</p>
              </div>
            ) : null}
          </Container>
        </section>
      ) : null}

      {requirements ? (
        <section id="requirements" className="scroll-mt-24 border-b border-line py-14 sm:py-16">
          <Container className="max-w-3xl">
            <SectionHeading>Requirements</SectionHeading>
            <p className="mt-4 text-lg leading-8 text-ink-soft">{requirements}</p>
          </Container>
        </section>
      ) : null}

      {project.features.length > 0 ? (
        <section id="features" className="scroll-mt-24 border-b border-line bg-paper-muted/35 py-14 sm:py-16">
          <Container className="max-w-3xl">
            <SectionHeading>Features</SectionHeading>
            <ul className="mt-6 space-y-3">
              {project.features.map((item, index) => (
                <li
                  key={`${item}-${index}`}
                  className="flex gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-sm leading-6 text-ink"
                >
                  <span className="mt-0.5 text-accent" aria-hidden="true">
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      ) : null}

      {screenshots.length > 0 ? (
        <section id="screenshots" className="scroll-mt-24 border-b border-line py-14 sm:py-16">
          <Container>
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <SectionHeading>Photos</SectionHeading>
              <p className="text-sm text-muted">
                {screenshots.length === 1 ? "1 photo" : `${screenshots.length} photos`} · click to enlarge
              </p>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2">
              {screenshots.map((url, index) => (
                <li key={url}>
                  <button
                    type="button"
                    className="group relative w-full cursor-zoom-in overflow-hidden rounded-[1.25rem] border border-line bg-surface"
                    onClick={() => openPhoto(url)}
                    aria-label={`View photo ${index + 1} of ${screenshots.length}`}
                  >
                    <img src={url} alt="" className="aspect-video w-full object-cover" />
                    <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/30 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                    <span className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-surface/95 px-3 py-1 text-xs text-ink opacity-0 shadow-sm transition group-hover:opacity-100">
                      View
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      ) : null}

      {project.demoVideoUrl ? (
        <section id="demo" className="scroll-mt-24 border-b border-line bg-paper-muted/35 py-14 sm:py-16">
          <Container className="max-w-4xl">
            <SectionHeading>Demo</SectionHeading>
            <p className="mt-2 text-sm text-ink-soft">A short walkthrough of the product in use.</p>
            <div className="mt-5 overflow-hidden rounded-[1.75rem] border border-line bg-paper p-1.5 shadow-[0_1px_0_rgb(26_22_18/0.04)] sm:p-2">
              <VideoPlayer src={project.demoVideoUrl} title={`${project.title} demo`} />
            </div>
          </Container>
        </section>
      ) : null}

      {architecture ? (
        <section id="architecture" className="scroll-mt-24 border-b border-line py-14 sm:py-16">
          <Container className="max-w-3xl">
            <SectionHeading>Architecture</SectionHeading>
            <p className="mt-4 text-lg leading-8 text-ink-soft">{architecture}</p>
          </Container>
        </section>
      ) : null}

      {project.challenges.length > 0 || (project.solutions ?? []).length > 0 ? (
        <section className="border-b border-line bg-paper-muted/35 py-14 sm:py-16">
          <Container
            className={`grid gap-8 ${
              project.challenges.length > 0 && (project.solutions ?? []).length > 0 ? "lg:grid-cols-2" : ""
            }`}
          >
            {project.challenges.length > 0 ? (
              <div id="challenges" className="scroll-mt-24">
                <SectionHeading>Challenges</SectionHeading>
                <div className="mt-4">
                  <NoteList items={project.challenges} />
                </div>
              </div>
            ) : null}
            {(project.solutions ?? []).length > 0 ? (
              <div id="fixes" className="scroll-mt-24">
                <SectionHeading>How I solved them</SectionHeading>
                <div className="mt-4">
                  <NoteList items={project.solutions ?? []} />
                </div>
              </div>
            ) : null}
          </Container>
        </section>
      ) : null}

      {project.lessons.length > 0 ? (
        <section id="lessons" className="scroll-mt-24 border-b border-line py-14 sm:py-16">
          <Container className="max-w-3xl">
            <SectionHeading>Lessons</SectionHeading>
            <div className="mt-4">
              <NoteList items={project.lessons} />
            </div>
          </Container>
        </section>
      ) : null}

      {related.length > 0 ? (
        <section id="related" className="scroll-mt-24 border-b border-line bg-paper-muted/35 py-14 sm:py-16">
          <Container>
            <SectionHeading>Related projects</SectionHeading>
            <p className="mt-2 text-sm text-ink-soft">More case studies if you want to keep reading.</p>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {related.map((item) => (
                <Link
                  key={item.slug}
                  to={`/projects/${item.slug}`}
                  aria-label={item.title}
                  className="flex flex-col rounded-[1.5rem] border border-line bg-surface p-5 transition hover:border-accent/40"
                >
                  {item.category ? <p className="text-xs text-accent">{item.category}</p> : null}
                  <h3 className="mt-2 font-display text-2xl text-ink">{item.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-6 text-ink-soft">{item.shortDescription}</p>
                  <p className="mt-4 text-sm font-medium text-accent">Read case study →</p>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      {photoIndex !== null ? (
        <GalleryLightbox
          images={gallery}
          index={photoIndex}
          onClose={() => setPhotoIndex(null)}
          onShow={showPhoto}
        />
      ) : null}
    </>
  );
}
