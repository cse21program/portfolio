import type { ReactNode } from "react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { isUsableHref } from "@/features/about/linkPlatforms";
import { useExperiences } from "@/features/experience/useExperiences";
import { dateRange } from "@/features/resume/resumeView";
import { displayEndDate } from "@/types/experience";
import type { Experience } from "@/types/public";

function roleKey(item: Experience, index: number) {
  return item.id ?? `${item.company}-${item.position}-${index}`;
}

function Icon({
  name,
}: {
  name: "calendar" | "briefcase" | "pin" | "arrow";
}) {
  const paths = {
    calendar: (
      <>
        <rect x="4" y="6" width="16" height="14" rx="2" />
        <path d="M8 4v4M16 4v4M4 11h16" />
      </>
    ),
    briefcase: (
      <>
        <path d="M8 8V6.5A1.5 1.5 0 0 1 9.5 5h5A1.5 1.5 0 0 1 16 6.5V8" />
        <rect x="4" y="8" width="16" height="12" rx="2" />
        <path d="M4 13h16" />
      </>
    ),
    pin: (
      <>
        <path d="M12 21s6-5.4 6-10a6 6 0 1 0-12 0c0 4.6 6 10 6 10Z" />
        <circle cx="12" cy="11" r="1.8" />
      </>
    ),
    arrow: <path d="M7 17 17 7M9 7h8v8" />,
  };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

function Chip({
  icon,
  children,
  accent = false,
}: {
  icon: "calendar" | "briefcase" | "pin";
  children: ReactNode;
  accent?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs ${
        accent
          ? "border-accent/25 bg-accent/10 text-accent-dark"
          : "border-line bg-paper text-ink-soft"
      }`}
    >
      <Icon name={icon} />
      {children}
    </span>
  );
}

function NoteList({ heading, items }: { heading: string; items: string[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div>
      <h3 className="text-xs tracking-[0.16em] text-accent uppercase">{heading}</h3>
      <ul className="mt-3 space-y-3 text-sm leading-6 text-ink-soft">
        {items.map((entry, index) => (
          <li key={`${heading}-${index}`} className="flex gap-3">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
            <span>{entry}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ExperienceArticle({ item }: { item: Experience }) {
  const website = item.website?.trim() ?? "";
  const period = dateRange(item.startDate, displayEndDate(item));
  const hasWebsite = Boolean(website && isUsableHref(website));
  const bothLists = item.responsibilities.length > 0 && item.achievements.length > 0;

  return (
    <article className="relative pl-12 sm:pl-14">
      <span
        className={`absolute top-9 left-0 h-3.5 w-3.5 rounded-full border-2 border-accent ${
          item.current ? "bg-accent" : "bg-paper"
        }`}
        aria-hidden="true"
      />
      <div
        className={`rounded-[1.75rem] border bg-surface p-5 shadow-[0_1px_0_rgb(26_22_18/0.04)] sm:p-8 ${
          item.current ? "border-accent/30" : "border-line"
        }`}
      >
        <div className="flex flex-wrap gap-2">
          <Chip icon="calendar" accent>
            {period}
          </Chip>
          <Chip icon="briefcase">{item.type}</Chip>
          {item.location ? <Chip icon="pin">{item.location}</Chip> : null}
        </div>

        <div className="mt-5 flex items-start gap-4">
          {item.logoUrl ? (
            <img
              src={item.logoUrl}
              alt=""
              className="h-14 w-14 shrink-0 rounded-2xl border border-line bg-paper object-contain p-1.5"
            />
          ) : null}
          <div className="min-w-0">
            <h2 className="font-display text-2xl tracking-tight text-ink sm:text-3xl">{item.position}</h2>
            <p className="mt-1.5">
              {hasWebsite ? (
                <a
                  className="inline-flex items-center gap-1.5 font-medium text-ink hover:text-accent-dark"
                  href={website}
                  target="_blank"
                  rel="noreferrer"
                >
                  {item.company}
                  <Icon name="arrow" />
                </a>
              ) : (
                <span className="font-medium text-ink">{item.company}</span>
              )}
            </p>
          </div>
        </div>

        {item.description ? (
          <p className="mt-5 max-w-3xl text-base leading-8 text-ink-soft">{item.description}</p>
        ) : null}

        {item.responsibilities.length > 0 || item.achievements.length > 0 ? (
          <div className={`mt-8 ${bothLists ? "grid gap-8 md:grid-cols-2" : ""}`}>
            <NoteList heading="Responsibilities" items={item.responsibilities} />
            <NoteList heading="Achievements" items={item.achievements} />
          </div>
        ) : null}

        {item.technologies.length > 0 ? (
          <ul className="mt-8 flex flex-wrap gap-2">
            {item.technologies.map((tech) => (
              <li key={tech}>
                <span className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-1.5 text-xs text-ink">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
                  {tech}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  );
}

export function ExperiencePage() {
  const { experiences } = useExperiences();

  return (
    <>
      <section className="relative overflow-hidden border-b border-line bg-surface">
        <div className="pointer-events-none absolute -top-28 left-1/3 h-80 w-80 rounded-full bg-accent/15 blur-3xl" />
        <div className="pointer-events-none absolute right-0 bottom-0 h-56 w-56 rounded-full bg-paper-muted blur-3xl" />
        <Container className="relative py-14 sm:py-20">
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/90 px-3 py-1 text-xs tracking-[0.16em] text-accent uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Experience
          </p>
          <h1 className="mt-5 font-display text-4xl tracking-tight text-ink sm:text-5xl lg:text-6xl">
            Work and practice
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-ink-soft">
            Roles from the current one back, with the work, outcomes, and tools from each.
          </p>
          <div className="mt-8">
            <ButtonLink to="/resume" variant="secondary">
              View resume
            </ButtonLink>
          </div>
        </Container>
      </section>

      <section className="border-b border-line bg-paper-muted/35 py-12 sm:py-16">
        <Container>
          {experiences.length === 0 ? (
            <EmptyState
              title="No roles published yet"
              description="Work history will appear here once it is added in Studio."
              action={{ label: "Back home", to: "/" }}
            />
          ) : (
            <div className="relative space-y-5 before:absolute before:top-10 before:bottom-10 before:left-[0.4rem] before:w-px before:bg-line sm:space-y-7">
              {experiences.map((item, index) => (
                <ExperienceArticle key={roleKey(item, index)} item={item} />
              ))}
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
