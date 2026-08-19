import { useEffect, useLayoutEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { Container } from "@/components/ui/Container";
import { NotFoundState } from "@/components/ui/NotFoundState";
import { scrollPageToId } from "@/components/layout/PageViewport";
import { GalleryLightbox } from "@/features/about/GalleryViewer";
import { toEmbedUrl } from "@/features/about/videoEmbed";
import { site } from "@/config/site";
import { getCourse } from "@/content/learning";
import { KnowledgeVideo } from "@/features/skills/skillsUi";
import {
  ActionButton,
  Chip,
  CodeBlock,
  TutorialByline,
  TutorialCard,
} from "@/features/tutorials/tutorialUi";
import { useTutorials } from "@/features/tutorials/useTutorials";
import { useSkills } from "@/features/skills/useSkills";
import {
  accessLabel,
  findTutorial,
  formatTutorialDate,
  relatedTutorials,
  sectionAnchor,
  type Tutorial,
  type TutorialSection,
} from "@/types/tutorial";

function chapterNo(index: number) {
  return String(index + 1).padStart(2, "0");
}

function sectionIndexFromHash(sections: TutorialSection[], hash: string) {
  const id = hash.replace(/^#/, "");
  if (!id) {
    return 0;
  }
  const index = sections.findIndex((section, current) => sectionAnchor(current, section.title) === id);
  return index >= 0 ? index : 0;
}

const READER_ID = "tutorial-reader";

function sectionLink(id: string) {
  return { hash: id };
}

function TutorialJsonLd({ tutorial, url }: { tutorial: Tutorial; url: string }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: tutorial.seoTitle?.trim() || tutorial.title,
    description: tutorial.seoDescription?.trim() || tutorial.description,
    educationalLevel: tutorial.difficulty,
    timeRequired: tutorial.duration || undefined,
    isAccessibleForFree: tutorial.free,
    image: tutorial.thumbnailUrl || undefined,
    url,
    author: { "@type": "Person", name: site.name },
    learningResourceType: "Tutorial",
    numberOfPages: tutorial.sections.length,
  };

  return <script type="application/ld+json">{JSON.stringify(data)}</script>;
}

function SectionMedia({ section, title }: { section: TutorialSection; title: string }) {
  const video = section.videoUrl?.trim() || null;
  const embed = video ? toEmbedUrl(video) : null;
  return (
    <KnowledgeVideo
      embedUrl={embed}
      fileUrl={embed ? null : video}
      poster={section.images?.[0]}
      title={title}
    />
  );
}

function MaterialList({
  title,
  items,
}: {
  title: string;
  items: Array<{ label: string; url: string }>;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div>
      <p className="text-xs tracking-[0.16em] text-muted uppercase">{title}</p>
      <ul className="mt-2 space-y-2">
        {items.map((item) => (
          <li key={`${item.label}-${item.url}`}>
            <a href={item.url} className="text-sm font-medium text-accent hover:text-accent-dark">
              {item.label}
              <span aria-hidden="true"> →</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function sectionHasMatter(section: TutorialSection) {
  return (
    Boolean(section.videoUrl?.trim()) ||
    (section.body ?? []).length > 0 ||
    (section.codeSnippets ?? []).length > 0 ||
    (section.images ?? []).length > 0 ||
    (section.resources ?? []).length > 0 ||
    (section.downloads ?? []).length > 0
  );
}

function TutorialSectionBody({
  section,
  lead,
  onOpenImage,
}: {
  section: TutorialSection;
  lead: boolean;
  onOpenImage: (urls: string[], index: number) => void;
}) {
  const body = section.body ?? [];
  const snippets = section.codeSnippets ?? [];
  const images = section.images ?? [];
  const resources = section.resources ?? [];
  const downloads = section.downloads ?? [];

  if (!sectionHasMatter(section)) {
    return null;
  }

  return (
    <div className="mt-6 space-y-5">
      <SectionMedia section={section} title={section.title} />
      {body.map((paragraph, paragraphIndex) => (
        <p
          key={`${paragraphIndex}-${paragraph.slice(0, 24)}`}
          className={lead && paragraphIndex === 0 ? "text-xl leading-9 text-ink" : "text-lg leading-8 text-ink-soft"}
        >
          {paragraph}
        </p>
      ))}
      {snippets.map((snippet, snippetIndex) => (
        <CodeBlock
          key={`${snippet.language}-${snippetIndex}`}
          label={snippet.label}
          language={snippet.language}
          code={snippet.code}
        />
      ))}
      {images.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {images.map((imageUrl, imageIndex) => (
            <button
              key={imageUrl}
              type="button"
              className="overflow-hidden rounded-2xl border border-line"
              onClick={() => onOpenImage(images, imageIndex)}
              aria-label={`View image ${imageIndex + 1} of ${images.length}`}
            >
              <img src={imageUrl} alt="" className="aspect-[16/10] w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
      <MaterialList title="Resources" items={resources} />
      <MaterialList title="Downloads" items={downloads} />
    </div>
  );
}

export function TutorialDetailPage() {
  const { slug = "" } = useParams();
  const { hash } = useLocation();
  const navigate = useNavigate();
  const { tutorials, loading } = useTutorials();
  const { skills } = useSkills();
  const tutorial = findTutorial(tutorials, slug);
  const related = tutorial ? relatedTutorials(tutorial, tutorials) : [];
  const [copied, setCopied] = useState(false);
  const [photo, setPhoto] = useState<{ urls: string[]; index: number } | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!tutorial) {
      return;
    }
    const previous = document.title;
    document.title = tutorial.seoTitle?.trim() || `${tutorial.title} — Tutorials`;
    const description = tutorial.seoDescription?.trim() || tutorial.description;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", description);
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    const href =
      tutorial.canonicalUrl?.trim() ||
      (typeof window === "undefined"
        ? `/tutorials/${tutorial.slug}`
        : `${window.location.origin}/tutorials/${tutorial.slug}`);
    canonical.setAttribute("href", href);
    return () => {
      document.title = previous;
    };
  }, [tutorial]);

  useLayoutEffect(() => {
    if (!tutorial || !hash) {
      return;
    }
    const id = decodeURIComponent(hash.replace(/^#/, ""));
    setActiveIndex(sectionIndexFromHash(tutorial.sections, hash));
    scrollPageToId(id);
  }, [tutorial, hash]);

  if (loading && !tutorial) {
    return (
      <Container className="space-y-6 py-16">
        <div className="h-10 w-64 animate-pulse rounded-full bg-paper-muted" />
        <div className="h-40 animate-pulse rounded-[1.75rem] bg-paper-muted" />
      </Container>
    );
  }

  if (!tutorial) {
    return <NotFoundState title="Tutorial not found" />;
  }

  const url =
    typeof window === "undefined"
      ? `/tutorials/${tutorial.slug}`
      : `${window.location.origin}/tutorials/${tutorial.slug}`;
  const cover = tutorial.thumbnailUrl?.trim() || null;
  const title = tutorial.title;
  const excerpt = tutorial.description;
  const access = accessLabel(tutorial);
  const published = formatTutorialDate(tutorial.publishedAt ?? "");
  const firstSectionId = sectionAnchor(0, tutorial.sections[0]?.title ?? "");
  const skillRecord = skills.find(
    (item) => item.name === tutorial.skill || item.slug === tutorial.skill.toLowerCase(),
  );
  const relatedSkills = (tutorial.relatedSkillSlugs ?? [])
    .map((skillSlug) => skills.find((item) => item.slug === skillSlug))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const relatedCourses = (tutorial.relatedCourseSlugs ?? [])
    .map((courseSlug) => getCourse(courseSlug))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const sectionCount = `${tutorial.sections.length} ${tutorial.sections.length === 1 ? "section" : "sections"}`;
  const safeIndex =
    tutorial.sections.length === 0 ? 0 : Math.min(Math.max(activeIndex, 0), tutorial.sections.length - 1);
  const currentSection = tutorial.sections[safeIndex];
  const previousSection = safeIndex > 0 ? tutorial.sections[safeIndex - 1] : undefined;
  const nextSection = safeIndex < tutorial.sections.length - 1 ? tutorial.sections[safeIndex + 1] : undefined;

  function openSection(index: number) {
    const section = tutorial.sections[index];
    if (!section) {
      return;
    }
    const id = sectionAnchor(index, section.title);
    setActiveIndex(index);
    if (hash.replace(/^#/, "") !== id) {
      navigate({ hash: id }, { replace: true });
    }
    scrollPageToId(id);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  async function shareTutorial() {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text: excerpt, url });
        return;
      } catch {
        // Fall through to copy if the visitor cancels or share is unavailable.
      }
    }
    await copyLink();
  }

  const metaBits = [tutorial.difficulty, access, tutorial.duration, sectionCount, published].filter(Boolean);

  return (
    <>
      <TutorialJsonLd tutorial={tutorial} url={url} />
      <section className="relative overflow-hidden border-b border-line bg-surface">
        <div className="pointer-events-none absolute -top-28 left-1/3 h-80 w-80 rounded-full bg-accent/15 blur-3xl" />
        <Container className="relative pt-10 pb-8 sm:pt-12">
          <Link to="/tutorials" className="text-sm font-medium text-accent hover:text-accent-dark">
            ← All tutorials
          </Link>
          <p className="mt-5 text-xs tracking-[0.16em] text-accent uppercase">
            {tutorial.difficulty}
            {access ? ` · ${access}` : ""}
          </p>
          <div className="mt-3 grid items-end gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)]">
            <div>
              <h1 className="font-display text-4xl tracking-tight text-ink sm:text-5xl">{tutorial.title}</h1>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-ink-soft">{tutorial.description}</p>
              <div className="mt-5">
                <TutorialByline tutorial={tutorial} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Chip accent>{access}</Chip>
                {tutorial.skill ? (
                  skillRecord ? (
                    <Link to={`/skills/${skillRecord.slug}`}>
                      <Chip>{skillRecord.name}</Chip>
                    </Link>
                  ) : (
                    <Chip>{tutorial.skill}</Chip>
                  )
                ) : null}
              </div>
            </div>
            {cover ? (
              <img
                src={cover}
                alt=""
                className="aspect-[16/10] w-full rounded-[1.5rem] border border-line object-cover"
              />
            ) : (
              <p className="text-sm leading-7 text-muted lg:text-right">{metaBits.join(" · ")}</p>
            )}
          </div>
          {tutorial.prerequisites && tutorial.prerequisites.length > 0 ? (
            <p className="mt-5 max-w-2xl text-sm leading-7 text-ink-soft">
              <span className="font-medium text-ink">Before you start. </span>
              {tutorial.prerequisites.join(" · ")}
            </p>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-3">
            {tutorial.sections.length > 0 ? (
              <Link
                to={sectionLink(firstSectionId)}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition hover:bg-accent"
                onClick={(event) => {
                  event.preventDefault();
                  openSection(0);
                }}
              >
                Start tutorial
              </Link>
            ) : null}
            <ActionButton primary={tutorial.sections.length === 0} onClick={() => void shareTutorial()}>
              Share
            </ActionButton>
            <ActionButton onClick={() => void copyLink()}>
              {copied ? "Link copied" : "Copy link"}
            </ActionButton>
          </div>
        </Container>

        <Container className="relative grid items-start gap-6 pb-14 lg:grid-cols-[15.5rem_minmax(0,1fr)] lg:gap-10 lg:pb-16">
          <nav
            className="rounded-[1.5rem] border border-line bg-paper/70 lg:sticky lg:top-24 lg:col-start-1 lg:row-start-1"
            aria-label="Tutorial contents"
          >
            <div className="flex items-baseline justify-between gap-3 border-b border-line px-4 py-3">
              <p className="text-xs tracking-[0.16em] text-accent uppercase">Contents</p>
              <p className="text-xs text-muted">{sectionCount}</p>
            </div>
            {tutorial.sections.length > 0 ? (
              <ol className="py-2">
                {tutorial.sections.map((section, index) => {
                    const id = sectionAnchor(index, section.title);
                    const current = index === safeIndex;
                    return (
                      <li key={id}>
                        <Link
                          to={sectionLink(id)}
                          aria-current={current ? "true" : undefined}
                          className={`flex gap-3 border-l-2 px-4 py-2.5 text-sm transition ${
                            current
                              ? "border-accent bg-accent/10 font-medium text-ink"
                              : "border-transparent text-ink-soft hover:text-ink"
                          }`}
                          onClick={(event) => {
                            event.preventDefault();
                            openSection(index);
                          }}
                        >
                          <span className={`tabular-nums ${current ? "text-accent" : "text-muted"}`}>
                            {chapterNo(index)}
                          </span>
                          <span className="min-w-0 leading-5">{section.title}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ol>
            ) : (
              <p className="px-4 py-3 text-sm text-muted">No sections yet.</p>
            )}
          </nav>

          {currentSection ? (
            <div className="relative min-w-0 lg:col-start-2 lg:row-start-1">
              {tutorial.sections.map((section, index) => {
                const id = sectionAnchor(index, section.title);
                return (
                  <span key={id} id={id} className="pointer-events-none absolute top-0 left-0 h-px w-px" />
                );
              })}
              <article
                id={READER_ID}
                className="rounded-[1.5rem] border border-line bg-paper/40 px-5 py-7 sm:px-8 sm:py-9"
                aria-labelledby="tutorial-section-title"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs tracking-[0.16em] text-muted uppercase">
                    {chapterNo(safeIndex)} / {chapterNo(Math.max(tutorial.sections.length - 1, 0))}
                  </p>
                  {tutorial.sections.length > 1 ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-sm text-ink transition hover:border-accent/40 disabled:cursor-not-allowed disabled:opacity-30"
                        disabled={!previousSection}
                        aria-label={previousSection ? `Previous: ${previousSection.title}` : "No previous section"}
                        onClick={() => previousSection && openSection(safeIndex - 1)}
                      >
                        ←
                      </button>
                      <button
                        type="button"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-sm text-ink transition hover:border-accent/40 disabled:cursor-not-allowed disabled:opacity-30"
                        disabled={!nextSection}
                        aria-label={nextSection ? `Next: ${nextSection.title}` : "No next section"}
                        onClick={() => nextSection && openSection(safeIndex + 1)}
                      >
                        →
                      </button>
                    </div>
                  ) : null}
                </div>
                <h2
                  id="tutorial-section-title"
                  className="mt-5 font-display text-3xl tracking-tight text-ink sm:text-4xl"
                >
                  {currentSection.title}
                </h2>
                {currentSection.summary ? (
                  <p className="mt-3 text-lg leading-8 text-ink-soft">{currentSection.summary}</p>
                ) : null}
                <TutorialSectionBody
                  section={currentSection}
                  lead={safeIndex === 0}
                  onOpenImage={(urls, index) => setPhoto({ urls, index })}
                />
                {tutorial.sections.length > 1 ? (
                  <div className="mt-10 flex flex-wrap items-stretch justify-between gap-3 border-t border-line pt-6">
                    {previousSection ? (
                      <Link
                        to={sectionLink(sectionAnchor(safeIndex - 1, previousSection.title))}
                        className="min-w-[12rem] flex-1 rounded-2xl border border-line bg-surface px-4 py-3 transition hover:border-accent/40"
                        onClick={(event) => {
                          event.preventDefault();
                          openSection(safeIndex - 1);
                        }}
                      >
                        <p className="text-xs tracking-[0.14em] text-muted uppercase">Previous</p>
                        <p className="mt-1 text-sm font-medium text-ink">{previousSection.title}</p>
                      </Link>
                    ) : (
                      <span className="hidden flex-1 sm:block" />
                    )}
                    {nextSection ? (
                      <Link
                        to={sectionLink(sectionAnchor(safeIndex + 1, nextSection.title))}
                        className="min-w-[12rem] flex-1 rounded-2xl border border-line bg-surface px-4 py-3 text-right transition hover:border-accent/40"
                        onClick={(event) => {
                          event.preventDefault();
                          openSection(safeIndex + 1);
                        }}
                      >
                        <p className="text-xs tracking-[0.14em] text-muted uppercase">Next</p>
                        <p className="mt-1 text-sm font-medium text-ink">{nextSection.title}</p>
                      </Link>
                    ) : (
                      <span className="hidden flex-1 sm:block" />
                    )}
                  </div>
                ) : null}
              </article>
            </div>
          ) : null}
        </Container>
      </section>

      {related.length > 0 || relatedCourses.length > 0 || relatedSkills.length > 0 ? (
        <section className="border-b border-line py-14 sm:py-16">
          <Container className="space-y-12">
            {relatedCourses.length > 0 ? (
              <div>
                <h2 className="font-display text-3xl tracking-tight text-ink">Related courses</h2>
                <p className="mt-2 text-sm text-ink-soft">A longer path if you want the same ground as a course.</p>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {relatedCourses.map((item) => (
                    <Link
                      key={item.slug}
                      to={`/courses/${item.slug}`}
                      className="flex flex-col rounded-[1.5rem] border border-line bg-surface p-5 transition hover:border-accent/40"
                    >
                      <p className="text-xs text-accent">Course</p>
                      <h3 className="mt-2 font-display text-2xl text-ink">{item.title}</h3>
                      <p className="mt-2 flex-1 text-sm leading-6 text-ink-soft">{item.subtitle}</p>
                      <p className="mt-4 text-sm font-medium text-accent">
                        View course
                        <span aria-hidden="true"> →</span>
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

            {relatedSkills.length > 0 ? (
              <div>
                <h2 className="font-display text-3xl tracking-tight text-ink">Related skills</h2>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {relatedSkills.map((item) => (
                    <li key={item.slug}>
                      <Link
                        to={`/skills/${item.slug}`}
                        className="rounded-full border border-line bg-surface px-4 py-2 text-sm text-ink hover:border-accent/40"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {related.length > 0 ? (
              <div>
                <h2 className="font-display text-3xl tracking-tight text-ink">Related</h2>
                <p className="mt-2 text-sm text-ink-soft">Keep going if this walkthrough was useful.</p>
                <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {related.map((item) => (
                    <TutorialCard key={item.slug} tutorial={item} />
                  ))}
                </div>
              </div>
            ) : null}
          </Container>
        </section>
      ) : null}

      <section className="border-b border-line bg-paper-muted/35 py-12 sm:py-16">
        <Container className="flex max-w-3xl flex-wrap items-center justify-between gap-6">
          <TutorialByline tutorial={tutorial} />
          <Link to="/about" className="text-sm font-medium text-accent hover:text-accent-dark">
            More about {site.shortName} →
          </Link>
        </Container>
      </section>

      {photo ? (
        <GalleryLightbox
          images={photo.urls}
          index={photo.index}
          onClose={() => setPhoto(null)}
          onShow={(index) => setPhoto((current) => (current ? { ...current, index } : current))}
        />
      ) : null}
    </>
  );
}
