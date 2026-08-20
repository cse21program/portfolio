import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { FormField, FormTextArea } from "@/components/ui/FormField";
import { AuthError } from "@/features/auth/AuthForm";
import { isUsableHref } from "@/features/about/linkPlatforms";
import { VideoPicker } from "@/features/about/MediaPicker";
import { LogoPicker } from "@/features/experience/LogoPicker";
import { ImagesPicker } from "@/features/projects/ImagesPicker";
import { apiGet, apiPut } from "@/lib/api";
import { useFormErrors } from "@/lib/useFormErrors";
import { collectErrors } from "@/lib/validation";
import {
  emptyProject,
  normalizeProjectList,
  slugFromTitle,
  type Project,
} from "@/types/projects";

type ProjectFields = "projects";

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

function readyProjects(items: Project[]) {
  return items.map((item, index) => ({
    id: item.id,
    title: item.title.trim(),
    slug: (item.slug.trim() || slugFromTitle(item.title)).toLowerCase(),
    shortDescription: item.shortDescription.trim(),
    fullDescription: item.fullDescription?.trim() ?? "",
    thumbnailUrl: item.thumbnailUrl?.trim() || null,
    images: (item.images ?? []).map((entry) => entry.trim()).filter(Boolean),
    demoVideoUrl: item.demoVideoUrl?.trim() || null,
    category: item.category.trim(),
    technologies: item.technologies.map((entry) => entry.trim()).filter(Boolean),
    features: item.features.map((entry) => entry.trim()).filter(Boolean),
    architecture: item.architecture.trim(),
    problem: item.problem.trim(),
    requirements: item.requirements?.trim() ?? "",
    solution: item.solution.trim(),
    challenges: item.challenges.map((entry) => entry.trim()).filter(Boolean),
    solutions: (item.solutions ?? []).map((entry) => entry.trim()).filter(Boolean),
    lessons: item.lessons.map((entry) => entry.trim()).filter(Boolean),
    status: item.status.trim() || "Shipped",
    startDate: item.startDate.trim(),
    endDate: item.endDate.trim(),
    githubUrl: item.githubUrl?.trim() || null,
    liveUrl: item.liveUrl?.trim() || null,
    docsUrl: item.docsUrl?.trim() || null,
    featured: item.featured,
    seoTitle: item.seoTitle?.trim() ?? "",
    seoDescription: item.seoDescription?.trim() ?? "",
    sortOrder: index,
  }));
}

function listError(items: ReturnType<typeof readyProjects>) {
  const slugs = new Set<string>();
  for (const [index, item] of items.entries()) {
    const label = `Project ${index + 1}`;
    if (item.title.length < 2) {
      return `${label}: title must be at least 2 characters`;
    }
    if (item.slug.length < 2) {
      return `${label}: slug is required`;
    }
    if (slugs.has(item.slug)) {
      return `${label}: slug must be unique`;
    }
    slugs.add(item.slug);
    if (item.shortDescription.length < 8) {
      return `${label}: short description must be at least 8 characters`;
    }
    for (const href of [item.githubUrl, item.liveUrl, item.docsUrl]) {
      if (href && !isUsableHref(href)) {
        return `${label}: links must use https, mailto, or a site path`;
      }
    }
  }
}

