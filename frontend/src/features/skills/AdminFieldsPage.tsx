import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { FormField, FormTextArea } from "@/components/ui/FormField";
import { AuthError } from "@/features/auth/AuthForm";
import { VideoPicker } from "@/features/about/MediaPicker";
import { toEmbedUrl } from "@/features/about/videoEmbed";
import { LogoPicker } from "@/features/experience/LogoPicker";
import { apiGet, apiPut } from "@/lib/api";
import { useFormErrors } from "@/lib/useFormErrors";
import { collectErrors } from "@/lib/validation";
import {
  emptyField,
  normalizeFieldList,
  type SkillField,
} from "@/types/fields";
import { isSlug, slugFromTitle } from "@/types/skills";

type FieldFields = "fields";

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

function readyFields(items: SkillField[]) {
  return items.map((item, index) => ({
    id: item.id,
    name: item.name.trim(),
    slug: slugFromTitle(item.slug) || slugFromTitle(item.name),
    summary: item.summary.trim(),
    overview: item.overview.trim(),
    iconUrl: item.iconUrl?.trim() || null,
    thumbnailUrl: item.thumbnailUrl?.trim() || null,
    bannerUrl: item.bannerUrl?.trim() || null,
    videoUrl: item.videoUrl?.trim() || null,
    embedVideoUrl: item.embedVideoUrl?.trim() || null,
    featured: item.featured,
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

function listError(items: ReturnType<typeof readyFields>) {
  if (items.length > 40) {
    return "Use 40 fields or fewer";
  }

  const slugs = new Set<string>();
  for (const [index, item] of items.entries()) {
    const label = `Field ${index + 1}`;
    if (item.name.length < 2) {
      return `${label}: name must be at least 2 characters`;
    }
    if (item.name.length > 80) {
      return `${label}: name must be 80 characters or fewer`;
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
    if (item.summary.length < 8) {
      return `${label}: summary must be at least 8 characters`;
    }
    if (item.summary.length > 320) {
      return `${label}: summary must be 320 characters or fewer`;
    }
    if (item.overview.length > 8000) {
      return `${label}: overview must be 8000 characters or fewer`;
    }
    if (item.seoTitle.length > 80) {
      return `${label}: SEO title must be 80 characters or fewer`;
    }
    if (item.seoDescription.length > 200) {
      return `${label}: SEO description must be 200 characters or fewer`;
    }
    if (item.embedVideoUrl && !toEmbedUrl(item.embedVideoUrl)) {
      return `${label}: embed must be a YouTube or Vimeo https URL`;
    }
    for (const href of [item.iconUrl, item.thumbnailUrl, item.bannerUrl, item.videoUrl]) {
      if (href && !isMediaHref(href)) {
        return `${label}: media must use an https URL or a site path`;
      }
    }
  }
}

export function AdminFieldsPage() {
  const [items, setItems] = useState<SkillField[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const { fieldErrors, formError, resetErrors, applyFieldErrors, applyCaughtError } =
    useFormErrors<FieldFields>();

  useEffect(() => {
    void apiGet<{ fields: SkillField[] }>("/fields", { cache: "no-store" })
      .then((payload) => {
        setItems(normalizeFieldList(payload.fields));
      })
      .catch((caught: unknown) => {
        applyCaughtError(caught, "Could not load fields");
      })
      .finally(() => setLoading(false));
  }, [applyCaughtError]);

  function markDirty() {
    setDirty(true);
    setSaved(false);
  }

  function patch(index: number, patchValue: Partial<SkillField>) {
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
    markDirty();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = readyFields(items);
    resetErrors();
    setSaved(false);
    if (applyFieldErrors(collectErrors({ fields: listError(next) }))) {
      return;
    }

    setPending(true);
    try {
      const payload = await apiPut<{ fields: SkillField[] }>("/fields", { fields: next });
      setItems(normalizeFieldList(payload.fields));
      setDirty(false);
      setSaved(true);
    } catch (caught) {
      applyCaughtError(caught, "Could not save fields");
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
          <h1 className="mt-2 font-display text-3xl text-ink">Fields</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-ink-soft">
            Broad areas such as Backend Development or DevOps. Each field can have its own intro
            video, then skills and topics underneath.
          </p>
        </div>
        <a href="/skills" className="text-sm text-accent hover:text-accent-dark">
          View public page →
        </a>
      </div>

      <AuthError>{formError || Object.values(fieldErrors)[0]}</AuthError>
      {saved ? (
        <p className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink" role="status">
          Fields published.
        </p>
      ) : null}

      <form className="space-y-6" onSubmit={handleSubmit} noValidate>
        {items.map((item, index) => (
          <SectionCard
            key={item.id ?? `field-${index}`}
            title={item.name.trim() || `Field ${index + 1}`}
            description={item.slug.trim() ? `/fields/${item.slug}` : "Slug used in /fields/your-slug"}
          >
            <div className="flex flex-wrap gap-2">
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
                  markDirty();
                }}
              >
                Remove
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Name"
                name={`name-${index}`}
                maxLength={80}
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
                maxLength={80}
                value={item.slug}
                hint="Used in /fields/your-slug"
                onChange={(event) => patch(index, { slug: event.target.value })}
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
                Featured
              </label>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-paper px-3 py-1.5 text-sm text-ink">
                <input
                  type="checkbox"
                  className="accent-accent"
                  checked={item.published !== false}
                  onChange={(event) => patch(index, { published: event.target.checked })}
                />
                Published
              </label>
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

            <FormField
              label="YouTube or Vimeo URL"
              name={`embedVideoUrl-${index}`}
              value={item.embedVideoUrl ?? ""}
              hint="Paste Copy video URL. Embedding must be allowed, or upload an MP4 instead."
              onChange={(event) => patch(index, { embedVideoUrl: event.target.value || null })}
            />
            <VideoPicker
              label={`Field video · ${item.name.trim() || index + 1}`}
              hint="Optional MP4 or WebM. Shown on the field page and /skills chapter."
              value={item.videoUrl ?? null}
              onChange={(url) => patch(index, { videoUrl: url })}
            />
            <LogoPicker
              url={item.iconUrl ?? null}
              disabled={pending}
              label="Icon"
              hint="Optional square mark."
              onChange={(url) => patch(index, { iconUrl: url })}
            />
            <LogoPicker
              url={item.thumbnailUrl ?? null}
              disabled={pending}
              label="Thumbnail"
              hint="Optional. Used as the video poster when set."
              onChange={(url) => patch(index, { thumbnailUrl: url })}
            />
            <LogoPicker
              url={item.bannerUrl ?? null}
              disabled={pending}
              label="Banner"
              hint="Optional wide image behind the field hero."
              onChange={(url) => patch(index, { bannerUrl: url })}
            />
            <details className="rounded-2xl border border-line bg-paper/50 p-4">
              <summary className="cursor-pointer text-sm font-medium text-ink">SEO</summary>
              <div className="mt-4 space-y-4">
                <FormField
                  label="SEO title"
                  name={`seoTitle-${index}`}
                  maxLength={80}
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
              </div>
            </details>
          </SectionCard>
        ))}

        <button
          className="cursor-pointer rounded-full border border-line bg-surface px-4 py-2 text-sm text-ink hover:border-accent"
          type="button"
          onClick={() => {
            setItems((current) => [...current, emptyField(current.length)]);
            markDirty();
          }}
        >
          Add field
        </button>

        <div className="sticky bottom-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface/95 px-4 py-3 shadow-lg backdrop-blur">
          <p className="text-xs text-muted">{dirty ? "Unsaved changes" : "All changes saved"}</p>
          <button
            className="rounded-full bg-ink px-5 py-2.5 text-sm text-paper hover:bg-accent disabled:opacity-60"
            type="submit"
            disabled={pending}
          >
            {pending ? "Publishing…" : "Publish fields"}
          </button>
        </div>
      </form>
    </div>
  );
}
