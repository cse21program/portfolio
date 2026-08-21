import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useMatch, useParams } from "react-router-dom";
import { PreviewBanner } from "@/components/content/PreviewBanner";
import { RichText } from "@/components/content/RichText";
import { Container } from "@/components/ui/Container";
import { NotFoundState } from "@/components/ui/NotFoundState";
import { GalleryLightbox } from "@/features/about/GalleryViewer";
import { getArticle } from "@/content/blog";
import { getCertificate } from "@/content/certificates";
import { getCourse, getTutorial } from "@/content/learning";
import { getProject } from "@/content/projects";
import { Chip, KnowledgeVideo, knowledgeHeroMediaGrid, SkillLead } from "@/features/skills/skillsUi";
import { useTopics } from "@/features/skills/useTopics";
import { useCertificates } from "@/features/certificates/useCertificates";
import { findCertificate } from "@/types/certificates";
import { useCourses } from "@/features/courses/useCourses";
import { useTutorials } from "@/features/tutorials/useTutorials";
import { findCourse } from "@/types/course";
import { fieldAnchor } from "@/types/skills";
import { findTutorial } from "@/types/tutorial";
import {
  findKnowledgeTopic,
  findUniqueTopicBySlug,
  siblingTopics,
  topicBodyParagraphs,
  topicCanonicalPath,
  type KnowledgeTopic,
} from "@/types/topics";

type RelatedItem = {
  to: string;
  label: string;
};

function relatedFrom(
  slugs: string[] | undefined,
  lookup: (slug: string) => { slug: string; title: string } | undefined,
  to: (slug: string) => string,
): RelatedItem[] {
  return (slugs ?? [])
    .map((slug) => {
      const item = lookup(slug);
      return item ? { to: to(item.slug), label: item.title } : null;
    })
    .filter((item): item is RelatedItem => item !== null);
}

