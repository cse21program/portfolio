import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { FormField, FormSelect, FormTextArea } from "@/components/ui/FormField";
import { AuthError } from "@/features/auth/AuthForm";
import { isUsableHref } from "@/features/about/linkPlatforms";
import { LogoPicker } from "@/features/experience/LogoPicker";
import { apiGet, apiPut } from "@/lib/api";
import { useFormErrors } from "@/lib/useFormErrors";
import { collectErrors } from "@/lib/validation";
import {
  EMPLOYMENT_TYPES,
  emptyExperience,
  normalizeExperienceList,
  type Experience,
} from "@/types/experience";

type ExperienceFields = "experiences";

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

function readyExperiences(items: Experience[]) {
  return items.map((item, index) => ({
    id: item.id,
    company: item.company.trim(),
    position: item.position.trim(),
    type: item.type.trim() || "Full-time",
    location: item.location.trim(),
    startDate: item.startDate.trim(),
    endDate: item.current ? "" : item.endDate.trim(),
    current: item.current,
    description: item.description.trim(),
    responsibilities: item.responsibilities.map((entry) => entry.trim()).filter(Boolean),
    achievements: item.achievements.map((entry) => entry.trim()).filter(Boolean),
    technologies: item.technologies.map((entry) => entry.trim()).filter(Boolean),
    logoUrl: item.logoUrl?.trim() || null,
    website: item.website?.trim() || null,
    sortOrder: index,
  }));
}

function listError(items: Experience[]) {
  for (const [index, item] of items.entries()) {
    const label = `Role ${index + 1}`;
    if (item.company.trim().length < 2) {
      return `${label}: company must be at least 2 characters`;
    }
    if (item.position.trim().length < 2) {
      return `${label}: position must be at least 2 characters`;
    }
    if (!item.startDate.trim()) {
      return `${label}: start date is required`;
    }
    if (item.website && !isUsableHref(item.website)) {
      return `${label}: website must use https, mailto, or a site path`;
    }
  }
}

function employmentOptions(current: string) {
  if (current && !EMPLOYMENT_TYPES.includes(current as (typeof EMPLOYMENT_TYPES)[number])) {
    return [current, ...EMPLOYMENT_TYPES];
  }
  return EMPLOYMENT_TYPES;
}

