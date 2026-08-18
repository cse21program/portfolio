import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Container } from "@/components/ui/Container";
import { NotFoundState } from "@/components/ui/NotFoundState";
import { GalleryLightbox } from "@/features/about/GalleryViewer";
import { Chip, KnowledgeVideo, SkillLead } from "@/features/skills/skillsUi";
import { useSkills } from "@/features/skills/useSkills";
import { fieldAnchor, findSkill, relatedSkillsFor } from "@/types/skills";

export function SkillDetailPage() {
  const { skillSlug = "" } = useParams();
  const { skills, loading } = useSkills();
  const skill = findSkill(skills, skillSlug);
  const related = skill ? relatedSkillsFor(skill, skills) : [];
  const [photoOpen, setPhotoOpen] = useState(false);
  const gallery = useMemo(() => (skill?.imageUrl ? [skill.imageUrl] : []), [skill]);
  const hasVideo = Boolean(skill?.embedVideoUrl || skill?.videoUrl);
  const hasCover = Boolean(!hasVideo && skill?.imageUrl);

  useEffect(() => {
    if (!skill) {
      return;
    }
    const previous = document.title;
    document.title = skill.seoTitle?.trim() || `${skill.name} — Skills`;
    return () => {
      document.title = previous;
    };
  }, [skill]);

  if (loading && !skill) {
    return (
      <Container className="py-16">
        <div className="h-48 animate-pulse rounded-[1.75rem] bg-paper-muted" />
      </Container>
    );
  }

  if (!skill) {
    return <NotFoundState title="Skill not found" />;
  }

  return (
    <>
      <section className="relative overflow-hidden border-b border-line bg-surface">
        <div className="pointer-events-none absolute -top-28 left-1/3 h-80 w-80 rounded-full bg-accent/15 blur-3xl" />
        <div className="pointer-events-none absolute right-0 bottom-0 h-56 w-56 rounded-full bg-paper-muted blur-3xl" />
        <Container
          className={`relative grid items-start gap-10 py-14 sm:py-20 ${
            hasVideo || hasCover
              ? "lg:grid-cols-[minmax(0,1.15fr)_minmax(16rem,26rem)] lg:gap-14"
              : ""
          }`}
        >
          <div>
            <SkillLead
              back={{ label: "All skills", to: "/skills" }}
              field={{
                label: skill.field,
                to: `/skills#${fieldAnchor(skill.field)}`,
              }}
              trail={[
                { label: "Skills", to: "/skills" },
                { label: skill.field, to: `/skills#${fieldAnchor(skill.field)}` },
                { label: skill.name },
              ]}
            />
            <h1 className="mt-5 font-display text-4xl tracking-tight text-ink sm:text-5xl lg:text-6xl">
              {skill.name}
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-ink-soft">{skill.summary}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {skill.level ? <Chip accent>{skill.level}</Chip> : null}
              {skill.years ? <Chip>{skill.years}</Chip> : null}
            </div>
          </div>
          {hasVideo ? (
            <KnowledgeVideo
              embedUrl={skill.embedVideoUrl}
              fileUrl={skill.videoUrl}
              poster={skill.imageUrl}
              title={`${skill.name} introduction`}
            />
          ) : hasCover ? (
            <button
              type="button"
              className="overflow-hidden rounded-[1.75rem] border border-line bg-paper p-1.5 text-left shadow-[0_1px_0_rgb(26_22_18/0.04)] sm:p-2"
              onClick={() => setPhotoOpen(true)}
            >
              <img
                src={gallery[0]}
                alt=""
                className="aspect-video w-full rounded-[1.25rem] object-cover"
              />
            </button>
          ) : null}
        </Container>
      </section>

      <section className="border-b border-line bg-paper-muted/35 py-12 sm:py-16">
        <Container className="space-y-8">
          {skill.overview ? (
            <p className="max-w-3xl text-base leading-8 text-ink-soft">{skill.overview}</p>
          ) : null}

          {skill.topics.length > 0 ? (
            <section className="overflow-hidden rounded-[1.75rem] border border-line bg-surface shadow-[0_1px_0_rgb(26_22_18/0.04)]">
              <header className="flex items-baseline justify-between gap-3 border-b border-line bg-paper/70 px-5 py-4 sm:px-8">
                <h2 className="font-display text-2xl tracking-tight text-ink">Topics</h2>
                <p className="text-xs tracking-[0.14em] text-muted uppercase">
                  {skill.topics.length} {skill.topics.length === 1 ? "topic" : "topics"}
                </p>
              </header>
              <ol className="divide-y divide-line">
                {skill.topics.map((topic, index) => (
                  <li key={topic.id ?? topic.slug}>
                    <Link
                      to={`/skills/${skill.slug}/${topic.slug}`}
                      className="flex items-start justify-between gap-4 px-5 py-5 transition hover:bg-paper sm:px-8"
                    >
                      <span className="flex min-w-0 gap-4">
                        <span className="mt-1 w-6 shrink-0 text-xs tabular-nums text-muted">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span>
                          <span className="font-display text-2xl text-ink">{topic.title}</span>
                          <span className="mt-1 block text-sm leading-7 text-ink-soft">
                            {topic.summary}
                          </span>
                        </span>
                      </span>
                      <span className="mt-2 shrink-0 text-sm font-medium text-accent">Read →</span>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {related.length > 0 ? (
            <section className="overflow-hidden rounded-[1.75rem] border border-line bg-surface px-5 py-6 shadow-[0_1px_0_rgb(26_22_18/0.04)] sm:px-8">
              <h2 className="font-display text-2xl tracking-tight text-ink">Related skills</h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {related.map((item) => (
                  <li key={item.id ?? item.slug}>
                    <Link
                      to={`/skills/${item.slug}`}
                      className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-4 py-2 text-sm text-ink transition hover:border-accent"
                    >
                      <span className="text-muted">{item.field}</span>
                      <span>{item.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </Container>
      </section>

      {photoOpen && gallery.length > 0 ? (
        <GalleryLightbox
          images={gallery}
          index={0}
          onClose={() => setPhotoOpen(false)}
          onShow={() => undefined}
        />
      ) : null}
    </>
  );
}
