import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { FormField, FormSelect, FormTextArea } from "@/components/ui/FormField";
import { AuthError } from "@/features/auth/AuthForm";
import { VideoPicker } from "@/features/about/MediaPicker";
import { toEmbedUrl } from "@/features/about/videoEmbed";
import { ImagesPicker } from "@/features/projects/ImagesPicker";
import { RelatedNamePicker } from "@/features/skills/RelatedNamePicker";
import { TopicExtrasFields } from "@/features/skills/TopicExtrasFields";
import {
  relatedBlogOptions,
  relatedCertificateOptions,
  relatedCourseOptions,
  relatedProjectOptions,
  relatedTutorialOptions,
} from "@/features/skills/relatedOptions";
import { apiGet, apiPut } from "@/lib/api";
import { useFormErrors } from "@/lib/useFormErrors";
import { collectErrors } from "@/lib/validation";
import { isSlug, slugFromTitle, type Skill } from "@/types/skills";
import {
  emptyKnowledgeTopic,
  matchesTopicFilters,
  normalizeTopicList,
  type KnowledgeTopic,
  type TopicStatusFilter,
} from "@/types/topics";

type TopicFields = "topics";

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={`cursor-pointer rounded-full px-4 py-2 text-sm transition ${
        active ? "bg-ink text-paper" : "border border-line bg-surface text-ink hover:border-accent"
      }`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

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

function readyTopics(items: KnowledgeTopic[]) {
  return items.map((item, index) => ({
    id: item.id,
    skill: item.skill.trim(),
    title: item.title.trim(),
    slug: slugFromTitle(item.slug) || slugFromTitle(item.title),
    summary: item.summary.trim(),
    overview: item.overview.trim(),
    body: item.body?.trim() ?? "",
    images: (item.images ?? []).map((entry) => entry.trim()).filter(Boolean),
    videoUrl: item.videoUrl?.trim() || null,
    embedVideoUrl: item.embedVideoUrl?.trim() || null,
    codeSnippets: (item.codeSnippets ?? [])
      .map((entry) => ({
        label: entry.label.trim(),
        language: entry.language.trim() || "text",
        code: entry.code,
      }))
      .filter((entry) => entry.code.trim()),
    resources: (item.resources ?? [])
      .map((entry) => ({ label: entry.label.trim(), url: entry.url.trim() }))
      .filter((entry) => entry.label && entry.url),
    externalLinks: (item.externalLinks ?? [])
      .map((entry) => ({ label: entry.label.trim(), url: entry.url.trim() }))
      .filter((entry) => entry.label && entry.url),
    relatedBlogSlugs: item.relatedBlogSlugs,
    relatedTutorialSlugs: item.relatedTutorialSlugs,
    relatedCourseSlugs: item.relatedCourseSlugs,
    relatedProjectSlugs: item.relatedProjectSlugs ?? [],
    relatedCertificateSlugs: item.relatedCertificateSlugs ?? [],
    published: item.published !== false,
    seoTitle: item.seoTitle?.trim() ?? "",
    seoDescription: item.seoDescription?.trim() ?? "",
    sortOrder: index,
  }));
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

function listError(items: ReturnType<typeof readyTopics>, skills: Skill[]) {
  if (items.length > 200) {
    return "Use 200 topics or fewer";
  }

  const keys = new Set<string>();
  const skillNames = new Set(skills.map((item) => item.name.trim().toLowerCase()));
  for (const [index, item] of items.entries()) {
    const label = `Topic ${index + 1}`;
    if (!skillNames.has(item.skill.toLowerCase())) {
      return `${label}: choose an existing skill`;
    }
    if (item.title.length < 2) {
      return `${label}: title must be at least 2 characters`;
    }
    if (item.slug.length < 2) {
      return `${label}: slug is required`;
    }
    if (!isSlug(item.slug)) {
      return `${label}: slug must be lowercase letters, numbers, and hyphens`;
    }
    const key = `${item.skill.toLowerCase()}::${item.slug}`;
    if (keys.has(key)) {
      return `${label}: slug must be unique within a skill`;
    }
    keys.add(key);
    if (item.summary.length < 8) {
      return `${label}: summary must be at least 8 characters`;
    }
    if (item.summary.length > 320) {
      return `${label}: summary must be 320 characters or fewer`;
    }
    if (item.embedVideoUrl && !toEmbedUrl(item.embedVideoUrl)) {
      return `${label}: embed must be a YouTube or Vimeo https URL`;
    }
    for (const href of [item.videoUrl, ...item.images]) {
      if (href && !isMediaHref(href)) {
        return `${label}: media must use an https URL or a site path`;
      }
    }
    for (const link of [...item.resources, ...item.externalLinks]) {
      if (!isMediaHref(link.url)) {
        return `${label}: links must use an https URL or a site path`;
      }
    }
  }
}

export function AdminTopicsPage() {
  const [items, setItems] = useState<KnowledgeTopic[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [query, setQuery] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<TopicStatusFilter>("all");
  const [openIndex, setOpenIndex] = useState(-1);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const { fieldErrors, formError, resetErrors, applyFieldErrors, applyCaughtError } =
    useFormErrors<TopicFields>();

  useEffect(() => {
    void Promise.all([
      apiGet<{ topics: KnowledgeTopic[] }>("/topics", { cache: "no-store" }),
      apiGet<{ skills: Skill[] }>("/skills", { cache: "no-store" }),
    ])
      .then(([topicPayload, skillPayload]) => {
        setItems(normalizeTopicList(topicPayload.topics));
        setSkills(skillPayload.skills);
      })
      .catch((caught: unknown) => {
        applyCaughtError(caught, "Could not load topics");
      })
      .finally(() => setLoading(false));
  }, [applyCaughtError]);

  function markDirty() {
    setDirty(true);
    setSaved(false);
  }

  function patch(index: number, patchValue: Partial<KnowledgeTopic>) {
    setItems((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patchValue } : item)),
    );
    markDirty();
  }

  function move(index: number, offset: number) {
    setItems((current) => {
      const nextIndex = index + offset;
      if (nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }
      const next = [...current];
      const [removed] = next.splice(index, 1);
      next.splice(nextIndex, 0, removed!);
      return next;
    });
    if (openIndex === index) {
      setOpenIndex(index + offset);
    } else if (openIndex === index + offset) {
      setOpenIndex(index);
    }
    markDirty();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = readyTopics(items);
    resetErrors();
    setSaved(false);
    if (applyFieldErrors(collectErrors({ topics: listError(next, skills) }))) {
      return;
    }

    setPending(true);
    try {
      const payload = await apiPut<{ topics: KnowledgeTopic[] }>("/topics", { topics: next });
      setItems(normalizeTopicList(payload.topics));
      setDirty(false);
      setSaved(true);
    } catch (caught) {
      applyCaughtError(caught, "Could not save topics");
    } finally {
      setPending(false);
    }
  }

  const skillNames = useMemo(() => {
    const names = [
      ...skills.map((item) => item.name.trim()),
      ...items.map((item) => item.skill.trim()),
    ].filter(Boolean);
    return [...new Set(names)];
  }, [items, skills]);

  const filtering = Boolean(query.trim() || skillFilter || statusFilter !== "all");
  const visible = useMemo(
    () =>
      items
        .map((item, index) => ({ item, index }))
        .filter(({ item }) =>
          matchesTopicFilters(item, { query, skill: skillFilter, status: statusFilter }),
        ),
    [items, query, skillFilter, statusFilter],
  );

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
          <p className="text-xs tracking-[0.18em] text-accent uppercase">Knowledge</p>
          <h1 className="mt-2 font-display text-3xl text-ink">Topics</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-ink-soft">
            Lessons under a skill: overview, images, video, code, related writing, and resources.
          </p>
        </div>
        <a href="/topics" className="text-sm text-accent hover:text-accent-dark">
          View public page →
        </a>
      </div>

      <AuthError>{formError || Object.values(fieldErrors)[0]}</AuthError>
      {saved ? (
        <p className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink" role="status">
          Topics published.
        </p>
      ) : null}

      {skills.length === 0 ? (
        <p className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink-soft">
          Add a skill first, then come back to attach topics.{" "}
          <a className="text-accent hover:text-accent-dark" href="/admin/skills">
            Edit skills →
          </a>
        </p>
      ) : (
        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
          <div className="space-y-4 rounded-3xl border border-line bg-surface p-5 sm:p-6">
            <div>
              <label className="text-sm text-ink" htmlFor="topic-search">
                Search topics
              </label>
              <input
                id="topic-search"
                name="topic-search"
                type="search"
                value={query}
                autoComplete="off"
                placeholder="Title, skill, slug, or summary"
                className="mt-2 w-full rounded-xl border border-line bg-paper px-4 py-3 outline-none focus:border-accent"
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                  }
                }}
              />
            </div>

            {skillNames.length > 1 ? (
              <div>
                <p className="text-xs tracking-[0.14em] text-muted uppercase">Skill</p>
                <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Filter by skill">
                  <FilterChip label="All skills" active={!skillFilter} onClick={() => setSkillFilter("")} />
                  {skillNames.map((name) => (
                    <FilterChip
                      key={name}
                      label={name}
                      active={skillFilter === name}
                      onClick={() => setSkillFilter(name)}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            <div>
              <p className="text-xs tracking-[0.14em] text-muted uppercase">Status</p>
              <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Filter by status">
                <FilterChip
                  label="All"
                  active={statusFilter === "all"}
                  onClick={() => setStatusFilter("all")}
                />
                <FilterChip
                  label="Published"
                  active={statusFilter === "published"}
                  onClick={() => setStatusFilter("published")}
                />
                <FilterChip
                  label="Draft"
                  active={statusFilter === "draft"}
                  onClick={() => setStatusFilter("draft")}
                />
              </div>
            </div>

            <p className="text-xs text-muted">
              {filtering
                ? `${visible.length} of ${items.length} ${items.length === 1 ? "topic" : "topics"}`
                : `${items.length} ${items.length === 1 ? "topic" : "topics"}`}
            </p>
          </div>

          {filtering && visible.length === 0 ? (
            <p className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink-soft">
              No topics match these filters.
            </p>
          ) : null}

          {visible.map(({ item, index }) => {
            const expanded = openIndex === index;
            return (
            <SectionCard
              key={item.id ?? `topic-${index}`}
              title={item.title.trim() || `Topic ${index + 1}`}
              description={
                item.skillSlug && item.slug
                  ? `/topics/${item.skillSlug}/${item.slug}`
                  : "Slug used in /topics/skill/your-slug"
              }
            >
              <div className="flex flex-wrap gap-2">
                <button
                  className="cursor-pointer text-sm text-accent hover:text-accent-dark"
                  type="button"
                  onClick={() => setOpenIndex(expanded ? -1 : index)}
                >
                  {expanded ? "Collapse" : "Edit"}
                </button>
                <button
                  className="cursor-pointer text-sm text-muted hover:text-ink disabled:opacity-40"
                  type="button"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  Move up
                </button>
                <button
                  className="cursor-pointer text-sm text-muted hover:text-ink disabled:opacity-40"
                  type="button"
                  disabled={index === items.length - 1}
                  onClick={() => move(index, 1)}
                >
                  Move down
                </button>
                <button
                  className="cursor-pointer text-sm text-muted hover:text-ink"
                  type="button"
                  onClick={() => {
                    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
                    if (openIndex === index) {
                      setOpenIndex(-1);
                    } else if (openIndex > index) {
                      setOpenIndex(openIndex - 1);
                    }
                    markDirty();
                  }}
                >
                  Remove
                </button>
              </div>

              {!expanded ? (
                <p className="text-sm text-muted">
                  {[item.skill.trim() || "No skill", item.published === false ? "Draft" : "Published"]
                    .filter(Boolean)
                    .join(" · ")}
                  {item.summary.trim() ? ` — ${item.summary.trim()}` : ""}
                </p>
              ) : null}

              {expanded ? (
              <>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormSelect
                  label="Skill"
                  name={`skill-${index}`}
                  value={item.skill}
                  onChange={(event) => {
                    const skill = skills.find((entry) => entry.name === event.target.value);
                    patch(index, {
                      skill: event.target.value,
                      skillSlug: skill?.slug ?? slugFromTitle(event.target.value),
                      field: skill?.field ?? item.field,
                      fieldSlug: skill?.fieldSlug ?? item.fieldSlug,
                    });
                  }}
                >
                  <option value="">Choose a skill</option>
                  {skills.map((skill) => (
                    <option key={skill.id ?? skill.slug} value={skill.name}>
                      {skill.name}
                    </option>
                  ))}
                </FormSelect>
                <label className="inline-flex cursor-pointer items-center gap-2 self-end rounded-full border border-line bg-paper px-3 py-1.5 text-sm text-ink">
                  <input
                    type="checkbox"
                    className="accent-accent"
                    checked={item.published !== false}
                    onChange={(event) => patch(index, { published: event.target.checked })}
                  />
                  Published
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="Title"
                  name={`title-${index}`}
                  maxLength={120}
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
                  hint="Used in /topics/skill/your-slug"
                  onChange={(event) => patch(index, { slug: event.target.value })}
                />
              </div>

              <FormTextArea
                label="Summary"
                name={`summary-${index}`}
                rows={2}
                maxLength={320}
                value={item.summary}
                onChange={(event) => patch(index, { summary: event.target.value })}
              />
              <FormTextArea
                label="Overview"
                name={`overview-${index}`}
                rows={4}
                maxLength={8000}
                value={item.overview}
                onChange={(event) => patch(index, { overview: event.target.value })}
              />
              <FormTextArea
                label="Body"
                name={`body-${index}`}
                rows={6}
                maxLength={20000}
                hint="Longer notes, steps, or explanation."
                value={item.body ?? ""}
                onChange={(event) => patch(index, { body: event.target.value })}
              />

              <FormField
                label="YouTube or Vimeo URL"
                name={`embedVideoUrl-${index}`}
                value={item.embedVideoUrl ?? ""}
                hint="Paste Copy video URL, or upload an MP4 instead."
                onChange={(event) => patch(index, { embedVideoUrl: event.target.value || null })}
              />
              <VideoPicker
                label={`Topic video · ${item.title.trim() || index + 1}`}
                hint="Optional MP4 or WebM."
                value={item.videoUrl ?? null}
                onChange={(url) => patch(index, { videoUrl: url })}
              />
              <ImagesPicker
                urls={item.images ?? []}
                disabled={pending}
                onChange={(urls) => patch(index, { images: urls })}
              />

              <div className="grid gap-4 lg:grid-cols-2">
                <RelatedNamePicker
                  name={`blogs-${index}`}
                  label="Related writing"
                  selected={item.relatedBlogSlugs}
                  options={relatedBlogOptions}
                  suggestFrom={[item.skill, item.title]}
                  onChange={(slugs) => patch(index, { relatedBlogSlugs: slugs })}
                />
                <RelatedNamePicker
                  name={`tutorials-${index}`}
                  label="Related tutorials"
                  selected={item.relatedTutorialSlugs}
                  options={relatedTutorialOptions}
                  suggestFrom={[item.skill, item.title]}
                  onChange={(slugs) => patch(index, { relatedTutorialSlugs: slugs })}
                />
                <RelatedNamePicker
                  name={`courses-${index}`}
                  label="Related courses"
                  selected={item.relatedCourseSlugs}
                  options={relatedCourseOptions}
                  suggestFrom={[item.skill, item.title]}
                  onChange={(slugs) => patch(index, { relatedCourseSlugs: slugs })}
                />
                <RelatedNamePicker
                  name={`projects-${index}`}
                  label="Related projects"
                  selected={item.relatedProjectSlugs ?? []}
                  options={relatedProjectOptions}
                  suggestFrom={[item.skill, item.title]}
                  onChange={(slugs) => patch(index, { relatedProjectSlugs: slugs })}
                />
                <RelatedNamePicker
                  name={`certs-${index}`}
                  label="Related certificates"
                  selected={item.relatedCertificateSlugs ?? []}
                  options={relatedCertificateOptions}
                  suggestFrom={[item.skill, item.title]}
                  onChange={(slugs) => patch(index, { relatedCertificateSlugs: slugs })}
                />
              </div>

              <TopicExtrasFields
                item={item}
                index={index}
                onPatch={(patchValue) => patch(index, patchValue)}
              />
              </>
              ) : null}
            </SectionCard>
            );
          })}

          <button
            className="cursor-pointer rounded-full border border-line bg-surface px-4 py-2 text-sm text-ink hover:border-accent"
            type="button"
            onClick={() => {
              const selected =
                skills.find((item) => item.name === skillFilter) ?? skills[0];
              setItems((current) => [
                ...current,
                emptyKnowledgeTopic(selected?.name ?? "", selected?.slug ?? "", current.length),
              ]);
              setQuery("");
              setStatusFilter("all");
              setOpenIndex(items.length);
              markDirty();
            }}
          >
            Add topic
          </button>

          <div className="sticky bottom-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface/95 px-4 py-3 shadow-lg backdrop-blur">
            <p className="text-xs text-muted">{dirty ? "Unsaved changes" : "All changes saved"}</p>
            <button
              className="rounded-full bg-ink px-5 py-2.5 text-sm text-paper hover:bg-accent disabled:opacity-60"
              type="submit"
              disabled={pending}
            >
              {pending ? "Publishing…" : "Publish topics"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
