import { useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { PreviewBanner } from "@/components/content/PreviewBanner";
import { CatalogStoppedBanner } from "@/components/content/PublicCatalog";
import { useSiteAccess } from "@/features/content/SiteAccessContext";
import { Container } from "@/components/ui/Container";
import { NotFoundState } from "@/components/ui/NotFoundState";
import { scrollPageToId } from "@/components/layout/PageViewport";
import { GalleryLightbox } from "@/features/about/GalleryViewer";
import { toEmbedUrl } from "@/features/about/videoEmbed";
import { site } from "@/config/site";
import { useAuth } from "@/features/auth/AuthContext";
import { AuthError } from "@/features/auth/AuthForm";
import { AddToCartButton } from "@/features/cart/AddToCartButton";
import { KnowledgeVideo } from "@/features/skills/skillsUi";
import { ActionButton, Chip, CodeBlock, CourseByline, CourseCard } from "@/features/courses/courseUi";
import { LessonAssignment } from "@/features/courses/LessonAssignment";
import { LessonQuiz } from "@/features/courses/LessonQuiz";
import { LessonRichText } from "@/features/courses/LessonRichText";
import { useCourseDetail } from "@/features/courses/useCourses";
import { ProductReviews } from "@/features/reviews/ProductReviews";
import { useSkills } from "@/features/skills/useSkills";
import { useTutorials } from "@/features/tutorials/useTutorials";
import { TutorialCard } from "@/features/tutorials/tutorialUi";
import { apiGet, apiPost, apiPut } from "@/lib/api";
import { isLiveContent } from "@/lib/publishing";
import {
  accessLabel,
  flattenLessons,
  formatCourseDate,
  lessonAnchor,
  lessonCount,
  lessonKindLabel,
  type Course,
  type CourseLesson,
  type FlatLesson,
} from "@/types/course";
import { findTutorial } from "@/types/tutorial";

function chapterNo(index: number) {
  return String(index + 1).padStart(2, "0");
}

function lessonIndexFromHash(lessons: FlatLesson[], hash: string) {
  const id = hash.replace(/^#/, "");
  if (!id) {
    return 0;
  }
  const index = lessons.findIndex((entry) => lessonAnchor(entry.globalIndex, entry.lesson.title) === id);
  return index >= 0 ? index : 0;
}

const READER_ID = "course-reader";

function lessonLink(id: string) {
  return { hash: id };
}

function CourseJsonLd({ course, url }: { course: Course; url: string }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.seoTitle?.trim() || course.title,
    description: course.seoDescription?.trim() || course.description,
    educationalLevel: course.difficulty,
    timeRequired: course.duration || undefined,
    isAccessibleForFree: course.free,
    image: course.thumbnailUrl || undefined,
    url,
    inLanguage: course.language || "en",
    instructor: { "@type": "Person", name: course.instructor || site.name },
    provider: { "@type": "Person", name: site.name },
    numberOfCredits: lessonCount(course),
    offers: course.free
      ? undefined
      : {
          "@type": "Offer",
          price: (course.salePrice || course.price).replace(/[^0-9.]/g, "") || undefined,
          priceCurrency: course.currency || "USD",
        },
  };

  return <script type="application/ld+json">{JSON.stringify(data)}</script>;
}

function LessonMedia({ lesson, title }: { lesson: CourseLesson; title: string }) {
  const video = lesson.videoUrl?.trim() || null;
  const embed = video ? toEmbedUrl(video) : null;
  return (
    <KnowledgeVideo
      embedUrl={embed}
      fileUrl={embed ? null : video}
      poster={lesson.images?.[0]}
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

function lessonHasMatter(lesson: CourseLesson) {
  return (
    Boolean(lesson.videoUrl?.trim()) ||
    (lesson.body ?? []).length > 0 ||
    (lesson.codeSnippets ?? []).length > 0 ||
    (lesson.images ?? []).length > 0 ||
    (lesson.resources ?? []).length > 0 ||
    (lesson.downloads ?? []).length > 0 ||
    (lesson.pdfs ?? []).length > 0 ||
    (lesson.quiz?.questions ?? []).length > 0 ||
    (lesson.assignment?.brief ?? []).length > 0 ||
    (lesson.assignment?.requirements ?? []).length > 0
  );
}

function LessonBody({
  lesson,
  lead,
  onOpenImage,
}: {
  lesson: CourseLesson;
  lead: boolean;
  onOpenImage: (urls: string[], index: number) => void;
}) {
  const body = lesson.body ?? [];
  const snippets = lesson.codeSnippets ?? [];
  const images = lesson.images ?? [];
  const resources = lesson.resources ?? [];
  const downloads = lesson.downloads ?? [];
  const pdfs = lesson.pdfs ?? [];
  const quiz = lesson.quiz;
  const assignment = lesson.assignment;

  if (!lessonHasMatter(lesson)) {
    return null;
  }

  return (
    <div className="mt-6 space-y-5">
      <LessonMedia lesson={lesson} title={lesson.title} />
      {body.length > 0 ? <LessonRichText paragraphs={body} lead={lead} /> : null}
      {quiz && quiz.questions.length > 0 ? <LessonQuiz quiz={quiz} /> : null}
      {assignment && (assignment.brief.length > 0 || assignment.requirements.length > 0) ? (
        <LessonAssignment assignment={assignment} />
      ) : null}
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
      {pdfs.length > 0 ? (
        <div>
          <p className="text-xs tracking-[0.16em] text-muted uppercase">PDF</p>
          <ul className="mt-3 space-y-2">
            {pdfs.map((pdf) => (
              <li key={`${pdf.label}-${pdf.url}`}>
                <a
                  href={pdf.url}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-ink hover:border-accent/40"
                  rel="noreferrer"
                  target="_blank"
                >
                  <span>
                    {pdf.label}
                    {pdf.fileName ? <span className="mt-1 block text-xs text-muted">{pdf.fileName}</span> : null}
                  </span>
                  <span className="text-accent" aria-hidden="true">
                    Open PDF →
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <MaterialList title="Resources" items={resources} />
      <MaterialList title="Downloads" items={downloads} />
    </div>
  );
}

function primaryButtonClass(filled = true) {
  return filled
    ? "inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
    : "inline-flex min-h-11 items-center justify-center rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-medium text-ink transition hover:border-accent/40";
}

function CourseEnrollCtas({
  slug,
  title,
  free,
  enrolled,
  completed = false,
  canReadLessons,
  signedIn,
  pending,
  error,
  hasLessons,
  onEnroll,
  onOpenFirst,
  leadingAction,
  children,
}: {
  slug: string;
  title: string;
  free: boolean;
  enrolled: boolean;
  completed?: boolean;
  canReadLessons: boolean;
  signedIn: boolean;
  pending: boolean;
  error: string;
  hasLessons: boolean;
  onEnroll: () => void;
  onOpenFirst: () => void;
  leadingAction?: ReactNode;
  children?: ReactNode;
}) {
  const inquireTo = `/contact?subject=${encodeURIComponent(`Course enrollment: ${title}`)}`;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {leadingAction}
        {canReadLessons && hasLessons ? (
          <button type="button" className={primaryButtonClass(!completed)} onClick={onOpenFirst}>
            {completed ? "Review course" : enrolled ? "Continue" : "Start curriculum"}
          </button>
        ) : hasLessons ? (
          <button type="button" className={primaryButtonClass(false)} onClick={onOpenFirst}>
            View outline
          </button>
        ) : null}
        {free && !enrolled && !signedIn ? (
          <Link to="/login" state={{ from: `/courses/${slug}` }} className={primaryButtonClass()}>
            Sign in to enroll
          </Link>
        ) : null}
        {free && !enrolled && signedIn ? (
          <button type="button" className={primaryButtonClass()} disabled={pending} onClick={onEnroll}>
            {pending ? "Enrolling…" : "Enroll"}
          </button>
        ) : null}
        {!free && !canReadLessons ? (
          <>
            <AddToCartButton kind="course" slug={slug} />
            <Link to={inquireTo} className={primaryButtonClass(false)}>
              Inquire to enroll
            </Link>
          </>
        ) : null}
        {enrolled ? (
          <Link to="/dashboard/courses" className={primaryButtonClass(false)}>
            My courses
          </Link>
        ) : null}
        {children}
      </div>
      {error ? <AuthError>{error}</AuthError> : null}
    </div>
  );
}

export function CourseDetailPage() {
  const { slug = "" } = useParams();
  const { hash } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { course, related, access, progress, certificate, loading, notFound, error, reload } = useCourseDetail(slug);
  const { skills } = useSkills();
  const { tutorials } = useTutorials();
  const { catalogs } = useSiteAccess();
  const [copied, setCopied] = useState(false);
  const [photo, setPhoto] = useState<{ urls: string[]; index: number } | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState("");
  const [progressPending, setProgressPending] = useState(false);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (!course) {
      return;
    }
    const previous = document.title;
    document.title = course.seoTitle?.trim() || `${course.title} — Courses`;
    const description = course.seoDescription?.trim() || course.description;
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
      course.canonicalUrl?.trim() ||
      (typeof window === "undefined"
        ? `/courses/${course.slug}`
        : `${window.location.origin}/courses/${course.slug}`);
    canonical.setAttribute("href", href);
    return () => {
      document.title = previous;
    };
  }, [course]);

  useLayoutEffect(() => {
    if (!course || !hash) {
      return;
    }
    const id = decodeURIComponent(hash.replace(/^#/, ""));
    setActiveIndex(lessonIndexFromHash(flattenLessons(course.modules), hash));
    scrollPageToId(id);
  }, [course, hash]);

  if (loading && !course) {
    return (
      <Container className="space-y-6 py-16">
        <div className="h-10 w-64 animate-pulse rounded-full bg-paper-muted" />
        <div className="h-40 animate-pulse rounded-[1.75rem] bg-paper-muted" />
      </Container>
    );
  }

  if (error && !course) {
    return (
      <Container className="py-16">
        <p className="text-ink-soft">{error}</p>
      </Container>
    );
  }

  if (notFound || !course) {
    return <NotFoundState title="Course not found" />;
  }

  const url =
    typeof window === "undefined"
      ? `/courses/${course.slug}`
      : `${window.location.origin}/courses/${course.slug}`;
  const cover = course.thumbnailUrl?.trim() || null;
  const title = course.title;
  const excerpt = course.description;
  const accessLabelText = accessLabel(course);
  const published = formatCourseDate(course.publishedAt ?? "");
  const modules = course.modules;
  const lessons = flattenLessons(modules);
  const canReadLessons = access.canReadLessons;
  const enrolled = access.enrolled;
  const isFree = course.free;
  const courseSlug = course.slug;
  const signedIn = Boolean(user);
  const completedKeys = new Set(progress?.completedKeys ?? []);
  const continueIndex = progress?.currentLesson?.index ?? 0;
  const skillRecord = skills.find(
    (item) => item.name === course.skill || item.slug === course.skill.toLowerCase(),
  );
  const relatedSkills = (course.relatedSkillSlugs ?? [])
    .map((skillSlug) => skills.find((item) => item.slug === skillSlug))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const relatedTutorials = (course.relatedTutorialSlugs ?? [])
    .map((tutorialSlug) => findTutorial(tutorials, tutorialSlug))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const lessonTotal = lessonCount(course);
  const sectionCount = `${lessonTotal} ${lessonTotal === 1 ? "lesson" : "lessons"}`;
  const safeIndex = lessons.length === 0 ? 0 : Math.min(Math.max(activeIndex, 0), lessons.length - 1);
  const current = lessons[safeIndex];
  const previous = safeIndex > 0 ? lessons[safeIndex - 1] : undefined;
  const next = safeIndex < lessons.length - 1 ? lessons[safeIndex + 1] : undefined;
  const overview = course.overview ?? [];
  const promo = course.promoVideoUrl?.trim() || null;
  const promoEmbed = promo ? toEmbedUrl(promo) : null;

  function openLesson(index: number) {
    const entry = lessons[index];
    if (!entry) {
      return;
    }
    const id = lessonAnchor(entry.globalIndex, entry.lesson.title);
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

  async function shareCourse() {
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

  async function claimCertificate() {
    if (!courseSlug || certificate) {
      return;
    }
    setClaiming(true);
    setEnrollError("");
    try {
      await apiGet(`/enrollments/${courseSlug}/certificate`);
      await reload();
    } catch (caught) {
      setEnrollError(caught instanceof Error ? caught.message : "Could not issue a certificate");
    } finally {
      setClaiming(false);
    }
  }

  async function enrollInCourse() {
    setEnrollError("");
    setEnrolling(true);
    try {
      await apiPost("/enrollments", { courseSlug });
      await reload();
    } catch (caught) {
      setEnrollError(caught instanceof Error ? caught.message : "Could not enroll");
    } finally {
      setEnrolling(false);
    }
  }

  async function toggleLessonComplete() {
    const key = current?.key;
    if (!key || !enrolled) {
      return;
    }
    const done = completedKeys.has(key);
    setProgressPending(true);
    setEnrollError("");
    try {
      await apiPut(`/enrollments/${courseSlug}/progress`, { lessonKey: key, completed: !done });
      await reload();
    } catch (caught) {
      setEnrollError(caught instanceof Error ? caught.message : "Could not save progress");
    } finally {
      setProgressPending(false);
    }
  }

  const metaBits = [course.difficulty, accessLabelText, course.duration, sectionCount, published].filter(Boolean);
  const listPrice = course.free ? "Free" : course.price;
  const sale = course.free ? "" : course.salePrice?.trim() || "";

  return (
    <>
      <CourseJsonLd course={course} url={url} />
      {!isLiveContent(course) ? (
        <Container className="pt-8">
          <PreviewBanner status={course.status} />
        </Container>
      ) : !catalogs.courses ? (
        <CatalogStoppedBanner />
      ) : null}
      <section className="relative overflow-hidden border-b border-line bg-surface">
        <div className="pointer-events-none absolute -top-28 left-1/3 h-80 w-80 rounded-full bg-accent/15 blur-3xl" />
        <Container className="relative pt-10 pb-8 sm:pt-12">
          {catalogs.courses ? (
            <Link to="/courses" className="text-sm font-medium text-accent hover:text-accent-dark">
              ← All courses
            </Link>
          ) : (
            <Link
              to={user?.role === "ADMIN" ? "/admin/courses" : "/dashboard/courses"}
              className="text-sm font-medium text-accent hover:text-accent-dark"
            >
              {user?.role === "ADMIN" ? "← Studio courses" : "← My courses"}
            </Link>
          )}
          <p className="mt-5 text-xs tracking-[0.16em] text-accent uppercase">
            {course.difficulty}
            {accessLabelText ? ` · ${accessLabelText}` : ""}
          </p>
          <div className="mt-3 grid items-end gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)]">
            <div>
              <h1 className="font-display text-4xl tracking-tight text-ink sm:text-5xl">{course.title}</h1>
              {course.subtitle ? (
                <p className="mt-4 max-w-2xl text-xl leading-8 text-ink">{course.subtitle}</p>
              ) : null}
              <p className="mt-4 max-w-2xl text-lg leading-8 text-ink-soft">{course.description}</p>
              <div className="mt-5">
                <CourseByline course={course} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Chip accent>{accessLabelText}</Chip>
                {course.skill ? (
                  skillRecord ? (
                    <Link to={`/skills/${skillRecord.slug}`}>
                      <Chip>{skillRecord.name}</Chip>
                    </Link>
                  ) : (
                    <Chip>{course.skill}</Chip>
                  )
                ) : null}
                {course.category ? <Chip>{course.category}</Chip> : null}
                {course.certificateAvailable ? <Chip>Certificate</Chip> : null}
                {course.featured ? <Chip>Featured</Chip> : null}
              </div>
              <p className="mt-5 text-sm text-ink">
                {sale ? (
                  <>
                    <span className="mr-2 text-muted line-through">{listPrice}</span>
                    <span className="font-medium">{sale}</span>
                  </>
                ) : (
                  <span className="font-medium">{listPrice}</span>
                )}
                {course.duration ? <span className="text-muted"> · {course.duration}</span> : null}
              </p>
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
          {promo ? (
            <div className="mt-8 max-w-3xl">
              <KnowledgeVideo embedUrl={promoEmbed} fileUrl={promoEmbed ? null : promo} poster={cover} title={title} />
            </div>
          ) : null}
          {overview.length > 0 ? (
            <div className="mt-8 max-w-2xl space-y-4">
              {overview.map((paragraph) => (
                <p key={paragraph.slice(0, 32)} className="text-base leading-8 text-ink-soft">
                  {paragraph}
                </p>
              ))}
            </div>
          ) : null}
          {course.requirements && course.requirements.length > 0 ? (
            <p className="mt-5 max-w-2xl text-sm leading-7 text-ink-soft">
              <span className="font-medium text-ink">Requirements. </span>
              {course.requirements.join(" · ")}
            </p>
          ) : null}
          {course.outcomes.length > 0 ? (
            <div className="mt-6 max-w-2xl">
              <p className="text-sm font-medium text-ink">What you will learn</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-7 text-ink-soft">
                {course.outcomes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {course.audience && course.audience.length > 0 ? (
            <p className="mt-5 max-w-2xl text-sm leading-7 text-ink-soft">
              <span className="font-medium text-ink">Who it is for. </span>
              {course.audience.join(" · ")}
            </p>
          ) : null}
          <div className="mt-6">
            <CourseEnrollCtas
              slug={courseSlug}
              title={title}
              free={isFree}
              enrolled={enrolled}
              completed={progress?.completed === true}
              canReadLessons={canReadLessons}
              signedIn={signedIn}
              pending={enrolling}
              error={enrollError}
              hasLessons={lessons.length > 0}
              onEnroll={() => void enrollInCourse()}
              onOpenFirst={() => openLesson(continueIndex)}
              leadingAction={
                certificate ? (
                  <Link to={certificate.verifyPath} className={primaryButtonClass()}>
                    View certificate
                  </Link>
                ) : enrolled && progress?.completed ? (
                  <button
                    type="button"
                    className={primaryButtonClass()}
                    disabled={claiming}
                    onClick={() => void claimCertificate()}
                  >
                    {claiming ? "Issuing…" : "Get certificate"}
                  </button>
                ) : null
              }
            >
              <ActionButton onClick={() => void shareCourse()}>Share</ActionButton>
              <ActionButton onClick={() => void copyLink()}>{copied ? "Link copied" : "Copy link"}</ActionButton>
            </CourseEnrollCtas>
          </div>
        </Container>

        <Container className="relative grid items-start gap-6 pb-14 lg:grid-cols-[15.5rem_minmax(0,1fr)] lg:gap-10 lg:pb-16">
          <nav
            className="rounded-[1.5rem] border border-line bg-paper/70 lg:sticky lg:top-24 lg:col-start-1 lg:row-start-1"
            aria-label="Course contents"
          >
            <div className="flex items-baseline justify-between gap-3 border-b border-line px-4 py-3">
              <p className="text-xs tracking-[0.16em] text-accent uppercase">Curriculum</p>
              <p className="text-xs text-muted">
                {progress
                  ? `${progress.lessonsCompleted} of ${progress.lessonsTotal} complete`
                  : sectionCount}
              </p>
            </div>
            {lessons.length > 0 ? (
              <ol className="py-2">
                {modules.map((courseModule, moduleIndex) => {
                  const moduleLessons = lessons.filter((entry) => entry.moduleIndex === moduleIndex);
                  return (
                    <li key={`module-${moduleIndex}-${courseModule.title}`}>
                      <p className="px-4 pt-3 pb-1 text-[11px] tracking-[0.14em] text-muted uppercase">
                        {courseModule.title}
                      </p>
                      <ol>
                        {moduleLessons.map((entry) => {
                          const id = lessonAnchor(entry.globalIndex, entry.lesson.title);
                          const currentLesson = entry.globalIndex === safeIndex;
                          const done = completedKeys.has(entry.key);
                          return (
                            <li key={id}>
                              <Link
                                to={lessonLink(id)}
                                aria-current={currentLesson ? "true" : undefined}
                                className={`flex gap-3 border-l-2 px-4 py-2.5 text-sm transition ${
                                  currentLesson
                                    ? "border-accent bg-accent/10 font-medium text-ink"
                                    : "border-transparent text-ink-soft hover:text-ink"
                                }`}
                                onClick={(event) => {
                                  event.preventDefault();
                                  openLesson(entry.globalIndex);
                                }}
                              >
                                <span className={`tabular-nums ${currentLesson ? "text-accent" : "text-muted"}`}>
                                  {done ? "✓" : chapterNo(entry.globalIndex)}
                                </span>
                                <span className="min-w-0 leading-5">
                                  {entry.lesson.title}
                                  <span className="mt-0.5 block text-[11px] font-normal tracking-normal text-muted">
                                    {done ? "Completed" : lessonKindLabel(entry.lesson.kind)}
                                  </span>
                                </span>
                              </Link>
                            </li>
                          );
                        })}
                      </ol>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="px-4 py-3 text-sm text-muted">No lessons yet.</p>
            )}
          </nav>

          {current ? (
            <div className="relative min-w-0 lg:col-start-2 lg:row-start-1">
              {lessons.map((entry) => {
                const id = lessonAnchor(entry.globalIndex, entry.lesson.title);
                return (
                  <span key={id} id={id} className="pointer-events-none absolute top-0 left-0 h-px w-px" />
                );
              })}
              <article
                id={READER_ID}
                className="rounded-[1.5rem] border border-line bg-paper/40 px-5 py-7 sm:px-8 sm:py-9"
                aria-labelledby="course-lesson-title"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs tracking-[0.16em] text-muted uppercase">
                    {current.moduleTitle} · {chapterNo(safeIndex)} / {chapterNo(Math.max(lessons.length - 1, 0))}
                  </p>
                  {lessons.length > 1 ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-sm text-ink transition hover:border-accent/40 disabled:cursor-not-allowed disabled:opacity-30"
                        disabled={!previous}
                        aria-label={previous ? `Previous: ${previous.lesson.title}` : "No previous lesson"}
                        onClick={() => previous && openLesson(safeIndex - 1)}
                      >
                        ←
                      </button>
                      <button
                        type="button"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-sm text-ink transition hover:border-accent/40 disabled:cursor-not-allowed disabled:opacity-30"
                        disabled={!next}
                        aria-label={next ? `Next: ${next.lesson.title}` : "No next lesson"}
                        onClick={() => next && openLesson(safeIndex + 1)}
                      >
                        →
                      </button>
                    </div>
                  ) : null}
                </div>
                <h2
                  id="course-lesson-title"
                  className="mt-5 font-display text-3xl tracking-tight text-ink sm:text-4xl"
                >
                  {current.lesson.title}
                </h2>
                <p className="mt-3">
                  <Chip>{lessonKindLabel(current.lesson.kind)}</Chip>
                </p>
                {current.lesson.summary ? (
                  <p className="mt-3 text-lg leading-8 text-ink-soft">{current.lesson.summary}</p>
                ) : null}
                {canReadLessons ? (
                  <LessonBody
                    lesson={current.lesson}
                    lead={safeIndex === 0}
                    onOpenImage={(urls, index) => setPhoto({ urls, index })}
                  />
                ) : (
                  <div className="mt-8 rounded-2xl border border-line bg-surface px-5 py-6">
                    <p className="font-medium text-ink">Lesson content is for enrolled students</p>
                    <p className="mt-2 text-sm leading-7 text-ink-soft">
                      Module and lesson titles stay public. Video, notes, quizzes, code, and files unlock after you
                      have a seat.
                    </p>
                  </div>
                )}
                {enrolled ? (
                  <div className="mt-8">
                    <button
                      type="button"
                      className={
                        completedKeys.has(current.key)
                          ? "inline-flex min-h-11 items-center justify-center rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-medium text-ink transition hover:border-accent/40 disabled:opacity-60"
                          : "inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition hover:bg-accent disabled:opacity-60"
                      }
                      disabled={progressPending}
                      aria-pressed={completedKeys.has(current.key)}
                      onClick={() => void toggleLessonComplete()}
                    >
                      {progressPending
                        ? "Saving…"
                        : completedKeys.has(current.key)
                          ? "Completed"
                          : "Mark complete"}
                    </button>
                  </div>
                ) : null}
                {lessons.length > 1 ? (
                  <div className="mt-10 flex flex-wrap items-stretch justify-between gap-3 border-t border-line pt-6">
                    {previous ? (
                      <Link
                        to={lessonLink(lessonAnchor(previous.globalIndex, previous.lesson.title))}
                        className="min-w-[12rem] flex-1 rounded-2xl border border-line bg-surface px-4 py-3 transition hover:border-accent/40"
                        onClick={(event) => {
                          event.preventDefault();
                          openLesson(safeIndex - 1);
                        }}
                      >
                        <p className="text-xs tracking-[0.14em] text-muted uppercase">Previous</p>
                        <p className="mt-1 text-sm font-medium text-ink">{previous.lesson.title}</p>
                      </Link>
                    ) : (
                      <span className="hidden flex-1 sm:block" />
                    )}
                    {next ? (
                      <Link
                        to={lessonLink(lessonAnchor(next.globalIndex, next.lesson.title))}
                        className="min-w-[12rem] flex-1 rounded-2xl border border-line bg-surface px-4 py-3 text-right transition hover:border-accent/40"
                        onClick={(event) => {
                          event.preventDefault();
                          openLesson(safeIndex + 1);
                        }}
                      >
                        <p className="text-xs tracking-[0.14em] text-muted uppercase">Next</p>
                        <p className="mt-1 text-sm font-medium text-ink">{next.lesson.title}</p>
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

      <section className="border-b border-line py-14 sm:py-16">
        <Container>
          <ProductReviews kind="course" slug={course.slug} />
        </Container>
      </section>

      {related.length > 0 || relatedTutorials.length > 0 || relatedSkills.length > 0 ? (
        <section className="border-b border-line py-14 sm:py-16">
          <Container className="space-y-12">
            {relatedTutorials.length > 0 ? (
              <div>
                <h2 className="font-display text-3xl tracking-tight text-ink">Related tutorials</h2>
                <p className="mt-2 text-sm text-ink-soft">Shorter walkthroughs on the same ground.</p>
                <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {relatedTutorials.map((item) => (
                    <TutorialCard key={item.slug} tutorial={item} />
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
                <h2 className="font-display text-3xl tracking-tight text-ink">Related courses</h2>
                <p className="mt-2 text-sm text-ink-soft">Keep going if this syllabus was useful.</p>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {related.map((item) => (
                    <CourseCard key={item.slug} course={item} />
                  ))}
                </div>
              </div>
            ) : null}
          </Container>
        </section>
      ) : null}

      <section className="border-b border-line bg-paper-muted/35 py-12 sm:py-16">
        <Container className="flex max-w-3xl flex-wrap items-center justify-between gap-6">
          <CourseByline course={course} />
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
          onShow={(index) => setPhoto((currentPhoto) => (currentPhoto ? { ...currentPhoto, index } : currentPhoto))}
        />
      ) : null}
    </>
  );
}
