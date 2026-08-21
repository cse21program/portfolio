import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PreviewBanner } from "@/components/content/PreviewBanner";
import { Container } from "@/components/ui/Container";
import { NotFoundState } from "@/components/ui/NotFoundState";
import { GalleryLightbox } from "@/features/about/GalleryViewer";
import { Chip, KnowledgeVideo, knowledgeHeroMediaGrid, PlayMark, SkillLead } from "@/features/skills/skillsUi";
import { ViewPageLink } from "@/components/ui/ViewPageLink";
import { useSkills } from "@/features/skills/useSkills";
import {
  fieldAnchor,
  findSkill,
  publishedTopics,
  relatedSkillsFor,
} from "@/types/skills";

export function SkillDetailPage() {
  const { skillSlug = "" } = useParams();
  const { skills, loading } = useSkills();
  const skill = findSkill(skills, skillSlug) ?? skills.find((item) => item.slug === skillSlug);
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
      {skill.published === false ? (
        <Container className="pt-8">
          <PreviewBanner status="draft" />
        </Container>
      ) : null}
      <section className="relative overflow-hidden border-b border-line bg-surface">
        <div className="pointer-events-none absolute -top-28 left-1/3 h-80 w-80 rounded-full bg-accent/15 blur-3xl" />
        <div className="pointer-events-none absolute right-0 bottom-0 h-56 w-56 rounded-full bg-paper-muted blur-3xl" />
        <Container
          className={`relative grid items-start gap-10 py-14 sm:py-20 ${
            hasVideo || hasCover ? knowledgeHeroMediaGrid : ""
          }`}
        >
          <div>
            <SkillLead
              back={{ label: "All skills", to: "/skills" }}
              field={{
                label: skill.field,
                to: `/fields/${skill.fieldSlug || fieldAnchor(skill.field).replace(/^field-/, "")}`,
              }}
              trail={[
                { label: "Skills", to: "/skills" },
                { label: skill.field, to: `/fields/${skill.fieldSlug || fieldAnchor(skill.field).replace(/^field-/, "")}` },
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

          {publishedTopics(skill.topics).length > 0 ? (
            <section className="overflow-hidden rounded-[1.75rem] border border-line bg-surface shadow-[0_1px_0_rgb(26_22_18/0.04)]">
              <header className="flex items-baseline justify-between gap-3 border-b border-line bg-paper/70 px-5 py-4 sm:px-8">
                <h2 className="font-display text-2xl tracking-tight text-ink">Topics</h2>
                <p className="text-xs tracking-[0.14em] text-muted uppercase">
                  {publishedTopics(skill.topics).length}{" "}
                  {publishedTopics(skill.topics).length === 1 ? "topic" : "topics"}
                </p>
              </header>
              <ol className="divide-y divide-line">
                {publishedTopics(skill.topics).map((topic, index) => (
                  <li
                    key={topic.id ?? topic.slug}
                    className="flex items-start justify-between gap-4 px-5 py-5 sm:px-8"
                  >
                    <div className="flex min-w-0 gap-4">
                      <span className="mt-1 w-6 shrink-0 text-xs tabular-nums text-muted">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <h3 className="font-display text-2xl text-ink">
                          <Link
                            to={`/skills/${skill.slug}/${topic.slug}`}
                            className="hover:text-accent-dark"
                          >
                            {topic.title}
                          </Link>
                        </h3>
                        <p className="mt-1 text-sm leading-7 text-ink-soft">{topic.summary}</p>
                      </div>
                    </div>
                    <ViewPageLink
                      to={`/skills/${skill.slug}/${topic.slug}`}
                      subject={topic.title}
                    />
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {related.length > 0 ? (
            <section className="overflow-hidden rounded-[1.75rem] border border-line bg-surface px-5 py-6 shadow-[0_1px_0_rgb(26_22_18/0.04)] sm:px-8">
              <h2 className="font-display text-2xl tracking-tight text-ink">Related skills</h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {related.map((item) => {
                  const itemVideo = Boolean(item.videoUrl || item.embedVideoUrl);
                  return (
                    <li key={item.id ?? item.slug}>
                      <Link
                        to={`/skills/${item.slug}`}
                        className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-1.5 text-xs text-ink transition hover:border-accent hover:text-accent-dark"
                      >
                        {itemVideo ? (
                          <PlayMark />
                        ) : (
                          <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
                        )}
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
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
