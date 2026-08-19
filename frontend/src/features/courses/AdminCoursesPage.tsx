import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { FilterChip, FilterGroups, FilterRow, FilterSearch, FilterToolbar } from "@/components/ui/FilterBar";
import { FormField, FormSelect, FormTextArea } from "@/components/ui/FormField";
import { AuthError } from "@/features/auth/AuthForm";
import { LogoPicker } from "@/features/experience/LogoPicker";
import { VideoPicker } from "@/features/about/MediaPicker";
import {
  relatedCourseOptions,
  relatedTutorialOptions,
  type RelatedOption,
} from "@/features/skills/relatedOptions";
import { RelatedNamePicker } from "@/features/skills/RelatedNamePicker";
import { useSkills } from "@/features/skills/useSkills";
import { AdminCourseCurriculum } from "@/features/courses/AdminCourseCurriculum";
import { apiGet, apiPut } from "@/lib/api";
import { useFormErrors } from "@/lib/useFormErrors";
import { collectErrors } from "@/lib/validation";
import {
  courseDifficulties,
  courseStatuses,
  emptyCourse,
  isSlug,
  listFromLines,
  matchesCourseFilters,
  normalizeCourseList,
  normalizeModule,
  paragraphsFromBody,
  slugFromTitle,
  type Course,
} from "@/types/course";

type CourseFields = "courses";

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-5 rounded-3xl border border-line bg-surface p-6 shadow-[0_1px_0_rgb(26_22_18/0.04)] sm:p-7">
      <div>
        <h2 className="font-display text-2xl text-ink">{title}</h2>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
      {children}
    </section>
  );
}

function readyCourses(items: Course[]) {
  return items.map((item, index) => {
    const free = item.free;
    return {
      id: item.id,
      title: item.title.trim(),
      slug: slugFromTitle(item.slug) || slugFromTitle(item.title),
      subtitle: item.subtitle.trim(),
      description: item.description.trim(),
      overview: item.overview?.map((entry) => entry.trim()).filter(Boolean) ?? [],
      thumbnailUrl: item.thumbnailUrl?.trim() || null,
      promoVideoUrl: item.promoVideoUrl?.trim() || null,
      instructor: item.instructor?.trim() || "Rezaul Karim",
      category: item.category?.trim() ?? "",
      skill: item.skill.trim(),
      difficulty: item.difficulty.trim() || "Beginner",
      language: item.language?.trim() || "English",
      duration: item.duration.trim(),
      requirements: item.requirements?.map((entry) => entry.trim()).filter(Boolean) ?? [],
      outcomes: item.outcomes.map((entry) => entry.trim()).filter(Boolean),
      audience: item.audience?.map((entry) => entry.trim()).filter(Boolean) ?? [],
      price: free ? "Free" : item.price.trim() || "Premium",
      salePrice: free ? "" : item.salePrice?.trim() ?? "",
      currency: item.currency?.trim() || "USD",
      free,
      featured: Boolean(item.featured),
      certificateAvailable: Boolean(item.certificateAvailable),
      relatedSkillSlugs: item.relatedSkillSlugs?.map((entry) => entry.trim()).filter(Boolean) ?? [],
      relatedTutorialSlugs: item.relatedTutorialSlugs?.map((entry) => entry.trim()).filter(Boolean) ?? [],
      relatedCourseSlugs: item.relatedCourseSlugs?.map((entry) => entry.trim()).filter(Boolean) ?? [],
      modules: item.modules
        .filter((courseModule) => courseModule.title.trim())
        .map((courseModule) => normalizeModule({ ...courseModule, title: courseModule.title })),
      status: item.status?.trim() || "draft",
      publishedAt: item.publishedAt?.trim() ?? "",
      seoTitle: item.seoTitle?.trim() ?? "",
      seoDescription: item.seoDescription?.trim() ?? "",
      canonicalUrl: item.canonicalUrl?.trim() ?? "",
      sortOrder: index,
    };
  });
}

function isMediaHref(value: string) {
  if (value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")) {
    return true;
  }
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.username === "" && url.password === "";
  } catch {
    return false;
  }
}

