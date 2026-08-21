import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { CatalogVisibilityControls } from "@/components/content/PublishingControls";
import { FormField, FormSelect, FormTextArea } from "@/components/ui/FormField";
import { AuthError } from "@/features/auth/AuthForm";
import { VideoPicker } from "@/features/about/MediaPicker";
import { LogoPicker } from "@/features/experience/LogoPicker";
import { ImagesPicker } from "@/features/projects/ImagesPicker";
import { RelatedNamePicker } from "@/features/skills/RelatedNamePicker";
import {
  relatedBlogOptions,
  relatedCourseOptions,
  relatedTutorialOptions,
} from "@/features/skills/relatedOptions";
import { previewHref } from "@/lib/publishing";
import { apiGet, apiPut } from "@/lib/api";
import { useFormErrors } from "@/lib/useFormErrors";
import { collectErrors } from "@/lib/validation";
import {
  emptySkill,
  emptyTopic,
  fieldOptions,
  isSlug,
  levelOptions,
  NEW_SKILL_FIELD,
  normalizeRelatedSlugs,
  normalizeSkillList,
  slugFromTitle,
  type Skill,
  type SkillTopic,
} from "@/types/skills";

type SkillFields = "skills";

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

function readyTopics(items: SkillTopic[]) {
  return items.map((item, index) => ({
    id: item.id,
    title: item.title.trim(),
    slug: slugFromTitle(item.slug) || slugFromTitle(item.title),
    summary: item.summary.trim(),
    overview: item.overview.trim(),
    body: item.body?.trim() ?? "",
    images: (item.images ?? []).map((entry) => entry.trim()).filter(Boolean),
    videoUrl: item.videoUrl?.trim() || null,
    embedVideoUrl: item.embedVideoUrl?.trim() || null,
    codeSnippets: item.codeSnippets ?? [],
    resources: item.resources ?? [],
    externalLinks: item.externalLinks ?? [],
    relatedBlogSlugs: normalizeRelatedSlugs(item.relatedBlogSlugs),
    relatedTutorialSlugs: normalizeRelatedSlugs(item.relatedTutorialSlugs),
    relatedCourseSlugs: normalizeRelatedSlugs(item.relatedCourseSlugs),
    relatedProjectSlugs: normalizeRelatedSlugs(item.relatedProjectSlugs),
    relatedCertificateSlugs: normalizeRelatedSlugs(item.relatedCertificateSlugs),
    published: item.published !== false,
    seoTitle: item.seoTitle?.trim() ?? "",
    seoDescription: item.seoDescription?.trim() ?? "",
    sortOrder: index,
  }));
}

function readySkills(items: Skill[]) {
  const prepared = items.map((item, index) => ({
    id: item.id,
    name: item.name.trim(),
    slug: slugFromTitle(item.slug) || slugFromTitle(item.name),
    field: item.field.trim(),
    level: item.level.trim() || "Intermediate",
    years: item.years.trim(),
    summary: item.summary.trim(),
    overview: item.overview.trim(),
    iconUrl: item.iconUrl?.trim() || null,
    imageUrl: item.imageUrl?.trim() || null,
    videoUrl: item.videoUrl?.trim() || null,
    embedVideoUrl: item.embedVideoUrl?.trim() || null,
    featured: item.featured,
    published: item.published !== false,
    seoTitle: item.seoTitle?.trim() ?? "",
    seoDescription: item.seoDescription?.trim() ?? "",
    sortOrder: index,
    topics: readyTopics(item.topics),
  }));
  return prepared;
}

