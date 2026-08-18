import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Container } from "@/components/ui/Container";
import { NotFoundState } from "@/components/ui/NotFoundState";
import { Chip, KnowledgeVideo, SkillLead } from "@/features/skills/skillsUi";
import { useFields } from "@/features/skills/useFields";
import { useSkills } from "@/features/skills/useSkills";
import { fieldIntroFromField, findField } from "@/types/fields";
import { fieldAnchor, publishedSkills } from "@/types/skills";

export function FieldDetailPage() {
  const { fieldSlug = "" } = useParams();
  const { fields, loading: fieldsLoading } = useFields();
  const { skills, loading: skillsLoading } = useSkills();
  const field = findField(fields, fieldSlug);
  const listed = publishedSkills(skills).filter(
    (item) => item.fieldSlug === fieldSlug || item.field === field?.name,
  );
  const intro = field ? fieldIntroFromField(field) : null;
  const loading = fieldsLoading || skillsLoading;

  useEffect(() => {
    if (!field) {
      return;
    }
    const previous = document.title;
    document.title = field.seoTitle?.trim() || `${field.name} — Skills`;
    return () => {
      document.title = previous;
    };
  }, [field]);

  if (loading && !field) {
    return (
      <Container className="py-16">
        <div className="h-48 animate-pulse rounded-[1.75rem] bg-paper-muted" />
      </Container>
    );
  }

  if (!field) {
    return <NotFoundState title="Field not found" />;
  }

  const mark = field.iconUrl || field.thumbnailUrl;

  return (
    <>
      <section className="relative overflow-hidden border-b border-line bg-surface">
        {field.bannerUrl ? (
          <img src={field.bannerUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-[0.14]" />
        ) : (
          <>
            <div className="pointer-events-none absolute -top-28 left-1/3 h-80 w-80 rounded-full bg-accent/15 blur-3xl" />
            <div className="pointer-events-none absolute right-0 bottom-0 h-56 w-56 rounded-full bg-paper-muted blur-3xl" />
          </>
        )}
        <Container
          className={`relative grid items-start gap-10 py-14 sm:py-20 ${
            intro ? "lg:grid-cols-[minmax(0,1.15fr)_minmax(16rem,26rem)] lg:gap-14" : ""
          }`}
        >
          <div>
            <SkillLead
              back={{ label: "All skills", to: "/skills" }}
              field={{ label: field.name, to: `/skills#${fieldAnchor(field.slug)}` }}
              trail={[
                { label: "Skills", to: "/skills" },
                { label: field.name },
              ]}
            />
            <div className="mt-5 flex items-start gap-4">
              {mark ? (
                <img
                  src={mark}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-2xl border border-line object-cover"
                />
              ) : null}
              <h1 className="font-display text-4xl tracking-tight text-ink sm:text-5xl lg:text-6xl">
                {field.name}
              </h1>
            </div>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-ink-soft">{field.summary}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {field.featured ? <Chip accent>Featured</Chip> : null}
              <Chip>
                {listed.length} {listed.length === 1 ? "skill" : "skills"}
              </Chip>
            </div>
          </div>
          {intro ? (
            <KnowledgeVideo
              embedUrl={intro.embedUrl}
              fileUrl={intro.fileUrl}
              poster={field.thumbnailUrl}
              title={intro.title}
            />
          ) : null}
        </Container>
      </section>

      <section className="border-b border-line bg-paper-muted/35 py-12 sm:py-16">
        <Container className="space-y-8">
          {field.overview ? (
            <p className="max-w-3xl text-base leading-8 text-ink-soft">{field.overview}</p>
          ) : null}

          {listed.length > 0 ? (
            <section className="overflow-hidden rounded-[1.75rem] border border-line bg-surface shadow-[0_1px_0_rgb(26_22_18/0.04)]">
              <header className="flex items-baseline justify-between gap-3 border-b border-line bg-paper/70 px-5 py-4 sm:px-8">
                <h2 className="font-display text-2xl tracking-tight text-ink">Skills</h2>
                <p className="text-xs tracking-[0.14em] text-muted uppercase">
                  {listed.length} {listed.length === 1 ? "skill" : "skills"}
                </p>
              </header>
              <ol className="divide-y divide-line">
                {listed.map((skill, index) => (
                  <li key={skill.id ?? skill.slug}>
                    <Link
                      to={`/skills/${skill.slug}`}
                      className="flex items-start justify-between gap-4 px-5 py-5 transition hover:bg-paper sm:px-8"
                    >
                      <span className="flex min-w-0 gap-4">
                        <span className="mt-1 w-6 shrink-0 text-xs tabular-nums text-muted">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span>
                          <span className="font-display text-2xl text-ink">{skill.name}</span>
                          <span className="mt-1 block text-sm leading-7 text-ink-soft">
                            {skill.summary}
                          </span>
                        </span>
                      </span>
                      <span className="mt-2 shrink-0 text-sm font-medium text-accent">Open →</span>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          ) : (
            <p className="text-sm text-ink-soft">Skills in this field will appear here once they are published.</p>
          )}
        </Container>
      </section>
    </>
  );
}
