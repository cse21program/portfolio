import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { Chip, KnowledgeVideo } from "@/features/skills/skillsUi";
import { useSkills } from "@/features/skills/useSkills";
import {
  fieldAnchor,
  fieldIntro,
  groupSkillsByField,
  publishedSkills,
  type Skill,
} from "@/types/skills";

function PlayMark() {
  return (
    <svg viewBox="0 0 16 16" className="h-3 w-3" aria-hidden="true">
      <path d="m5 3.5 8 4.5-8 4.5v-9Z" fill="currentColor" />
    </svg>
  );
}

function SkillRow({ skill }: { skill: Skill }) {
  const mark = skill.iconUrl || skill.imageUrl;
  const hasVideo = Boolean(skill.videoUrl || skill.embedVideoUrl);

  return (
    <li className="group grid gap-5 px-5 py-6 transition hover:bg-paper/70 sm:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] sm:items-start sm:px-8">
      <div className="flex gap-4">
        {mark ? (
          <img
            src={mark}
            alt=""
            className="mt-1 h-12 w-12 shrink-0 rounded-2xl border border-line object-cover"
          />
        ) : (
          <span
            className="mt-1.5 grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-line bg-paper"
            aria-hidden="true"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          </span>
        )}
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            {skill.level ? <Chip accent>{skill.level}</Chip> : null}
            {skill.years ? <Chip>{skill.years}</Chip> : null}
            {hasVideo ? (
              <Chip accent>
                <span className="inline-flex items-center gap-1.5">
                  <PlayMark />
                  Skill video
                </span>
              </Chip>
            ) : null}
          </div>
          <h3 className="mt-3 font-display text-2xl tracking-tight text-ink sm:text-3xl">
            <Link to={`/skills/${skill.slug}`} className="hover:text-accent-dark">
              {skill.name}
            </Link>
          </h3>
          <p className="mt-2 max-w-xl text-sm leading-7 text-ink-soft">{skill.summary}</p>
        </div>
      </div>
      <div className="flex flex-col gap-4 sm:items-end sm:pt-1">
        {skill.topics.length > 0 ? (
          <ul className="flex flex-wrap gap-2 sm:justify-end">
            {skill.topics.map((topic) => {
              const topicVideo = Boolean(topic.videoUrl || topic.embedVideoUrl);
              return (
                <li key={topic.id ?? topic.slug}>
                  <Link
                    to={`/skills/${skill.slug}/${topic.slug}`}
                    className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-1.5 text-xs text-ink transition hover:border-accent hover:text-accent-dark"
                  >
                    {topicVideo ? (
                      <PlayMark />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
                    )}
                    {topic.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : null}
        <Link
          to={`/skills/${skill.slug}`}
          className="text-sm font-medium text-accent transition group-hover:text-accent-dark"
        >
          Open {skill.name} →
        </Link>
      </div>
    </li>
  );
}

export function SkillsPage() {
  const { skills, loading } = useSkills();
  const visible = publishedSkills(skills);
  const [field, setField] = useState("All");
  const filters = useMemo(
    () => ["All", ...[...new Set(visible.map((item) => item.field).filter(Boolean))]],
    [visible],
  );
  const filtered = visible.filter((item) => field === "All" || item.field === field);
  const chapters = groupSkillsByField(filtered);

  return (
    <>
      <section className="relative overflow-hidden border-b border-line bg-surface">
        <div className="pointer-events-none absolute -top-28 left-1/3 h-80 w-80 rounded-full bg-accent/15 blur-3xl" />
        <div className="pointer-events-none absolute right-0 bottom-0 h-56 w-56 rounded-full bg-paper-muted blur-3xl" />
        <Container className="relative py-14 sm:py-20">
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/90 px-3 py-1 text-xs tracking-[0.16em] text-accent uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Skills
          </p>
          <h1 className="mt-5 max-w-3xl font-display text-4xl tracking-tight text-ink sm:text-5xl lg:text-6xl">
            What I work in
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-ink-soft">
            Field, then skill, then topic. Each level can carry its own intro video.
          </p>
        </Container>
      </section>

      <section className="border-b border-line bg-paper-muted/35 py-12 sm:py-16">
        <Container className="space-y-7">
          {filters.length > 2 ? (
            <div className="flex flex-wrap items-center gap-2">
              {filters.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={field === item}
                  className={`cursor-pointer rounded-full px-4 py-2 text-sm transition ${
                    field === item
                      ? "bg-ink text-paper"
                      : "border border-line bg-surface text-ink hover:border-accent"
                  }`}
                  onClick={() => setField(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          ) : null}

          {loading && visible.length === 0 ? (
            <div className="h-64 animate-pulse rounded-[1.75rem] bg-paper-muted" />
          ) : visible.length === 0 ? (
            <EmptyState
              title="No skills published yet"
              description="The knowledge tree will appear here once it is added in Studio."
              action={{ label: "Back home", to: "/" }}
            />
          ) : (
            chapters.map((chapter) => {
              const intro = fieldIntro(chapter.skills);
              return (
                <section
                  key={chapter.field}
                  id={fieldAnchor(chapter.field)}
                  className="scroll-mt-28 overflow-hidden rounded-[1.75rem] border border-line bg-surface shadow-[0_1px_0_rgb(26_22_18/0.04)]"
                >
                  <header className="grid gap-6 border-b border-line bg-paper/70 px-5 py-5 sm:px-8 sm:py-6 lg:grid-cols-[minmax(0,1fr)_minmax(14rem,22rem)] lg:items-start">
                    <div>
                      <p className="text-[11px] tracking-[0.16em] text-muted uppercase">Field</p>
                      <h2 className="mt-2 font-display text-2xl tracking-tight text-ink sm:text-3xl">
                        {chapter.field}
                      </h2>
                      <p className="mt-2 text-sm text-ink-soft">
                        {chapter.skills.length} {chapter.skills.length === 1 ? "skill" : "skills"}
                      </p>
                    </div>
                    {intro ? (
                      <KnowledgeVideo
                        embedUrl={intro.embedUrl}
                        fileUrl={intro.fileUrl}
                        title={intro.title}
                      />
                    ) : null}
                  </header>
                  <ul className="divide-y divide-line">
                    {chapter.skills.map((skill) => (
                      <SkillRow key={skill.id ?? skill.slug} skill={skill} />
                    ))}
                  </ul>
                </section>
              );
            })
          )}
        </Container>
      </section>
    </>
  );
}