export function AdminExperiencePage() {
  const [items, setItems] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const { fieldErrors, formError, resetErrors, applyFieldErrors, applyCaughtError } =
    useFormErrors<ExperienceFields>();

  useEffect(() => {
    void apiGet<{ experiences: Experience[] }>("/experience", { cache: "no-store" })
      .then((payload) => {
        setItems(normalizeExperienceList(payload.experiences));
      })
      .catch((caught: unknown) => {
        applyCaughtError(caught, "Could not load experience");
      })
      .finally(() => setLoading(false));
  }, [applyCaughtError]);

  function patch(index: number, patchValue: Partial<Experience>) {
    setItems((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patchValue } : item)),
    );
    setDirty(true);
    setSaved(false);
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
    setDirty(true);
    setSaved(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = readyExperiences(items);
    resetErrors();
    setSaved(false);
    if (applyFieldErrors(collectErrors({ experiences: listError(next) }))) {
      return;
    }

    setPending(true);
    try {
      const payload = await apiPut<{ experiences: Experience[] }>("/experience", {
        experiences: next,
      });
      setItems(normalizeExperienceList(payload.experiences));
      setDirty(false);
      setSaved(true);
    } catch (caught) {
      applyCaughtError(caught, "Could not save experience");
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
          <h1 className="mt-2 font-display text-3xl text-ink">Experience</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-ink-soft">
            Roles visitors see on Home, the experience page, and the CV. Newest or current work
            should sit at the top.
          </p>
        </div>
        <a href="/experience" className="text-sm text-accent hover:text-accent-dark">
          View public page →
        </a>
      </div>

      <AuthError>{formError}</AuthError>
      {fieldErrors.experiences ? (
        <p className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-accent" role="alert">
          {fieldErrors.experiences}
        </p>
      ) : null}
      {saved ? (
        <p className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink" role="status">
          Experience published.
        </p>
      ) : null}

      <form className="space-y-6" onSubmit={handleSubmit} noValidate>
        {items.map((item, index) => (
          <SectionCard
            key={item.id ?? `role-${index}`}
            title={item.position.trim() || `Role ${index + 1}`}
            description={`${item.company.trim() || "Company"} · ${item.startDate || "dates"}`}
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
                  setDirty(true);
                  setSaved(false);
                }}
              >
                Remove
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Company"
                name={`company-${index}`}
                value={item.company}
                onChange={(event) => patch(index, { company: event.target.value })}
              />
              <FormField
                label="Position"
                name={`position-${index}`}
                value={item.position}
                onChange={(event) => patch(index, { position: event.target.value })}
              />
              <FormSelect
                label="Employment type"
                name={`type-${index}`}
                value={item.type}
                onChange={(event) => patch(index, { type: event.target.value })}
              >
                {employmentOptions(item.type).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </FormSelect>
              <FormField
                label="Location"
                name={`location-${index}`}
                value={item.location}
                onChange={(event) => patch(index, { location: event.target.value })}
              />
              <FormField
                label="Start date"
                name={`startDate-${index}`}
                value={item.startDate}
                hint="Year or month, such as 2024 or Jan 2024"
                onChange={(event) => patch(index, { startDate: event.target.value })}
              />
              <FormField
                label="End date"
                name={`endDate-${index}`}
                value={item.current ? "Present" : item.endDate}
                disabled={item.current}
                onChange={(event) => patch(index, { endDate: event.target.value })}
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={item.current}
                onChange={(event) =>
                  patch(index, {
                    current: event.target.checked,
                    endDate: event.target.checked ? "" : item.endDate,
                  })
                }
              />
              Currently working here
            </label>

            <FormTextArea
              label="Description"
              name={`description-${index}`}
              rows={3}
              maxLength={2000}
              value={item.description}
              onChange={(event) => patch(index, { description: event.target.value })}
            />
            <FormTextArea
              label="Responsibilities"
              name={`responsibilities-${index}`}
              rows={4}
              value={item.responsibilities.join("\n")}
              hint="One item per line"
              onChange={(event) => patch(index, { responsibilities: event.target.value.split("\n") })}
            />
            <FormTextArea
              label="Achievements"
              name={`achievements-${index}`}
              rows={3}
              value={item.achievements.join("\n")}
              hint="One item per line"
              onChange={(event) => patch(index, { achievements: event.target.value.split("\n") })}
            />
            <FormTextArea
              label="Technologies"
              name={`technologies-${index}`}
              rows={2}
              value={item.technologies.join("\n")}
              hint="One item per line"
              onChange={(event) => patch(index, { technologies: event.target.value.split("\n") })}
            />
            <FormField
              label="Company website"
              name={`website-${index}`}
              value={item.website ?? ""}
              placeholder="https://"
              onChange={(event) => patch(index, { website: event.target.value || null })}
            />
            <LogoPicker
              url={item.logoUrl ?? null}
              disabled={pending}
              onChange={(url) => patch(index, { logoUrl: url })}
            />
          </SectionCard>
        ))}

        <button
          className="cursor-pointer rounded-full border border-line bg-surface px-4 py-2 text-sm text-ink hover:border-accent"
          type="button"
          onClick={() => {
            setItems((current) => [...current, emptyExperience(current.length)]);
            setDirty(true);
            setSaved(false);
          }}
        >
          Add role
        </button>

        <div className="sticky bottom-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface/95 px-4 py-3 shadow-lg backdrop-blur">
          <p className="text-xs text-muted">{dirty ? "Unsaved changes" : "All changes saved"}</p>
          <button
            className="rounded-full bg-ink px-5 py-2.5 text-sm text-paper hover:bg-accent disabled:opacity-60"
            type="submit"
            disabled={pending}
          >
            {pending ? "Publishing…" : "Publish experience"}
          </button>
        </div>
      </form>
    </div>
  );
}