function TopicJsonLd({ topic, url }: { topic: KnowledgeTopic; url: string }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: topic.seoTitle?.trim() || topic.title,
    description: topic.seoDescription?.trim() || topic.summary,
    about: topic.skill,
    educationalLevel: topic.field,
    url,
  };

  return <script type="application/ld+json">{JSON.stringify(data)}</script>;
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id}>
      <h2 className="font-display text-2xl tracking-tight text-ink">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function RelatedSection({ id, title, items }: { id: string; title: string; items: RelatedItem[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <Section id={id} title={title}>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={`${item.to}-${item.label}`}>
            <Link
              to={item.to}
              className="flex items-center justify-between gap-3 rounded-2xl border border-line px-4 py-3 text-sm text-ink hover:border-accent/40"
            >
              {item.label}
              <span className="text-accent" aria-hidden="true">
                View →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function LinkSection({
  id,
  title,
  items,
}: {
  id: string;
  title: string;
  items: Array<{ label: string; url: string }>;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <Section id={id} title={title}>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={`${item.label}-${item.url}`}>
            <a
              href={item.url}
              className="flex items-center justify-between gap-3 rounded-2xl border border-line px-4 py-3 text-sm text-ink hover:border-accent/40"
              rel="noreferrer"
              target="_blank"
            >
              {item.label}
              <span className="text-accent" aria-hidden="true">
                Open →
              </span>
            </a>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function TopicDetailPage() {
  const { skillSlug = "", topicSlug = "" } = useParams();
  const underSkill = Boolean(useMatch("/skills/:skillSlug/:topicSlug"));
  const { topics, loading } = useTopics();
  const { certificates: liveCertificates } = useCertificates();
  const { tutorials: liveTutorials } = useTutorials();
  const { courses: liveCourses } = useCourses();
  const [photoIndex, setPhotoIndex] = useState<number | null>(null);

  const topic = useMemo(() => {
    if (skillSlug && topicSlug) {
      return (
        findKnowledgeTopic(topics, skillSlug, topicSlug) ??
        topics.find((item) => item.skillSlug === skillSlug && item.slug === topicSlug)
      );
    }
    const unique = topicSlug || skillSlug;
    return findUniqueTopicBySlug(topics, unique) ?? topics.find((item) => item.slug === unique);
  }, [skillSlug, topicSlug, topics]);

  const siblings = topic ? siblingTopics(topics, topic) : [];
  const gallery = topic?.images ?? [];
  const paragraphs = topicBodyParagraphs(topic?.body ?? "");
  const snippets = topic?.codeSnippets ?? [];
  const writing = relatedFrom(topic?.relatedBlogSlugs, getArticle, (slug) => `/blog/${slug}`);
  const tutorials = relatedFrom(
    topic?.relatedTutorialSlugs,
    (slug) => findTutorial(liveTutorials, slug) ?? getTutorial(slug),
    (slug) => `/tutorials/${slug}`,
  );
  const courses = relatedFrom(
    topic?.relatedCourseSlugs,
    (slug) => findCourse(liveCourses, slug) ?? getCourse(slug),
    (slug) => `/courses/${slug}`,
  );
  const projects = relatedFrom(topic?.relatedProjectSlugs, getProject, (slug) => `/projects/${slug}`);
  const certificates = relatedFrom(
    topic?.relatedCertificateSlugs,
    (slug) => findCertificate(liveCertificates, slug) ?? getCertificate(slug),
    (slug) => `/certificates/${slug}`,
  );
  const resources = topic?.resources ?? [];
  const externalLinks = topic?.externalLinks ?? [];
  const hasVideo = Boolean(topic?.embedVideoUrl || topic?.videoUrl);
  const canonical = topic ? topicCanonicalPath(topic) : "";
  const fieldHref = topic
    ? `/fields/${topic.fieldSlug || fieldAnchor(topic.field).replace(/^field-/, "")}`
    : "/skills";

  const jumps = [
    topic?.overview?.trim() ? { id: "overview", label: "Overview" } : null,
    paragraphs.length > 0 ? { id: "text", label: "Text" } : null,
    snippets.length > 0 ? { id: "code", label: "Code" } : null,
    gallery.length > 0 ? { id: "photos", label: "Images" } : null,
    writing.length > 0 ? { id: "writing", label: "Blog" } : null,
    tutorials.length > 0 ? { id: "tutorials", label: "Tutorials" } : null,
    courses.length > 0 ? { id: "courses", label: "Courses" } : null,
    projects.length > 0 ? { id: "projects", label: "Projects" } : null,
    certificates.length > 0 ? { id: "certificates", label: "Certificates" } : null,
    resources.length > 0 ? { id: "resources", label: "Resources" } : null,
    externalLinks.length > 0 ? { id: "links", label: "Links" } : null,
  ].filter((item): item is { id: string; label: string } => item !== null);

  useEffect(() => {
    if (!topic) {
      return;
    }
    const previous = document.title;
    document.title = topic.seoTitle?.trim() || `${topic.title} — ${topic.skill}`;
    const description = topic.seoDescription?.trim() || topic.summary;
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
  }, [topic]);

  if (loading && !topic) {
    return (
      <Container className="py-16">
        <div className="h-48 animate-pulse rounded-[1.75rem] bg-paper-muted" />
      </Container>
    );
  }

  if (!topic) {
    return <NotFoundState title="Topic not found" />;
  }

  function hrefFor(item: KnowledgeTopic) {
    return underSkill
      ? `/skills/${item.skillSlug}/${item.slug}`
      : `/topics/${item.skillSlug}/${item.slug}`;
  }

  return (
    <>
      <TopicJsonLd topic={topic} url={canonical} />
      {topic.published === false ? (
        <Container className="pt-8">
          <PreviewBanner status="draft" />
        </Container>
      ) : null}
      <section className="relative overflow-hidden border-b border-line bg-surface">
        <div className="pointer-events-none absolute -top-28 left-1/3 h-80 w-80 rounded-full bg-accent/15 blur-3xl" />
        <div className="pointer-events-none absolute right-0 bottom-0 h-56 w-56 rounded-full bg-paper-muted blur-3xl" />
        <Container
          className={`relative grid items-start gap-10 py-14 sm:py-20 ${
            hasVideo ? knowledgeHeroMediaGrid : ""
          }`}
        >
          <div>
            <SkillLead
              back={{ label: topic.skill, to: `/skills/${topic.skillSlug}` }}
              field={{ label: topic.field, to: fieldHref }}
              trail={[
                { label: "Skills", to: "/skills" },
                { label: topic.field, to: fieldHref },
                { label: topic.skill, to: `/skills/${topic.skillSlug}` },
                { label: topic.title },
              ]}
            />
            <h1 className="mt-5 font-display text-4xl tracking-tight text-ink sm:text-5xl lg:text-6xl">
              {topic.title}
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-ink-soft">{topic.summary}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Chip accent>{topic.skill}</Chip>
              {topic.field ? <Chip>{topic.field}</Chip> : null}
            </div>
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
            {topic.overview.trim() ? (
              <Section id="overview" title="Overview">
                <p className="max-w-3xl text-base leading-8 text-ink-soft">{topic.overview}</p>
              </Section>
            ) : null}

            {paragraphs.length > 0 ? (
              <Section id="text" title="Text">
                <div className="max-w-3xl">
                  <RichText paragraphs={paragraphs} />
                </div>
              </Section>
            ) : null}

            {snippets.length > 0 ? (
              <Section id="code" title="Code">
                <ul className="space-y-4">
                  {snippets.map((snippet, index) => (
                    <li key={`${snippet.language}-${index}`} className="overflow-hidden rounded-2xl border border-line">
                      <div className="flex items-center justify-between gap-3 border-b border-line bg-paper/70 px-4 py-2">
                        <p className="text-sm text-ink">{snippet.label || "Snippet"}</p>
                        <p className="text-xs tracking-[0.14em] text-muted uppercase">{snippet.language}</p>
                      </div>
                      <pre className="overflow-x-auto bg-ink px-4 py-4 text-sm leading-7 text-paper">
                        <code>{snippet.code}</code>
                      </pre>
                    </li>
                  ))}
                </ul>
              </Section>
            ) : null}

            {gallery.length > 0 ? (
              <Section id="photos" title="Images">
                <div className="grid gap-4 sm:grid-cols-2">
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
              </Section>
            ) : null}

            <RelatedSection id="writing" title="Blog" items={writing} />
            <RelatedSection id="tutorials" title="Tutorials" items={tutorials} />
            <RelatedSection id="courses" title="Courses" items={courses} />
            <RelatedSection id="projects" title="Projects" items={projects} />
            <RelatedSection id="certificates" title="Certificates" items={certificates} />
            <LinkSection id="resources" title="Resources" items={resources} />
            <LinkSection id="links" title="Links" items={externalLinks} />

            <Link
              to={`/skills/${topic.skillSlug}`}
              className="inline-flex text-sm text-accent hover:text-accent-dark"
            >
              Back to {topic.skill}
            </Link>
          </article>

          <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
            {jumps.length > 0 ? (
              <nav
                className="overflow-hidden rounded-[1.75rem] border border-line bg-surface shadow-[0_1px_0_rgb(26_22_18/0.04)]"
                aria-label="On this page"
              >
                <div className="border-b border-line bg-paper/70 px-5 py-4">
                  <p className="text-xs tracking-[0.16em] text-muted uppercase">On this page</p>
                </div>
                <ul>
                  {jumps.map((item) => (
                    <li key={item.id} className="border-b border-line last:border-b-0">
                      <a
                        href={`#${item.id}`}
                        className="block px-5 py-3 text-sm text-ink hover:bg-paper"
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            ) : null}

            <div className="overflow-hidden rounded-[1.75rem] border border-line bg-surface shadow-[0_1px_0_rgb(26_22_18/0.04)]">
              <div className="border-b border-line bg-paper/70 px-5 py-4">
                <p className="text-xs tracking-[0.16em] text-muted uppercase">{topic.field}</p>
                <Link
                  to={`/skills/${topic.skillSlug}`}
                  className="mt-1 block font-display text-xl text-ink hover:text-accent-dark"
                >
                  {topic.skill}
                </Link>
              </div>
              <ul>
                {siblings.map((item) => {
                  const current = item.slug === topic.slug;
                  return (
                    <li key={item.id ?? `${item.skillSlug}-${item.slug}`} className="border-b border-line last:border-b-0">
                      {current ? (
                        <p className="bg-accent/10 px-5 py-3 text-sm font-medium text-accent-dark">
                          {item.title}
                        </p>
                      ) : (
                        <Link
                          to={hrefFor(item)}
                          className="block px-5 py-3 text-sm text-ink hover:bg-paper"
                        >
                          {item.title}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
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
