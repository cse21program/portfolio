import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { Chip, PlayMark } from "@/features/skills/skillsUi";
import { ViewPageLink } from "@/components/ui/ViewPageLink";
import { useFields } from "@/features/skills/useFields";
import { useSkills } from "@/features/skills/useSkills";
import { publishedFields } from "@/types/fields";
import {
  fieldAnchor,
  groupSkillsByField,
  listSkillFields,
  publishedSkills,
  publishedTopics,
  type Skill,
} from "@/types/skills";

function fieldNote(name: string, summary?: string, overview?: string) {
  const short = summary?.trim() ?? "";
  if (short && short.toLowerCase() !== name.toLowerCase()) {
    return short;
  }
  const long = overview?.trim() ?? "";
  return long || null;
}

function FieldMark({ src, name }: { src?: string | null; name: string }) {
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className="h-14 w-14 shrink-0 rounded-2xl border border-line object-cover"
      />
    );
  }

  return (
    <span
      className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-line bg-surface"
      aria-hidden="true"
    >
      <span className="font-display text-xl text-accent">{name.slice(0, 1)}</span>
    </span>
  );
}

function SkillRow({ skill }: { skill: Skill }) {
  const mark = skill.iconUrl || skill.imageUrl;
  const hasVideo = Boolean(skill.videoUrl || skill.embedVideoUrl);

  return (
    <li className="flex items-start gap-4 px-5 py-6 transition hover:bg-paper/70 sm:px-8">
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
      <div className="min-w-0 flex-1">
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
        <div className="mt-3 flex items-start justify-between gap-4">
          <h3 className="min-w-0 font-display text-2xl tracking-tight text-ink sm:text-3xl">
            <Link to={`/skills/${skill.slug}`} className="hover:text-accent-dark">
              {skill.name}
            </Link>
          </h3>
          <ViewPageLink to={`/skills/${skill.slug}`} subject={skill.name} />
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-ink-soft">{skill.summary}</p>
        {publishedTopics(skill.topics).length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {publishedTopics(skill.topics).map((topic) => {
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
      </div>
    </li>
  );
}

export function SkillsPage() {
  const { skills, loading } = useSkills();
  const { fields } = useFields();
  const visible = publishedSkills(skills);
  const [field, setField] = useState("All");
  const published = publishedFields(fields);
  const fieldNames = useMemo(
    () => (published.length > 0 ? published.map((item) => item.name) : listSkillFields(visible)),
    [published, visible],
  );
  const filters = useMemo(() => ["All", ...fieldNames], [fieldNames]);
  const filtered = visible.filter((item) => field === "All" || item.field === field);
  const chapters = groupSkillsByField(filtered, fieldNames);

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
              const record = published.find((item) => item.name === chapter.field);
              const slug =
                record?.slug ||
                chapter.skills[0]?.fieldSlug ||
                fieldAnchor(chapter.field).replace(/^field-/, "");
              const mark = record?.iconUrl || record?.thumbnailUrl || null;
              const note = fieldNote(chapter.field, record?.summary, record?.overview);
              return (
                <section
                  key={chapter.field}
                  id={fieldAnchor(slug)}
                  className="scroll-mt-28 overflow-hidden rounded-[1.75rem] border border-line bg-surface shadow-[0_1px_0_rgb(26_22_18/0.04)]"
                >
                  <header className="border-b border-line bg-paper/70 px-5 py-6 sm:px-8 sm:py-7">
                    <div className="flex items-start gap-4">
                      <FieldMark src={mark} name={chapter.field} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <h2 className="font-display text-2xl tracking-tight text-ink sm:text-3xl">
                            <Link to={`/fields/${slug}`} className="hover:text-accent-dark">
                              {chapter.field}
                            </Link>
                          </h2>
                          <ViewPageLink to={`/fields/${slug}`} subject={chapter.field} />
                        </div>
                        {note ? (
                          <p className="mt-2 max-w-2xl text-sm leading-7 text-ink-soft">{note}</p>
                        ) : null}
                        <p className="mt-3 text-xs tracking-[0.14em] text-muted uppercase">
                          {chapter.skills.length}{" "}
                          {chapter.skills.length === 1 ? "skill" : "skills"}
                        </p>
                      </div>
                    </div>
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