function listError(items: ReturnType<typeof readySkills>) {
  const slugs = new Set<string>();
  for (const [index, item] of items.entries()) {
    const label = `Skill ${index + 1}`;
    if (item.name.length < 2) {
      return `${label}: name must be at least 2 characters`;
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
    if (item.field.length < 2) {
      return `${label}: field must be at least 2 characters`;
    }
    if (item.summary.length < 8) {
      return `${label}: summary must be at least 8 characters`;
    }

    const topicSlugs = new Set<string>();
    for (const [topicIndex, topic] of item.topics.entries()) {
      const topicLabel = `${label}, topic ${topicIndex + 1}`;
      if (topic.title.length < 2) {
        return `${topicLabel}: title must be at least 2 characters`;
      }
      if (topic.slug.length < 2) {
        return `${topicLabel}: slug is required`;
      }
      if (!isSlug(topic.slug)) {
        return `${topicLabel}: slug must be lowercase letters, numbers, and hyphens`;
      }
      if (topicSlugs.has(topic.slug)) {
        return `${topicLabel}: slug must be unique within the skill`;
      }
      topicSlugs.add(topic.slug);
      if (topic.summary.length < 8) {
        return `${topicLabel}: summary must be at least 8 characters`;
      }
      const related = [
        ...topic.relatedBlogSlugs,
        ...topic.relatedTutorialSlugs,
        ...topic.relatedCourseSlugs,
      ];
      const invalidRelated = related.find((slug) => !isSlug(slug));
      if (invalidRelated) {
        return `${topicLabel}: related slug "${invalidRelated}" is invalid`;
      }
    }
  }
}

export function AdminSkillsPage() {
  const [items, setItems] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [openSkill, setOpenSkill] = useState(-1);
  const [openTopic, setOpenTopic] = useState(-1);
  const [customFieldAt, setCustomFieldAt] = useState<number | null>(null);
  const { fieldErrors, formError, resetErrors, applyFieldErrors, applyCaughtError } =
    useFormErrors<SkillFields>();

  useEffect(() => {
    void apiGet<{ skills: Skill[] }>("/skills", { cache: "no-store" })
      .then((payload) => {
        setItems(normalizeSkillList(payload.skills));
      })
      .catch((caught: unknown) => {
        applyCaughtError(caught, "Could not load skills");
      })
      .finally(() => setLoading(false));
  }, [applyCaughtError]);

  function markDirty() {
    setDirty(true);
    setSaved(false);
  }

  function patch(index: number, patchValue: Partial<Skill>) {
    setItems((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patchValue } : item)),
    );
    markDirty();
  }

  function patchTopic(skillIndex: number, topicIndex: number, patchValue: Partial<SkillTopic>) {
    setItems((current) =>
      current.map((item, itemIndex) => {
        if (itemIndex !== skillIndex) {
          return item;
        }
        return {
          ...item,
          topics: item.topics.map((topic, currentTopicIndex) =>
            currentTopicIndex === topicIndex ? { ...topic, ...patchValue } : topic,
          ),
        };
      }),
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
    if (openSkill === index) {
      setOpenSkill(index + offset);
    } else if (openSkill === index + offset) {
      setOpenSkill(index);
    }
    markDirty();
  }

  function moveTopic(skillIndex: number, topicIndex: number, offset: number) {
    setItems((current) =>
      current.map((item, itemIndex) => {
        if (itemIndex !== skillIndex) {
          return item;
        }
        const nextIndex = topicIndex + offset;
        if (nextIndex < 0 || nextIndex >= item.topics.length) {
          return item;
        }
        const topics = [...item.topics];
        const [removed] = topics.splice(topicIndex, 1);
        topics.splice(nextIndex, 0, removed!);
        return { ...item, topics };
      }),
    );
    markDirty();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = readySkills(items);
    resetErrors();
    setSaved(false);
    if (applyFieldErrors(collectErrors({ skills: listError(next) }))) {
      return;
    }

    setPending(true);
    try {
      const payload = await apiPut<{ skills: Skill[] }>("/skills", {
        skills: next,
      });
      setItems(normalizeSkillList(payload.skills));
      setDirty(false);
      setSaved(true);
    } catch (caught) {
      applyCaughtError(caught, "Could not save skills");
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
          <p className="text-xs tracking-[0.18em] text-accent uppercase">Knowledge</p>
          <h1 className="mt-2 font-display text-3xl text-ink">Skills</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-ink-soft">
            Open one skill at a time. Each skill belongs to a field. Field video and overview live
            in Fields.
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <a href="/admin/fields" className="text-sm text-accent hover:text-accent-dark">
            Edit fields →
          </a>
          <a href="/skills" className="text-sm text-accent hover:text-accent-dark">
            View public page →
          </a>
        </div>
      </div>

      <AuthError>{formError || Object.values(fieldErrors)[0]}</AuthError>
      {saved ? (
        <p className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink" role="status">
          Skills published.
        </p>
      ) : null}

      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        {items.map((item, index) => {
          const expanded = openSkill === index;
          const newField = index === 0 || items[index - 1]?.field !== item.field;
          return (
            <div key={item.id ?? `skill-${index}`} className="space-y-2">
              {newField && item.field.trim() ? (
                <div className="flex flex-wrap items-end justify-between gap-3 rounded-3xl border border-line bg-paper/60 px-5 py-4">
                  <div>
                    <p className="text-xs tracking-[0.16em] text-accent uppercase">{item.field}</p>
                    <p className="mt-1 text-sm text-muted">
                      Field video and overview are edited in Fields.
                    </p>
                  </div>
                  <a href="/admin/fields" className="text-sm text-accent hover:text-accent-dark">
                    Edit field →
                  </a>
                </div>
              ) : null}
            <SectionCard
              title={item.name.trim() || `Skill ${index + 1}`}
              description={`${item.field.trim() || "Field"} · ${item.topics.length} ${
                item.topics.length === 1 ? "topic" : "topics"
              }`}
            >
              <div className="flex flex-wrap gap-2">
                <button
                  className="cursor-pointer text-sm text-accent hover:text-accent-dark"
                  type="button"
                  onClick={() => {
                    setOpenSkill(expanded ? -1 : index);
                    setOpenTopic(-1);
                  }}
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
                    if (openSkill === index) {
                      setOpenSkill(-1);
                    } else if (openSkill > index) {
                      setOpenSkill(openSkill - 1);
                    }
                    markDirty();
                  }}
                >
                  Remove
                </button>
              </div>

              {!expanded && item.topics.length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                  {item.topics.map((topic) => (
                    <li
                      key={topic.id ?? topic.slug}
                      className="rounded-full border border-line bg-paper px-3 py-1 text-xs text-ink-soft"
                    >
                      {topic.title.trim() || "Untitled topic"}
                    </li>
                  ))}
                </ul>
              ) : null}

              {expanded ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      label="Name"
                      name={`name-${index}`}
                      value={item.name}
                      onChange={(event) => {
                        const name = event.target.value;
                        patch(index, {
                          name,
                          slug: item.slug ? item.slug : slugFromTitle(name),
                        });
                      }}
                    />
                    <FormField
                      label="Slug"
                      name={`slug-${index}`}
                      value={item.slug}
                      hint="Used in /skills/your-slug"
                      onChange={(event) => patch(index, { slug: event.target.value })}
                    />
                    <div className="space-y-3">
                      <FormSelect
                        label="Field"
                        name={`field-${index}`}
                        value={customFieldAt === index ? NEW_SKILL_FIELD : item.field}
                        hint="The public page groups skills by this field"
                        onChange={(event) => {
                          const next = event.target.value;
                          if (next === NEW_SKILL_FIELD) {
                            setCustomFieldAt(index);
                            patch(index, { field: "" });
                            return;
                          }
                          setCustomFieldAt((current) => (current === index ? null : current));
                          patch(index, { field: next });
                        }}
                      >
                        <option value="">Select a field</option>
                        {fieldOptions(items, item.field).map((field) => (
                          <option key={field} value={field}>
                            {field}
                          </option>
                        ))}
                        <option value={NEW_SKILL_FIELD}>Add a new field…</option>
                      </FormSelect>
                      {customFieldAt === index ? (
                        <FormField
                          label="New field name"
                          name={`field-custom-${index}`}
                          value={item.field}
                          placeholder="Frontend Development"
                          autoFocus
                          onChange={(event) => patch(index, { field: event.target.value })}
                        />
                      ) : null}
                    </div>
                    <FormSelect
                      label="Level"
                      name={`level-${index}`}
                      value={item.level}
                      onChange={(event) => patch(index, { level: event.target.value })}
                    >
                      {levelOptions(item.level).map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </FormSelect>
                    <FormField
                      label="Years / focus"
                      name={`years-${index}`}
                      value={item.years}
                      onChange={(event) => patch(index, { years: event.target.value })}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-paper px-3 py-1.5 text-sm text-ink">
                      <input
                        type="checkbox"
                        className="accent-accent"
                        checked={item.featured}
                        onChange={(event) => patch(index, { featured: event.target.checked })}
                      />
                      Featured on Home
                    </label>
                  </div>
                  <CatalogVisibilityControls
                    idPrefix={`skill-${index}`}
                    published={item.published !== false}
                    previewHref={previewHref(`/skills/${item.slug || "draft"}`)}
                    onChange={(published) => patch(index, { published })}
                  />

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

                  <details className="rounded-2xl border border-line bg-paper/50 p-4">
                    <summary className="cursor-pointer text-sm font-medium text-ink">
                      Media and SEO
                    </summary>
                    <div className="mt-4 space-y-4">
                      <FormField
                        label="SEO title"
                        name={`seoTitle-${index}`}
                        value={item.seoTitle ?? ""}
                        onChange={(event) => patch(index, { seoTitle: event.target.value })}
                      />
                      <FormTextArea
                        label="SEO description"
                        name={`seoDescription-${index}`}
                        rows={2}
                        maxLength={200}
                        value={item.seoDescription ?? ""}
                        onChange={(event) => patch(index, { seoDescription: event.target.value })}
                      />
                      <LogoPicker
                        url={item.iconUrl ?? null}
                        disabled={pending}
                        label="Icon"
                        hint="Optional square mark for the skill."
                        onChange={(url) => patch(index, { iconUrl: url })}
                      />
                      <LogoPicker
                        url={item.imageUrl ?? null}
                        disabled={pending}
                        label="Cover image"
                        hint="Optional. Wide crop works best on the skill page and intro poster."
                        onChange={(url) => patch(index, { imageUrl: url })}
                      />
                      <FormField
                        label="Skill YouTube or Vimeo URL"
                        name={`embedVideoUrl-${index}`}
                        value={item.embedVideoUrl ?? ""}
                        hint="Paste Copy video URL. Embedding must be allowed, or upload an MP4 instead."
                        onChange={(event) =>
                          patch(index, { embedVideoUrl: event.target.value || null })
                        }
                      />
                      <VideoPicker
                        label="Skill video"
                        hint="Optional MP4 or WebM. Shown on the skill page."
                        value={item.videoUrl ?? null}
                        onChange={(url) => patch(index, { videoUrl: url })}
                      />
                    </div>
                  </details>

                  <div className="space-y-3 rounded-2xl border border-line bg-paper/60 p-4 sm:p-5">
                    <div>
                      <h3 className="font-display text-xl text-ink">Topics</h3>
                      <p className="mt-1 text-sm text-muted">
                        Open one topic to edit it, or use the{" "}
                        <a className="text-accent hover:text-accent-dark" href="/admin/topics">
                          Topics
                        </a>{" "}
                        page for code, resources, and related projects.
                      </p>
                    </div>

                    {item.topics.map((topic, topicIndex) => {
                      const topicOpen = openTopic === topicIndex;
                      return (
                        <div
                          key={topic.id ?? `topic-${index}-${topicIndex}`}
                          className="rounded-2xl border border-line bg-surface p-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-medium text-ink">
                              {topic.title.trim() || `Topic ${topicIndex + 1}`}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <button
                                className="cursor-pointer text-sm text-accent hover:text-accent-dark"
                                type="button"
                                onClick={() => setOpenTopic(topicOpen ? -1 : topicIndex)}
                              >
                                {topicOpen ? "Collapse" : "Edit topic"}
                              </button>
                              <button
                                className="cursor-pointer text-sm text-muted hover:text-ink disabled:opacity-40"
                                type="button"
                                disabled={topicIndex === 0}
                                onClick={() => moveTopic(index, topicIndex, -1)}
                              >
                                Move up
                              </button>
                              <button
                                className="cursor-pointer text-sm text-muted hover:text-ink disabled:opacity-40"
                                type="button"
                                disabled={topicIndex === item.topics.length - 1}
                                onClick={() => moveTopic(index, topicIndex, 1)}
                              >
                                Move down
                              </button>
                              <button
                                className="cursor-pointer text-sm text-muted hover:text-ink"
                                type="button"
                                onClick={() => {
                                  patch(index, {
                                    topics: item.topics.filter((_, current) => current !== topicIndex),
                                  });
                                  if (openTopic === topicIndex) {
                                    setOpenTopic(-1);
                                  } else if (openTopic > topicIndex) {
                                    setOpenTopic(openTopic - 1);
                                  }
                                }}
                              >
                                Remove topic
                              </button>
                            </div>
                          </div>

                          {topicOpen ? (
                            <div className="mt-4 space-y-4">
                              <div className="grid gap-4 sm:grid-cols-2">
                                <FormField
                                  label="Topic title"
                                  name={`topic-title-${index}-${topicIndex}`}
                                  value={topic.title}
                                  onChange={(event) => {
                                    const title = event.target.value;
                                    patchTopic(index, topicIndex, {
                                      title,
                                      slug: topic.slug ? topic.slug : slugFromTitle(title),
                                    });
                                  }}
                                />
                                <FormField
                                  label="Topic slug"
                                  name={`topic-slug-${index}-${topicIndex}`}
                                  value={topic.slug}
                                  hint={`Used in /skills/${item.slug || "skill"}/your-slug`}
                                  onChange={(event) =>
                                    patchTopic(index, topicIndex, { slug: event.target.value })
                                  }
                                />
                              </div>
                              <FormTextArea
                                label="Topic summary"
                                name={`topic-summary-${index}-${topicIndex}`}
                                rows={2}
                                maxLength={320}
                                value={topic.summary}
                                onChange={(event) =>
                                  patchTopic(index, topicIndex, { summary: event.target.value })
                                }
                              />
                              <FormTextArea
                                label="Topic overview"
                                name={`topic-overview-${index}-${topicIndex}`}
                                rows={3}
                                value={topic.overview}
                                onChange={(event) =>
                                  patchTopic(index, topicIndex, { overview: event.target.value })
                                }
                              />
                              <div className="space-y-3">
                                <p className="text-xs tracking-[0.14em] text-muted uppercase">
                                  Related content
                                </p>
                                <RelatedNamePicker
                                  label="Related writing"
                                  name={`topic-blogs-${index}-${topicIndex}`}
                                  hint="Search the title or paste a slug"
                                  selected={topic.relatedBlogSlugs}
                                  options={relatedBlogOptions}
                                  suggestFrom={[item.name, topic.title]}
                                  onChange={(slugs) =>
                                    patchTopic(index, topicIndex, { relatedBlogSlugs: slugs })
                                  }
                                />
                                <RelatedNamePicker
                                  label="Related tutorials"
                                  name={`topic-tutorials-${index}-${topicIndex}`}
                                  hint="Search the title or paste a slug"
                                  selected={topic.relatedTutorialSlugs}
                                  options={relatedTutorialOptions}
                                  suggestFrom={[item.name, topic.title]}
                                  onChange={(slugs) =>
                                    patchTopic(index, topicIndex, { relatedTutorialSlugs: slugs })
                                  }
                                />
                                <RelatedNamePicker
                                  label="Related courses"
                                  name={`topic-courses-${index}-${topicIndex}`}
                                  hint="Search the title or paste a slug"
                                  selected={topic.relatedCourseSlugs}
                                  options={relatedCourseOptions}
                                  suggestFrom={[item.name, topic.title]}
                                  onChange={(slugs) =>
                                    patchTopic(index, topicIndex, { relatedCourseSlugs: slugs })
                                  }
                                />
                              </div>
                              <ImagesPicker
                                urls={topic.images ?? []}
                                disabled={pending}
                                onChange={(urls) => patchTopic(index, topicIndex, { images: urls })}
                              />
                              <FormField
                                label="Topic YouTube or Vimeo URL"
                                name={`topic-embed-${index}-${topicIndex}`}
                                value={topic.embedVideoUrl ?? ""}
                                hint="Paste Copy video URL. Embedding must be allowed, or upload an MP4 instead."
                                onChange={(event) =>
                                  patchTopic(index, topicIndex, {
                                    embedVideoUrl: event.target.value || null,
                                  })
                                }
                              />
                              <VideoPicker
                                label={`Topic video · ${topic.title.trim() || topicIndex + 1}`}
                                hint="Optional MP4 or WebM."
                                value={topic.videoUrl ?? null}
                                onChange={(url) => patchTopic(index, topicIndex, { videoUrl: url })}
                              />
                            </div>
                          ) : null}
                        </div>
                      );
                    })}

                    <button
                      className="cursor-pointer rounded-full border border-line bg-surface px-4 py-2 text-sm text-ink hover:border-accent"
                      type="button"
                      onClick={() => {
                        patch(index, {
                          topics: [...item.topics, emptyTopic(item.topics.length)],
                        });
                        setOpenTopic(item.topics.length);
                      }}
                    >
                      Add topic
                    </button>
                  </div>
                </>
              ) : null}
            </SectionCard>
            </div>
          );
        })}

        <button
          className="cursor-pointer rounded-full border border-line bg-surface px-4 py-2 text-sm text-ink hover:border-accent"
          type="button"
          onClick={() => {
            setItems((current) => [...current, emptySkill(current.length)]);
            setOpenSkill(items.length);
            setOpenTopic(-1);
            markDirty();
          }}
        >
          Add skill
        </button>

        <div className="sticky bottom-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface/95 px-4 py-3 shadow-lg backdrop-blur">
          <p className="text-xs text-muted">{dirty ? "Unsaved changes" : "All changes saved"}</p>
          <button
            className="rounded-full bg-ink px-5 py-2.5 text-sm text-paper hover:bg-accent disabled:opacity-60"
            type="submit"
            disabled={pending}
          >
            {pending ? "Publishing…" : "Publish skills"}
          </button>
        </div>
      </form>
    </div>
  );
}
