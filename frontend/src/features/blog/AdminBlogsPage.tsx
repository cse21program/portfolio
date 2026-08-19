import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { FilterChip, FilterGroups, FilterRow, FilterSearch, FilterToolbar } from "@/components/ui/FilterBar";
import { FormField, FormSelect, FormTextArea } from "@/components/ui/FormField";
import { AuthError } from "@/features/auth/AuthForm";
import { LogoPicker } from "@/features/experience/LogoPicker";
import { apiGet, apiPut } from "@/lib/api";
import { useFormErrors } from "@/lib/useFormErrors";
import { collectErrors } from "@/lib/validation";
import {
  blogStatuses,
  emptyArticle,
  estimateReadingTime,
  isSlug,
  listFromLines,
  matchesArticleFilters,
  normalizeArticleList,
  paragraphsFromBody,
  slugFromTitle,
  type Article,
} from "@/types/blog";

type BlogFields = "blogs";

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

function readyBlogs(items: Article[]) {
  return items.map((item, index) => {
    const content = item.content.map((entry) => entry.trim()).filter(Boolean);
    return {
      id: item.id,
      title: item.title.trim(),
      slug: slugFromTitle(item.slug) || slugFromTitle(item.title),
      excerpt: item.excerpt.trim(),
      content,
      featuredImageUrl: item.featuredImageUrl?.trim() || null,
      author: item.author?.trim() || "Rezaul Karim",
      category: item.category.trim(),
      tags: item.tags.map((entry) => entry.trim()).filter(Boolean),
      skill: item.skill.trim(),
      topic: item.topic?.trim() ?? "",
      readingTime: item.readingTime?.trim() || estimateReadingTime(content),
      publishedAt: item.publishedAt.trim(),
      status: item.status?.trim() || "draft",
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

function listError(items: ReturnType<typeof readyBlogs>) {
  if (items.length > 80) {
    return "Use 80 posts or fewer";
  }
  const slugs = new Set<string>();
  for (const [index, item] of items.entries()) {
    const label = `Post ${index + 1}`;
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
    if (item.excerpt.length < 8) {
      return `${label}: excerpt must be at least 8 characters`;
    }
    if (item.featuredImageUrl && !isMediaHref(item.featuredImageUrl)) {
      return `${label}: featured image must use an https URL or a site path`;
    }
    if (item.canonicalUrl && !isMediaHref(item.canonicalUrl)) {
      return `${label}: canonical URL must use an https URL or a site path`;
    }
  }
}

export function AdminBlogsPage() {
  const [items, setItems] = useState<Article[]>([]);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [openIndex, setOpenIndex] = useState(-1);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const { fieldErrors, formError, resetErrors, applyFieldErrors, applyCaughtError } =
    useFormErrors<BlogFields>();

  useEffect(() => {
    void apiGet<{ blogs: Article[] }>("/blogs", { cache: "no-store" })
      .then((payload) => {
        setItems(normalizeArticleList(payload.blogs));
      })
      .catch((caught: unknown) => {
        applyCaughtError(caught, "Could not load posts");
      })
      .finally(() => setLoading(false));
  }, [applyCaughtError]);

  function markDirty() {
    setDirty(true);
    setSaved(false);
  }

  function patch(index: number, patchValue: Partial<Article>) {
    setItems((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patchValue } : item)),
    );
    markDirty();
  }

  const categories = useMemo(
    () => [...new Set(items.map((item) => item.category.trim()).filter(Boolean))],
    [items],
  );
  const skills = useMemo(
    () => [...new Set(items.map((item) => item.skill.trim()).filter(Boolean))],
    [items],
  );
  const filtering = Boolean(query.trim() || categoryFilter || skillFilter || statusFilter);
  const visible = useMemo(
    () =>
      items
        .map((item, index) => ({ item, index }))
        .filter(({ item }) =>
          matchesArticleFilters(item, {
            query,
            category: categoryFilter,
            skill: skillFilter,
            tag: "",
            status: statusFilter,
          }),
        ),
    [items, query, categoryFilter, skillFilter, statusFilter],
  );
  const resultLabel = filtering
    ? `${visible.length} of ${items.length} ${items.length === 1 ? "post" : "posts"}`
    : `${items.length} ${items.length === 1 ? "post" : "posts"}`;

  function clearFilters() {
    setQuery("");
    setCategoryFilter("");
    setSkillFilter("");
    setStatusFilter("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = readyBlogs(items);
    resetErrors();
    setSaved(false);
    if (applyFieldErrors(collectErrors({ blogs: listError(next) }))) {
      return;
    }
    setPending(true);
    try {
      const payload = await apiPut<{ blogs: Article[] }>("/blogs", { blogs: next });
      setItems(normalizeArticleList(payload.blogs));
      setDirty(false);
      setSaved(true);
    } catch (caught) {
      applyCaughtError(caught, "Could not save posts");
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
          <p className="text-xs tracking-[0.18em] text-accent uppercase">Writing</p>
          <h1 className="mt-2 font-display text-3xl text-ink">Blog</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-ink-soft">
            Posts with excerpt, body, tags, skill, topic, and a search listing. Drafts stay off the
            public page.
          </p>
        </div>
        <a href="/blog" className="text-sm text-accent hover:text-accent-dark">
          View public page →
        </a>
      </div>

      <AuthError>{formError || Object.values(fieldErrors)[0]}</AuthError>
      {saved ? (
        <p className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink" role="status">
          Posts published.
        </p>
      ) : null}

      <form className="space-y-6" onSubmit={handleSubmit} noValidate>
        <FilterToolbar>
          <FilterSearch
            id="blog-search"
            label="Search posts"
            value={query}
            placeholder="Title, skill, tag, or excerpt"
            resultLabel={resultLabel}
            filtering={filtering}
            onChange={setQuery}
            onClear={clearFilters}
          />
          <FilterGroups>
            {categories.length > 1 ? (
              <FilterRow label="Category" groupLabel="Filter by category">
                <FilterChip label="All" active={!categoryFilter} onClick={() => setCategoryFilter("")} />
                {categories.map((name) => (
                  <FilterChip
                    key={name}
                    label={name}
                    active={categoryFilter === name}
                    onClick={() => setCategoryFilter(name)}
                  />
                ))}
              </FilterRow>
            ) : null}
            {skills.length > 1 ? (
              <FilterRow label="Skill" groupLabel="Filter by skill">
                <FilterChip label="All skills" active={!skillFilter} onClick={() => setSkillFilter("")} />
                {skills.map((name) => (
                  <FilterChip
                    key={name}
                    label={name}
                    active={skillFilter === name}
                    onClick={() => setSkillFilter(name)}
                  />
                ))}
              </FilterRow>
            ) : null}
            <FilterRow label="Status" groupLabel="Filter by status">
              <FilterChip
                label="All statuses"
                active={!statusFilter}
                onClick={() => setStatusFilter("")}
              />
              {blogStatuses.map((status) => (
                <FilterChip
                  key={status}
                  label={status.charAt(0).toUpperCase() + status.slice(1)}
                  active={statusFilter === status}
                  onClick={() => setStatusFilter(status)}
                />
              ))}
            </FilterRow>
          </FilterGroups>
        </FilterToolbar>

        {filtering && visible.length === 0 ? (
          <p className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink-soft">
            No posts match these filters.
          </p>
        ) : null}

        {visible.map(({ item, index }) => {
          const expanded = openIndex === index;
          return (
            <SectionCard
              key={item.id ?? `blog-${index}`}
              title={item.title.trim() || `Post ${index + 1}`}
              description={item.slug ? `/blog/${item.slug}` : "Slug used in /blog/your-slug"}
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
                  className="cursor-pointer text-sm text-muted hover:text-ink"
                  type="button"
                  onClick={() => {
                    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
                    setOpenIndex(-1);
                    markDirty();
                  }}
                >
                  Remove
                </button>
              </div>
              {!expanded ? (
                <p className="text-sm text-muted">
                  {[item.status || "draft", item.category, item.skill].filter(Boolean).join(" · ")}
                  {item.excerpt.trim() ? ` — ${item.excerpt.trim()}` : ""}
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
                      hint="Used in /blog/your-slug"
                      onChange={(event) => patch(index, { slug: event.target.value })}
                    />
                    <FormSelect
                      label="Status"
                      name={`status-${index}`}
                      value={item.status || "draft"}
                      onChange={(event) => patch(index, { status: event.target.value })}
                    >
                      {blogStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </FormSelect>
                    <FormField
                      label="Published date"
                      name={`publishedAt-${index}`}
                      value={item.publishedAt}
                      hint="Shown on the public post."
                      onChange={(event) => patch(index, { publishedAt: event.target.value })}
                    />
                    <FormField
                      label="Author"
                      name={`author-${index}`}
                      value={item.author ?? ""}
                      onChange={(event) => patch(index, { author: event.target.value })}
                    />
                    <FormField
                      label="Reading time"
                      name={`readingTime-${index}`}
                      value={item.readingTime}
                      hint="Leave blank to estimate from the body."
                      onChange={(event) => patch(index, { readingTime: event.target.value })}
                    />
                    <FormField
                      label="Category"
                      name={`category-${index}`}
                      value={item.category}
                      onChange={(event) => patch(index, { category: event.target.value })}
                    />
                    <FormField
                      label="Skill"
                      name={`skill-${index}`}
                      value={item.skill}
                      onChange={(event) => patch(index, { skill: event.target.value })}
                    />
                    <FormField
                      label="Topic"
                      name={`topic-${index}`}
                      value={item.topic ?? ""}
                      hint="Optional lesson this post belongs with."
                      onChange={(event) => patch(index, { topic: event.target.value })}
                    />
                  </div>
                  <FormTextArea
                    label="Excerpt"
                    name={`excerpt-${index}`}
                    rows={2}
                    maxLength={320}
                    value={item.excerpt}
                    onChange={(event) => patch(index, { excerpt: event.target.value })}
                  />
                  <FormTextArea
                    label="Body"
                    name={`body-${index}`}
                    rows={8}
                    hint="Separate paragraphs with a blank line."
                    value={item.content.join("\n\n")}
                    onChange={(event) => patch(index, { content: paragraphsFromBody(event.target.value) })}
                  />
                  <FormTextArea
                    label="Tags"
                    name={`tags-${index}`}
                    rows={2}
                    hint="One tag per line."
                    value={item.tags.join("\n")}
                    onChange={(event) => patch(index, { tags: listFromLines(event.target.value) })}
                  />
                  <LogoPicker
                    url={item.featuredImageUrl ?? null}
                    disabled={pending}
                    label="Featured image"
                    hint="Optional wide crop for the post and listing card."
                    onChange={(url) => patch(index, { featuredImageUrl: url })}
                  />
                  <div className="space-y-4 rounded-2xl border border-line bg-paper/50 p-4 sm:p-5">
                    <div>
                      <h3 className="font-display text-xl text-ink">Search listing</h3>
                      <p className="mt-1 text-sm text-muted">
                        Browser tab and search results. Leave blank to use the title and excerpt.
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
                      hint="Optional. Defaults to /blog/your-slug."
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
            const draft = emptyArticle(items.length);
            if (categoryFilter) {
              draft.category = categoryFilter;
            }
            if (skillFilter) {
              draft.skill = skillFilter;
            }
            setItems((current) => [...current, draft]);
            setQuery("");
            setStatusFilter("");
            setOpenIndex(items.length);
            markDirty();
          }}
        >
          Add post
        </button>

        <div className="sticky bottom-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface/95 px-4 py-3 shadow-lg backdrop-blur">
          <p className="text-xs text-muted">{dirty ? "Unsaved changes" : "All changes saved"}</p>
          <button
            className="rounded-full bg-ink px-5 py-2.5 text-sm text-paper hover:bg-accent disabled:opacity-60"
            type="submit"
            disabled={pending}
          >
            {pending ? "Publishing…" : "Publish posts"}
          </button>
        </div>
      </form>
    </div>
  );
}
