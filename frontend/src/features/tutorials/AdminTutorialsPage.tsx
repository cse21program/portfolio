import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { PublishingControls } from "@/components/content/PublishingControls";
import { FilterChip, FilterGroups, FilterRow, FilterSearch, FilterToolbar } from "@/components/ui/FilterBar";
import { FormField, FormSelect, FormTextArea } from "@/components/ui/FormField";
import { AuthError } from "@/features/auth/AuthForm";
import { LogoPicker } from "@/features/experience/LogoPicker";
import { relatedCourseOptions, type RelatedOption } from "@/features/skills/relatedOptions";
import { RelatedNamePicker } from "@/features/skills/RelatedNamePicker";
import { useSkills } from "@/features/skills/useSkills";
import { AdminTutorialSections } from "@/features/tutorials/AdminTutorialSections";
import { previewHref } from "@/lib/publishing";
import { apiGet, apiPut } from "@/lib/api";
import { useFormErrors } from "@/lib/useFormErrors";
import { collectErrors } from "@/lib/validation";
import {
  emptyTutorial,
  isSlug,
  listFromLines,
  matchesTutorialFilters,
  normalizeSection,
  normalizeTutorialList,
  slugFromTitle,
  tutorialDifficulties,
  tutorialStatuses,
  type Tutorial,
} from "@/types/tutorial";

type TutorialFields = "tutorials";

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