function listError(items: ReturnType<typeof readyCourses>) {
  if (items.length > 80) {
    return "Use 80 courses or fewer";
  }
  const slugs = new Set<string>();
  for (const [index, item] of items.entries()) {
    const label = `Course ${index + 1}`;
    if (item.title.length < 2) {
      return `${label}: title must be at least 2 characters`;
    }
    if (item.slug.length < 2) {
      return `${label}: slug is required`;
    }
    if (!isSlug(item.slug)) {
      return `${label}: slug must be lowercase letters, numbers, and hyphens`;
    }
    if (slugs.has(item.slug)) {
      return `${label}: slug must be unique`;
    }
    slugs.add(item.slug);
    if (item.description.length < 8) {
      return `${label}: description must be at least 8 characters`;
    }
    if (item.thumbnailUrl && !isMediaHref(item.thumbnailUrl)) {
      return `${label}: thumbnail must use an https URL or a site path`;
    }
    if (item.promoVideoUrl && !isMediaHref(item.promoVideoUrl)) {
      return `${label}: promo video must use an https URL or a site path`;
    }
    if (item.canonicalUrl && !isMediaHref(item.canonicalUrl)) {
      return `${label}: canonical URL must use an https URL or a site path`;
    }
    if (item.modules.length === 0) {
      return `${label}: add at least one module`;
    }
    if (item.modules.every((courseModule) => courseModule.lessons.length === 0)) {
      return `${label}: add at least one lesson`;
    }
  }
}

function statusLabel(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function toEmbedUrlSafe(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    return false;
  }
  return /youtube\.com|youtu\.be|vimeo\.com/i.test(trimmed);
}

