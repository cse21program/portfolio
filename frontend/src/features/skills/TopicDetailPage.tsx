import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Container } from "@/components/ui/Container";
import { NotFoundState } from "@/components/ui/NotFoundState";
import { GalleryLightbox } from "@/features/about/GalleryViewer";
import { getArticle } from "@/content/blog";
import { getCourse, getTutorial } from "@/content/learning";
import { Chip, KnowledgeVideo, SkillLead } from "@/features/skills/skillsUi";
import { useSkills } from "@/features/skills/useSkills";
import { fieldAnchor, findTopic } from "@/types/skills";

type RelatedItem = {
  kind: string;
  to: string;
  label: string;
};

function relatedItems(topic: {
  relatedBlogSlugs: string[];
  relatedTutorialSlugs: string[];
  relatedCourseSlugs: string[];
}): RelatedItem[] {
  const blogs = topic.relatedBlogSlugs.map((slug) => {
    const article = getArticle(slug);
    return article ? { kind: "Writing", to: `/blog/${article.slug}`, label: article.title } : null;
  });
  const tutorials = topic.relatedTutorialSlugs.map((slug) => {
    const tutorial = getTutorial(slug);
    return tutorial
      ? { kind: "Tutorial", to: `/tutorials/${tutorial.slug}`, label: tutorial.title }
      : null;
  });
  const courses = topic.relatedCourseSlugs.map((slug) => {
    const course = getCourse(slug);
    return course ? { kind: "Course", to: `/courses/${course.slug}`, label: course.title } : null;
  });
  return [...blogs, ...tutorials, ...courses].filter((item): item is RelatedItem => item !== null);
}

export function TopicDetailPage() {
  const { skillSlug = "", topicSlug = "" } = useParams();
  const { skills, loading } = useSkills();
  const match = findTopic(skills, skillSlug, topicSlug);
  const [photoIndex, setPhotoIndex] = useState<number | null>(null);
  const gallery = useMemo(() => match?.topic.images ?? [], [match]);

  useEffect(() => {
    if (!match) {
      return;
    }
    const previous = document.title;
    document.title =
      match.topic.seoTitle?.trim() || `${match.topic.title} — ${match.skill.name}`;
    return () => {
      document.title = previous;
    };
  }, [match]);

  if (loading && !match) {
    return (
      <Container className="py-16">
        <div className="h-48 animate-pulse rounded-[1.75rem] bg-paper-muted" />
      </Container>
    );
  }

  if (!match) {
    return <NotFoundState title="Topic not found" />;
  }

  const { skill, topic } = match;
  const learning = relatedItems(topic);
  const hasVideo = Boolean(topic.embedVideoUrl || topic.videoUrl);

  return (
    <>
      <section className="relative overflow-hidden border-b border-line bg-surface">
        <div className="pointer-events-none absolute -top-28 left-1/3 h-80 w-80 rounded-full bg-accent/15 blur-3xl" />
        <div className="pointer-events-none absolute right-0 bottom-0 h-56 w-56 rounded-full bg-paper-muted blur-3xl" />
        <Container
          className={`relative grid items-start gap-10 py-14 sm:py-20 ${
            hasVideo ? "lg:grid-cols-[minmax(0,1.15fr)_minmax(16rem,26rem)] lg:gap-14" : ""
          }`}
        >
          <div>
            <SkillLead
              back={{ label: skill.name, to: `/skills/${skill.slug}` }}
              field={{
                label: skill.field,
                to: `/skills#${fieldAnchor(skill.field)}`,
              }}
              trail={[
                { label: "Skills", to: "/skills" },
                { label: skill.field, to: `/skills#${fieldAnchor(skill.field)}` },
                { label: skill.name, to: `/skills/${skill.slug}` },
                { label: topic.title },
              ]}
            />
            <h1 className="mt-5 font-display text-4xl tracking-tight text-ink sm:text-5xl lg:text-6xl">
              {topic.title}
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-ink-soft">{topic.summary}</p>
          </div>
          {hasVideo ? (
            <KnowledgeVideo
              embedUrl={topic.embedVideoUrl}
              fileUrl={topic.videoUrl}
              poster={gallery[0]}
              title={`${topic.title} introduction`}
            />
          ) : null}
        </Container>
      </section>

      <section className="border-b border-line bg-paper-muted/35 py-12 sm:py-16">
        <Container className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_16.5rem]">
          <article className="space-y-8 overflow-hidden rounded-[1.75rem] border border-line bg-surface p-5 shadow-[0_1px_0_rgb(26_22_18/0.04)] sm:p-8">
            <p className="max-w-3xl text-base leading-8 text-ink-soft">{topic.overview}</p>

            {gallery.length > 0 ? (
              <section>
                <h2 className="font-display text-2xl tracking-tight text-ink">Photos</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {gallery.map((url, index) => (
                    <button
                      key={url}
                      type="button"
                      className="overflow-hidden rounded-2xl border border-line"
                      onClick={() => setPhotoIndex(index)}
                      aria-label={`View photo ${index + 1} of ${gallery.length}`}
                    >
                      <img src={url} alt="" className="aspect-[16/10] w-full object-cover" />
                    </button>
                  ))}
                </div>
              </section>
            ) : null}

            {learning.length > 0 ? (
              <section>
                <h2 className="font-display text-2xl tracking-tight text-ink">Related</h2>
                <ul className="mt-4 space-y-2">
                  {learning.map((item) => (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        className="flex items-center gap-3 rounded-2xl border border-line px-4 py-3 hover:border-accent/40"
                      >
                        <Chip>{item.kind}</Chip>
                        <span className="text-sm text-ink">{item.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <Link
              to={`/skills/${skill.slug}`}
              className="inline-flex text-sm text-accent hover:text-accent-dark"
            >
              Back to {skill.name}
            </Link>
          </article>

          <aside className="h-fit overflow-hidden rounded-[1.75rem] border border-line bg-surface shadow-[0_1px_0_rgb(26_22_18/0.04)] lg:sticky lg:top-28">
            <div className="border-b border-line bg-paper/70 px-5 py-4">
              <p className="text-xs tracking-[0.16em] text-muted uppercase">{skill.field}</p>
              <Link
                to={`/skills/${skill.slug}`}
                className="mt-1 block font-display text-xl text-ink hover:text-accent-dark"
              >
                {skill.name}
              </Link>
            </div>
            <ul>
              {skill.topics.map((item) => {
                const current = item.slug === topic.slug;
                return (
                  <li key={item.id ?? item.slug} className="border-b border-line last:border-b-0">
                    {current ? (
                      <p className="bg-accent/10 px-5 py-3 text-sm font-medium text-accent-dark">
                        {item.title}
                      </p>
                    ) : (
                      <Link
                        to={`/skills/${skill.slug}/${item.slug}`}
                        className="block px-5 py-3 text-sm text-ink hover:bg-paper"
                      >
                        {item.title}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </aside>
        </Container>
      </section>

      {photoIndex !== null && gallery.length > 0 ? (
        <GalleryLightbox
          images={gallery}
          index={photoIndex}
          onClose={() => setPhotoIndex(null)}
          onShow={setPhotoIndex}
        />
      ) : null}
    </>
  );
}