function readyTutorials(items: Tutorial[]) {
  return items.map((item, index) => {
    const free = item.free;
    return {
      id: item.id,
      title: item.title.trim(),
      slug: slugFromTitle(item.slug) || slugFromTitle(item.title),
      description: item.description.trim(),
      difficulty: item.difficulty.trim() || "Beginner",
      prerequisites: item.prerequisites?.map((entry) => entry.trim()).filter(Boolean) ?? [],
      duration: item.duration.trim(),
      thumbnailUrl: item.thumbnailUrl?.trim() || null,
      skill: item.skill.trim(),
      relatedSkillSlugs: item.relatedSkillSlugs?.map((entry) => entry.trim()).filter(Boolean) ?? [],
      relatedCourseSlugs: item.relatedCourseSlugs?.map((entry) => entry.trim()).filter(Boolean) ?? [],
      price: free ? "Free" : item.price.trim() || "Premium",
      free,
      sections: item.sections
        .filter((section) => section.title.trim())
        .map((section) => normalizeSection({ ...section, title: section.title })),
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

function listError(items: ReturnType<typeof readyTutorials>) {
  if (items.length > 80) {
    return "Use 80 tutorials or fewer";
  }
  const slugs = new Set<string>();
  for (const [index, item] of items.entries()) {
    const label = `Tutorial ${index + 1}`;
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
    if (item.canonicalUrl && !isMediaHref(item.canonicalUrl)) {
      return `${label}: canonical URL must use an https URL or a site path`;
    }
    if (item.sections.length === 0) {
      return `${label}: add at least one section`;
    }
  }
}

function statusLabel(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function AdminTutorialsPage() {
  const { skills } = useSkills();
  const [items, setItems] = useState<Tutorial[]>([]);
  const [query, setQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [accessFilter, setAccessFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [openIndex, setOpenIndex] = useState(-1);
  const [openSection, setOpenSection] = useState(-1);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const { fieldErrors, formError, resetErrors, applyFieldErrors, applyCaughtError } =
    useFormErrors<TutorialFields>();

  useEffect(() => {
    void apiGet<{ tutorials: Tutorial[] }>("/tutorials", { cache: "no-store" })
      .then((payload) => {
        setItems(normalizeTutorialList(payload.tutorials));
      })
      .catch((caught: unknown) => {
        applyCaughtError(caught, "Could not load tutorials");
      })
      .finally(() => setLoading(false));
  }, [applyCaughtError]);

  function markDirty() {
    setDirty(true);
    setSaved(false);
  }

  function patch(index: number, patchValue: Partial<Tutorial>) {
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
          matchesTutorialFilters(item, {
            query,
            difficulty: difficultyFilter,
            skill: skillFilter,
            access: accessFilter,
            status: statusFilter,
          }),
        ),
    [items, query, difficultyFilter, skillFilter, accessFilter, statusFilter],
  );
  const resultLabel = filtering
    ? `${visible.length} of ${items.length} ${items.length === 1 ? "tutorial" : "tutorials"}`
    : `${items.length} ${items.length === 1 ? "tutorial" : "tutorials"}`;

  function clearFilters() {
    setQuery("");
    setDifficultyFilter("");
    setSkillFilter("");
    setAccessFilter("");
    setStatusFilter("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = readyTutorials(items);
    resetErrors();
    setSaved(false);
    if (applyFieldErrors(collectErrors({ tutorials: listError(next) }))) {
      return;
    }
    setPending(true);
    try {
      const payload = await apiPut<{ tutorials: Tutorial[] }>("/tutorials", { tutorials: next });
      setItems(normalizeTutorialList(payload.tutorials));
      setDirty(false);
      setSaved(true);
    } catch (caught) {
      applyCaughtError(caught, "Could not save tutorials");
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
          <h1 className="mt-2 font-display text-3xl text-ink">Tutorials</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-ink-soft">
            Structured walkthroughs with sections, video, code, and resources. Drafts stay off the
            public page.
          </p>
        </div>
        <a href="/tutorials" className="text-sm text-accent hover:text-accent-dark">
          View public page →
        </a>
      </div>

      <AuthError>{formError || Object.values(fieldErrors)[0]}</AuthError>
      {saved ? (
        <p className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink" role="status">
          Tutorials published.
        </p>
      ) : null}

      <form className="space-y-6" onSubmit={handleSubmit} noValidate>
        <FilterToolbar>
          <FilterSearch
            id="tutorial-admin-search"
            label="Search tutorials"
            value={query}
            placeholder="Title, skill, or description"
            resultLabel={resultLabel}
            filtering={filtering}
            onChange={setQuery}
            onClear={clearFilters}
          />
          <FilterGroups count={[difficultyFilter, skillFilter, accessFilter, statusFilter].filter(Boolean).length}>
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
              {tutorialStatuses.map((status) => (
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
            No tutorials match these filters.
          </p>
        ) : null}

        {visible.map(({ item, index }) => {
          const expanded = openIndex === index;
          return (
            <SectionCard
              key={item.id ?? `tutorial-${index}`}
              title={item.title.trim() || `Tutorial ${index + 1}`}
              description={item.slug ? `/tutorials/${item.slug}` : "Slug used in /tutorials/your-slug"}
            >
              <div className="flex flex-wrap gap-2">
                <button
                  className="cursor-pointer text-sm text-accent hover:text-accent-dark"
                  type="button"
                  onClick={() => {
                    setOpenIndex(expanded ? -1 : index);
                    setOpenSection(-1);
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
                    setOpenSection(-1);
                    markDirty();
                  }}
                >
                  Remove
                </button>
              </div>
              {!expanded ? (
                <p className="text-sm text-muted">
                  {[statusLabel(item.status || "draft"), item.difficulty, item.skill, item.free ? "Free" : "Premium"]
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
                      hint="Used in /tutorials/your-slug"
                      onChange={(event) => patch(index, { slug: event.target.value })}
                    />
                    <FormSelect
                      label="Difficulty"
                      name={`difficulty-${index}`}
                      value={item.difficulty}
                      onChange={(event) => patch(index, { difficulty: event.target.value })}
                    >
                      {tutorialDifficulties.map((difficulty) => (
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
                      hint="Shown when access is premium. Free tutorials always say Free."
                      onChange={(event) => patch(index, { price: event.target.value })}
                    />
                    <FormField
                      label="Duration"
                      name={`duration-${index}`}
                      value={item.duration}
                      hint="Estimated time, such as 4 hours."
                      onChange={(event) => patch(index, { duration: event.target.value })}
                    />
                    <FormField
                      label="Skill"
                      name={`skill-${index}`}
                      value={item.skill}
                      onChange={(event) => patch(index, { skill: event.target.value })}
                    />
                  </div>
                  <PublishingControls
                    idPrefix={`tutorial-${index}`}
                    status={item.status || "draft"}
                    publishedAt={item.publishedAt ?? ""}
                    previewHref={previewHref(`/tutorials/${item.slug || "draft"}`)}
                    onChange={(next) => patch(index, next)}
                  />
                  <FormTextArea
                    label="Description"
                    name={`description-${index}`}
                    rows={3}
                    maxLength={480}
                    value={item.description}
                    onChange={(event) => patch(index, { description: event.target.value })}
                  />
                  <FormTextArea
                    label="Prerequisites"
                    name={`prerequisites-${index}`}
                    rows={3}
                    hint="One prerequisite per line."
                    value={(item.prerequisites ?? []).join("\n")}
                    onChange={(event) => patch(index, { prerequisites: listFromLines(event.target.value) })}
                  />
                  <LogoPicker
                    url={item.thumbnailUrl ?? null}
                    disabled={pending}
                    label="Thumbnail"
                    hint="Optional wide crop for the listing card and detail hero."
                    onChange={(url) => patch(index, { thumbnailUrl: url })}
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
                      name={`related-courses-${index}`}
                      label="Related courses"
                      selected={item.relatedCourseSlugs ?? []}
                      options={relatedCourseOptions}
                      suggestFrom={[item.skill, item.title]}
                      onChange={(slugs) => patch(index, { relatedCourseSlugs: slugs })}
                    />
                  </div>
                  <AdminTutorialSections
                    tutorialIndex={index}
                    item={item}
                    pending={pending}
                    openSection={openIndex === index ? openSection : -1}
                    onOpenSection={setOpenSection}
                    onChange={(sections) => patch(index, { sections })}
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
                      hint="Optional. Defaults to /tutorials/your-slug."
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
            const draft = emptyTutorial(items.length);
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
            setOpenSection(0);
            markDirty();
          }}
        >
          Add tutorial
        </button>

        <div className="sticky bottom-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface/95 px-4 py-3 shadow-lg backdrop-blur">
          <p className="text-xs text-muted">{dirty ? "Unsaved changes" : "All changes saved"}</p>
          <button
            className="rounded-full bg-ink px-5 py-2.5 text-sm text-paper hover:bg-accent disabled:opacity-60"
            type="submit"
            disabled={pending}
          >
            {pending ? "Publishing…" : "Publish tutorials"}
          </button>
        </div>
      </form>
    </div>
  );
}