export function AdminCoursesPage() {
  const { skills } = useSkills();
  const [items, setItems] = useState<Course[]>([]);
  const [query, setQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [accessFilter, setAccessFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [openIndex, setOpenIndex] = useState(-1);
  const [openModule, setOpenModule] = useState(-1);
  const [openLesson, setOpenLesson] = useState(-1);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const { fieldErrors, formError, resetErrors, applyFieldErrors, applyCaughtError } =
    useFormErrors<CourseFields>();

  useEffect(() => {
    void apiGet<{ courses: Course[] }>("/courses", { cache: "no-store" })
      .then((payload) => {
        setItems(normalizeCourseList(payload.courses));
      })
      .catch((caught: unknown) => {
        applyCaughtError(caught, "Could not load courses");
      })
      .finally(() => setLoading(false));
  }, [applyCaughtError]);

  function markDirty() {
    setDirty(true);
    setSaved(false);
  }

  function patch(index: number, patchValue: Partial<Course>) {
    setItems((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patchValue } : item)),
    );
    markDirty();
  }

  const skillOptions: RelatedOption[] = useMemo(
    () =>
      skills.map((item) => ({
        slug: item.slug,
        name: item.name,
        keywords: [item.name, item.slug, item.field].join(" ").toLowerCase(),
      })),
    [skills],
  );
  const difficulties = useMemo(
    () => [...new Set(items.map((item) => item.difficulty.trim()).filter(Boolean))],
    [items],
  );
  const skillNames = useMemo(
    () => [...new Set(items.map((item) => item.skill.trim()).filter(Boolean))],
    [items],
  );
  const filtering = Boolean(
    query.trim() || difficultyFilter || skillFilter || accessFilter || statusFilter,
  );
  const visible = useMemo(
    () =>
      items
        .map((item, index) => ({ item, index }))
        .filter(({ item }) =>
          matchesCourseFilters(item, {
            query,
            difficulty: difficultyFilter,
            skill: skillFilter,
            access: accessFilter,
            featured: "",
            status: statusFilter,
          }),
        ),
    [items, query, difficultyFilter, skillFilter, accessFilter, statusFilter],
  );
  const resultLabel = filtering
    ? `${visible.length} of ${items.length} ${items.length === 1 ? "course" : "courses"}`
    : `${items.length} ${items.length === 1 ? "course" : "courses"}`;

  function clearFilters() {
    setQuery("");
    setDifficultyFilter("");
    setSkillFilter("");
    setAccessFilter("");
    setStatusFilter("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = readyCourses(items);
    resetErrors();
    setSaved(false);
    if (applyFieldErrors(collectErrors({ courses: listError(next) }))) {
      return;
    }
    setPending(true);
    try {
      const payload = await apiPut<{ courses: Course[] }>("/courses", { courses: next });
      setItems(normalizeCourseList(payload.courses));
      setDirty(false);
      setSaved(true);
    } catch (caught) {
      applyCaughtError(caught, "Could not save courses");
    } finally {
      setPending(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 animate-pulse rounded-full bg-paper-muted" />
        <div className="h-48 animate-pulse rounded-3xl bg-paper-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.18em] text-accent uppercase">Learning</p>
          <h1 className="mt-2 font-display text-3xl text-ink">Courses</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-ink-soft">
            Full courses with modules, lessons, pricing, and curriculum. Drafts stay off the public page.
            Checkout is not connected yet.
          </p>
        </div>
        <a href="/courses" className="text-sm text-accent hover:text-accent-dark">
          View public page →
        </a>
      </div>

      <AuthError>{formError || Object.values(fieldErrors)[0]}</AuthError>
      {saved ? (
        <p className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink" role="status">
          Courses published.
        </p>
      ) : null}

      <form className="space-y-6" onSubmit={handleSubmit} noValidate>
        <FilterToolbar>
          <FilterSearch
            id="course-admin-search"
            label="Search courses"
            value={query}
            placeholder="Title, skill, or description"
            resultLabel={resultLabel}
            filtering={filtering}
            onChange={setQuery}
            onClear={clearFilters}
          />
          <FilterGroups>
            {difficulties.length > 1 ? (
              <FilterRow label="Difficulty" groupLabel="Filter by difficulty">
                <FilterChip
                  label="All"
                  active={!difficultyFilter}
                  onClick={() => setDifficultyFilter("")}
                />
                {difficulties.map((name) => (
                  <FilterChip
                    key={name}
                    label={name}
                    active={difficultyFilter === name}
                    onClick={() => setDifficultyFilter(name)}
                  />
                ))}
              </FilterRow>
            ) : null}
            {skillNames.length > 1 ? (
              <FilterRow label="Skill" groupLabel="Filter by skill">
                <FilterChip label="All skills" active={!skillFilter} onClick={() => setSkillFilter("")} />
                {skillNames.map((name) => (
                  <FilterChip
                    key={name}
                    label={name}
                    active={skillFilter === name}
                    onClick={() => setSkillFilter(name)}
                  />
                ))}
              </FilterRow>
            ) : null}
            <FilterRow label="Access" groupLabel="Filter by access">
              <FilterChip label="All access" active={!accessFilter} onClick={() => setAccessFilter("")} />
              <FilterChip label="Free" active={accessFilter === "free"} onClick={() => setAccessFilter("free")} />
              <FilterChip
                label="Premium"
                active={accessFilter === "premium"}
                onClick={() => setAccessFilter("premium")}
              />
            </FilterRow>
            <FilterRow label="Status" groupLabel="Filter by status">
              <FilterChip
                label="All statuses"
                active={!statusFilter}
                onClick={() => setStatusFilter("")}
              />
              {courseStatuses.map((status) => (
                <FilterChip
                  key={status}
                  label={statusLabel(status)}
                  active={statusFilter === status}
                  onClick={() => setStatusFilter(status)}
                />
              ))}
            </FilterRow>
          </FilterGroups>
        </FilterToolbar>

        {filtering && visible.length === 0 ? (
          <p className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink-soft">
            No courses match these filters.
          </p>
        ) : null}

        {visible.map(({ item, index }) => {
          const expanded = openIndex === index;
          return (
            <SectionCard
              key={item.id ?? `course-${index}`}
              title={item.title.trim() || `Course ${index + 1}`}
              description={item.slug ? `/courses/${item.slug}` : "Slug used in /courses/your-slug"}
            >
              <div className="flex flex-wrap gap-2">
                <button
                  className="cursor-pointer text-sm text-accent hover:text-accent-dark"
                  type="button"
                  onClick={() => {
                    setOpenIndex(expanded ? -1 : index);
                    setOpenModule(-1);
                    setOpenLesson(-1);
                  }}
                >
                  {expanded ? "Collapse" : "Edit"}
                </button>
                <button
                  className="cursor-pointer text-sm text-muted hover:text-ink"
                  type="button"
                  onClick={() => {
                    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
                    setOpenIndex(-1);
                    setOpenModule(-1);
                    setOpenLesson(-1);
                    markDirty();
                  }}
                >
                  Remove
                </button>
              </div>
              {!expanded ? (
                <p className="text-sm text-muted">
                  {[
                    statusLabel(item.status || "draft"),
                    item.difficulty,
                    item.skill,
                    item.free ? "Free" : "Premium",
                    item.featured ? "Featured" : "",
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                  {item.description.trim() ? ` — ${item.description.trim()}` : ""}
                </p>
              ) : null}
              {expanded ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      label="Title"
                      name={`title-${index}`}
                      maxLength={160}
                      value={item.title}
                      onChange={(event) => {
                        const title = event.target.value;
                        patch(index, {
                          title,
                          slug: item.slug ? item.slug : slugFromTitle(title),
                        });
                      }}
                    />
                    <FormField
                      label="Slug"
                      name={`slug-${index}`}
                      maxLength={80}
                      value={item.slug}
                      hint="Used in /courses/your-slug"
                      onChange={(event) => patch(index, { slug: event.target.value })}
                    />
                    <FormSelect
                      label="Status"
                      name={`status-${index}`}
                      value={item.status || "draft"}
                      onChange={(event) => patch(index, { status: event.target.value })}
                    >
                      {courseStatuses.map((status) => (
                        <option key={status} value={status}>
                          {statusLabel(status)}
                        </option>
                      ))}
                    </FormSelect>
                    <FormSelect
                      label="Difficulty"
                      name={`difficulty-${index}`}
                      value={item.difficulty}
                      onChange={(event) => patch(index, { difficulty: event.target.value })}
                    >
                      {courseDifficulties.map((difficulty) => (
                        <option key={difficulty} value={difficulty}>
                          {difficulty}
                        </option>
                      ))}
                    </FormSelect>
                    <FormSelect
                      label="Access"
                      name={`access-${index}`}
                      value={item.free ? "free" : "premium"}
                      onChange={(event) => {
                        const free = event.target.value === "free";
                        patch(index, {
                          free,
                          price: free ? "Free" : item.price === "Free" ? "" : item.price,
                          salePrice: free ? "" : item.salePrice,
                        });
                      }}
                    >
                      <option value="free">Free</option>
                      <option value="premium">Premium</option>
                    </FormSelect>
                    <FormField
                      label="Price"
                      name={`price-${index}`}
                      value={item.price}
                      hint="Shown when access is premium. Free courses always say Free."
                      onChange={(event) => patch(index, { price: event.target.value })}
                    />
                    <FormField
                      label="Sale price"
                      name={`salePrice-${index}`}
                      value={item.salePrice ?? ""}
                      hint="Optional. Leave blank to show only the regular price."
                      onChange={(event) => patch(index, { salePrice: event.target.value })}
                    />
                    <FormField
                      label="Currency"
                      name={`currency-${index}`}
                      value={item.currency ?? "USD"}
                      onChange={(event) => patch(index, { currency: event.target.value })}
                    />
                    <FormField
                      label="Duration"
                      name={`duration-${index}`}
                      value={item.duration}
                      hint="Estimated time, such as 18 hours."
                      onChange={(event) => patch(index, { duration: event.target.value })}
                    />
                    <FormField
                      label="Skill"
                      name={`skill-${index}`}
                      value={item.skill}
                      onChange={(event) => patch(index, { skill: event.target.value })}
                    />
                    <FormField
                      label="Category"
                      name={`category-${index}`}
                      value={item.category ?? ""}
                      onChange={(event) => patch(index, { category: event.target.value })}
                    />
                    <FormField
                      label="Instructor"
                      name={`instructor-${index}`}
                      value={item.instructor ?? ""}
                      onChange={(event) => patch(index, { instructor: event.target.value })}
                    />
                    <FormField
                      label="Language"
                      name={`language-${index}`}
                      value={item.language ?? "English"}
                      onChange={(event) => patch(index, { language: event.target.value })}
                    />
                    <FormSelect
                      label="Featured"
                      name={`featured-${index}`}
                      value={item.featured ? "yes" : "no"}
                      onChange={(event) => patch(index, { featured: event.target.value === "yes" })}
                    >
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </FormSelect>
                    <FormSelect
                      label="Certificate"
                      name={`certificate-${index}`}
                      value={item.certificateAvailable ? "yes" : "no"}
                      onChange={(event) =>
                        patch(index, { certificateAvailable: event.target.value === "yes" })
                      }
                    >
                      <option value="no">Not offered</option>
                      <option value="yes">Available</option>
                    </FormSelect>
                    <FormField
                      label="Published date"
                      name={`publishedAt-${index}`}
                      value={item.publishedAt ?? ""}
                      hint="Shown on the public page."
                      onChange={(event) => patch(index, { publishedAt: event.target.value })}
                    />
                  </div>
                  <FormField
                    label="Subtitle"
                    name={`subtitle-${index}`}
                    maxLength={200}
                    value={item.subtitle}
                    onChange={(event) => patch(index, { subtitle: event.target.value })}
                  />
                  <FormTextArea
                    label="Short description"
                    name={`description-${index}`}
                    rows={3}
                    maxLength={480}
                    value={item.description}
                    onChange={(event) => patch(index, { description: event.target.value })}
                  />
                  <FormTextArea
                    label="Full description"
                    name={`overview-${index}`}
                    rows={5}
                    hint="Separate paragraphs with a blank line."
                    value={(item.overview ?? []).join("\n\n")}
                    onChange={(event) => patch(index, { overview: paragraphsFromBody(event.target.value) })}
                  />
                  <FormTextArea
                    label="Requirements"
                    name={`requirements-${index}`}
                    rows={3}
                    hint="One requirement per line."
                    value={(item.requirements ?? []).join("\n")}
                    onChange={(event) => patch(index, { requirements: listFromLines(event.target.value) })}
                  />
                  <FormTextArea
                    label="Learning outcomes"
                    name={`outcomes-${index}`}
                    rows={3}
                    hint="One outcome per line."
                    value={item.outcomes.join("\n")}
                    onChange={(event) => patch(index, { outcomes: listFromLines(event.target.value) })}
                  />
                  <FormTextArea
                    label="Target audience"
                    name={`audience-${index}`}
                    rows={3}
                    hint="One audience line per row."
                    value={(item.audience ?? []).join("\n")}
                    onChange={(event) => patch(index, { audience: listFromLines(event.target.value) })}
                  />
                  <LogoPicker
                    url={item.thumbnailUrl ?? null}
                    disabled={pending}
                    label="Thumbnail"
                    hint="Optional wide crop for the listing card and detail hero."
                    onChange={(url) => patch(index, { thumbnailUrl: url })}
                  />
                  <FormField
                    label="Promo video URL"
                    name={`promo-${index}`}
                    value={item.promoVideoUrl ?? ""}
                    hint="Paste a YouTube or Vimeo URL, or upload an MP4 below."
                    onChange={(event) => patch(index, { promoVideoUrl: event.target.value.trim() || null })}
                  />
                  <VideoPicker
                    label={`Promo video · ${item.title.trim() || index + 1}`}
                    hint="Optional MP4 or WebM for the course intro."
                    value={toEmbedUrlSafe(item.promoVideoUrl) ? null : (item.promoVideoUrl ?? null)}
                    onChange={(url) => patch(index, { promoVideoUrl: url })}
                  />
                  <div className="grid gap-4 lg:grid-cols-2">
                    <RelatedNamePicker
                      name={`related-skills-${index}`}
                      label="Related skills"
                      selected={item.relatedSkillSlugs ?? []}
                      options={skillOptions}
                      suggestFrom={[item.skill, item.title]}
                      onChange={(slugs) => patch(index, { relatedSkillSlugs: slugs })}
                    />
                    <RelatedNamePicker
                      name={`related-tutorials-${index}`}
                      label="Related tutorials"
                      selected={item.relatedTutorialSlugs ?? []}
                      options={relatedTutorialOptions}
                      suggestFrom={[item.skill, item.title]}
                      onChange={(slugs) => patch(index, { relatedTutorialSlugs: slugs })}
                    />
                    <RelatedNamePicker
                      name={`related-courses-${index}`}
                      label="Related courses"
                      selected={item.relatedCourseSlugs ?? []}
                      options={relatedCourseOptions.filter((option) => option.slug !== item.slug)}
                      suggestFrom={[item.skill, item.title]}
                      onChange={(slugs) => patch(index, { relatedCourseSlugs: slugs })}
                    />
                  </div>
                  <AdminCourseCurriculum
                    courseIndex={index}
                    item={item}
                    pending={pending}
                    openModule={openIndex === index ? openModule : -1}
                    openLesson={openIndex === index ? openLesson : -1}
                    onOpenModule={setOpenModule}
                    onOpenLesson={setOpenLesson}
                    onChange={(modules) => patch(index, { modules })}
                  />
                  <div className="space-y-4 rounded-2xl border border-line bg-paper/50 p-4 sm:p-5">
                    <div>
                      <h3 className="font-display text-xl text-ink">Search listing</h3>
                      <p className="mt-1 text-sm text-muted">
                        Browser tab and search results. Leave blank to use the title and description.
                      </p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        label="SEO title"
                        name={`seoTitle-${index}`}
                        maxLength={80}
                        hint={`${(item.seoTitle ?? "").length}/80`}
                        value={item.seoTitle ?? ""}
                        onChange={(event) => patch(index, { seoTitle: event.target.value })}
                      />
                      <FormTextArea
                        label="SEO description"
                        name={`seoDescription-${index}`}
                        rows={3}
                        maxLength={200}
                        hint={`${(item.seoDescription ?? "").length}/200`}
                        value={item.seoDescription ?? ""}
                        onChange={(event) => patch(index, { seoDescription: event.target.value })}
                      />
                    </div>
                    <FormField
                      label="Canonical URL"
                      name={`canonical-${index}`}
                      value={item.canonicalUrl ?? ""}
                      hint="Optional. Defaults to /courses/your-slug."
                      onChange={(event) => patch(index, { canonicalUrl: event.target.value })}
                    />
                  </div>
                </>
              ) : null}
            </SectionCard>
          );
        })}

        <button
          className="cursor-pointer rounded-full border border-line bg-surface px-4 py-2 text-sm text-ink hover:border-accent"
          type="button"
          onClick={() => {
            const draft = emptyCourse(items.length);
            if (skillFilter) {
              draft.skill = skillFilter;
            }
            if (difficultyFilter) {
              draft.difficulty = difficultyFilter;
            }
            setItems((current) => [...current, draft]);
            setQuery("");
            setStatusFilter("");
            setOpenIndex(items.length);
            setOpenModule(0);
            setOpenLesson(0);
            markDirty();
          }}
        >
          Add course
        </button>

        <div className="sticky bottom-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface/95 px-4 py-3 shadow-lg backdrop-blur">
          <p className="text-xs text-muted">{dirty ? "Unsaved changes" : "All changes saved"}</p>
          <button
            className="rounded-full bg-ink px-5 py-2.5 text-sm text-paper hover:bg-accent disabled:opacity-60"
            type="submit"
            disabled={pending}
          >
            {pending ? "Publishing…" : "Publish courses"}
          </button>
        </div>
      </form>
    </div>
  );
}