export function AdminProjectsPage() {
  const [items, setItems] = useState<Project[]>([]);
  const [openIndex, setOpenIndex] = useState(-1);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const { fieldErrors, formError, resetErrors, applyFieldErrors, applyCaughtError } =
    useFormErrors<ProjectFields>();

  useEffect(() => {
    void apiGet<{ projects: Project[] }>("/projects", { cache: "no-store" })
      .then((payload) => {
        setItems(normalizeProjectList(payload.projects));
      })
      .catch((caught: unknown) => {
        applyCaughtError(caught, "Could not load projects");
      })
      .finally(() => setLoading(false));
  }, [applyCaughtError]);

  function patch(index: number, patchValue: Partial<Project>) {
    setItems((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patchValue } : item)),
    );
    setDirty(true);
    setSaved(false);
  }

  function move(index: number, offset: number) {
    const nextIndex = index + offset;
    setItems((current) => {
      if (nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }
      const next = [...current];
      const [removed] = next.splice(index, 1);
      next.splice(nextIndex, 0, removed!);
      return next;
    });
    setOpenIndex((current) => {
      if (nextIndex < 0 || nextIndex >= items.length) {
        return current;
      }
      if (current === index) {
        return nextIndex;
      }
      if (current === nextIndex) {
        return index;
      }
      return current;
    });
    setDirty(true);
    setSaved(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = readyProjects(items);
    resetErrors();
    setSaved(false);
    if (applyFieldErrors(collectErrors({ projects: listError(next) }))) {
      return;
    }

    setPending(true);
    try {
      const payload = await apiPut<{ projects: Project[] }>("/projects", {
        projects: next,
      });
      setItems(normalizeProjectList(payload.projects));
      setDirty(false);
      setSaved(true);
    } catch (caught) {
      applyCaughtError(caught, "Could not save projects");
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
          <p className="text-xs tracking-[0.18em] text-accent uppercase">Portfolio</p>
          <h1 className="mt-2 font-display text-3xl text-ink">Projects</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-ink-soft">
            Case studies visitors see on Home, /projects, and the CV. Featured items lead the
            homepage.
          </p>
        </div>
        <a href="/projects" className="text-sm text-accent hover:text-accent-dark">
          View public page →
        </a>
      </div>

      <AuthError>{formError}</AuthError>
      {fieldErrors.projects ? (
        <p className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-accent" role="alert">
          {fieldErrors.projects}
        </p>
      ) : null}
      {saved ? (
        <p className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink" role="status">
          Projects published.
        </p>
      ) : null}

      <form className="space-y-6" onSubmit={handleSubmit} noValidate>
        {items.map((item, index) => {
          const expanded = openIndex === index;
          return (
          <SectionCard
            key={item.id ?? `project-${index}`}
            title={item.title.trim() || `Project ${index + 1}`}
            description={`${item.category.trim() || "Category"} · ${item.status || "status"}`}
          >
            <div className="flex flex-wrap gap-2">
              <button
                className="cursor-pointer text-sm text-accent hover:text-accent-dark"
                type="button"
                aria-expanded={expanded}
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
                  setOpenIndex(-1);
                  setDirty(true);
                  setSaved(false);
                }}
              >
                Remove
              </button>
            </div>
            {!expanded ? (
              <p className="text-sm text-muted">
                {[item.featured ? "Featured" : "", item.startDate, item.endDate].filter(Boolean).join(" · ")}
                {item.shortDescription.trim() ? ` — ${item.shortDescription.trim()}` : ""}
              </p>
            ) : null}
            {expanded ? (
              <>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Title"
                name={`title-${index}`}
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
                value={item.slug}
                hint="Used in /projects/your-slug"
                onChange={(event) => patch(index, { slug: event.target.value })}
              />
              <FormField
                label="Category"
                name={`category-${index}`}
                value={item.category}
                onChange={(event) => patch(index, { category: event.target.value })}
              />
              <FormField
                label="Status"
                name={`status-${index}`}
                value={item.status}
                hint="Shipped, In progress, or Archived"
                onChange={(event) => patch(index, { status: event.target.value })}
              />
              <FormField
                label="Start date"
                name={`startDate-${index}`}
                value={item.startDate}
                onChange={(event) => patch(index, { startDate: event.target.value })}
              />
              <FormField
                label="Completion date"
                name={`endDate-${index}`}
                value={item.endDate}
                onChange={(event) => patch(index, { endDate: event.target.value })}
              />
              <FormField
                label="GitHub URL"
                name={`githubUrl-${index}`}
                value={item.githubUrl ?? ""}
                placeholder="https://"
                onChange={(event) => patch(index, { githubUrl: event.target.value || null })}
              />
              <FormField
                label="Live URL"
                name={`liveUrl-${index}`}
                value={item.liveUrl ?? ""}
                placeholder="https://"
                onChange={(event) => patch(index, { liveUrl: event.target.value || null })}
              />
              <FormField
                label="Documentation URL"
                name={`docsUrl-${index}`}
                value={item.docsUrl ?? ""}
                placeholder="https://"
                onChange={(event) => patch(index, { docsUrl: event.target.value || null })}
              />
              <FormField
                label="SEO title"
                name={`seoTitle-${index}`}
                value={item.seoTitle ?? ""}
                onChange={(event) => patch(index, { seoTitle: event.target.value })}
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={item.featured}
                onChange={(event) => patch(index, { featured: event.target.checked })}
              />
              Featured on Home and the CV
            </label>

            <FormTextArea
              label="Short description"
              name={`shortDescription-${index}`}
              rows={2}
              maxLength={320}
              value={item.shortDescription}
              onChange={(event) => patch(index, { shortDescription: event.target.value })}
            />
            <FormTextArea
              label="Full description / overview"
              name={`fullDescription-${index}`}
              rows={4}
              maxLength={8000}
              value={item.fullDescription ?? ""}
              onChange={(event) => patch(index, { fullDescription: event.target.value })}
            />
            <FormTextArea
              label="Problem"
              name={`problem-${index}`}
              rows={3}
              value={item.problem}
              onChange={(event) => patch(index, { problem: event.target.value })}
            />
            <FormTextArea
              label="Business requirements"
              name={`requirements-${index}`}
              rows={3}
              value={item.requirements ?? ""}
              onChange={(event) => patch(index, { requirements: event.target.value })}
            />
            <FormTextArea
              label="Solution"
              name={`solution-${index}`}
              rows={3}
              value={item.solution}
              onChange={(event) => patch(index, { solution: event.target.value })}
            />
            <FormTextArea
              label="Architecture"
              name={`architecture-${index}`}
              rows={3}
              value={item.architecture}
              onChange={(event) => patch(index, { architecture: event.target.value })}
            />
            <FormTextArea
              label="Features"
              name={`features-${index}`}
              rows={3}
              value={item.features.join("\n")}
              hint="One item per line"
              onChange={(event) => patch(index, { features: event.target.value.split("\n") })}
            />
            <FormTextArea
              label="Technologies"
              name={`technologies-${index}`}
              rows={2}
              value={item.technologies.join("\n")}
              hint="One item per line"
              onChange={(event) => patch(index, { technologies: event.target.value.split("\n") })}
            />
            <FormTextArea
              label="Challenges"
              name={`challenges-${index}`}
              rows={3}
              value={item.challenges.join("\n")}
              hint="One item per line"
              onChange={(event) => patch(index, { challenges: event.target.value.split("\n") })}
            />
            <FormTextArea
              label="Solutions"
              name={`solutions-${index}`}
              rows={3}
              value={(item.solutions ?? []).join("\n")}
              hint="One item per line"
              onChange={(event) => patch(index, { solutions: event.target.value.split("\n") })}
            />
            <FormTextArea
              label="Lessons learned"
              name={`lessons-${index}`}
              rows={3}
              value={item.lessons.join("\n")}
              hint="One item per line"
              onChange={(event) => patch(index, { lessons: event.target.value.split("\n") })}
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
              url={item.thumbnailUrl ?? null}
              disabled={pending}
              label="Thumbnail"
              hint="Optional. Wide crop works best on the project cards."
              onChange={(url) => patch(index, { thumbnailUrl: url })}
            />
            <ImagesPicker
              urls={item.images ?? []}
              disabled={pending}
              onChange={(urls) => patch(index, { images: urls })}
            />
            <VideoPicker
              label="Demo video"
              hint="Optional MP4 or WebM."
              value={item.demoVideoUrl ?? null}
              onChange={(url) => patch(index, { demoVideoUrl: url })}
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
            setItems((current) => [...current, emptyProject(current.length)]);
            setOpenIndex(items.length);
            setDirty(true);
            setSaved(false);
          }}
        >
          Add project
        </button>

        <div className="sticky bottom-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface/95 px-4 py-3 shadow-lg backdrop-blur">
          <p className="text-xs text-muted">{dirty ? "Unsaved changes" : "All changes saved"}</p>
          <button
            className="rounded-full bg-ink px-5 py-2.5 text-sm text-paper hover:bg-accent disabled:opacity-60"
            type="submit"
            disabled={pending}
          >
            {pending ? "Publishing…" : "Publish projects"}
          </button>
        </div>
      </form>
    </div>
  );
}
