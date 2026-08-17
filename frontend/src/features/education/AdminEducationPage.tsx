import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { FormField, FormTextArea } from "@/components/ui/FormField";
import { AuthError } from "@/features/auth/AuthForm";
import { isUsableHref } from "@/features/about/linkPlatforms";
import { DocumentPicker } from "@/features/education/DocumentPicker";
import { LogoPicker } from "@/features/experience/LogoPicker";
import { apiGet, apiPut } from "@/lib/api";
import { useFormErrors } from "@/lib/useFormErrors";
import { collectErrors } from "@/lib/validation";
import {
  emptyEducation,
  normalizeEducationList,
  type Education,
} from "@/types/education";

type EducationFields = "education";

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

function readyEducation(items: Education[]) {
  return items.map((item, index) => ({
    id: item.id,
    institution: item.institution.trim(),
    degree: item.degree.trim(),
    field: item.field.trim(),
    startDate: item.startDate.trim(),
    endDate: item.current ? "" : item.endDate.trim(),
    current: item.current,
    grade: item.grade.trim(),
    location: item.location.trim(),
    description: item.description.trim(),
    achievements: item.achievements.map((entry) => entry.trim()).filter(Boolean),
    logoUrl: item.logoUrl?.trim() || null,
    documentUrl: item.documentUrl?.trim() || null,
    documentName: item.documentName?.trim() || null,
    website: item.website?.trim() || null,
    sortOrder: index,
  }));
}

function listError(items: Education[]) {
  for (const [index, item] of items.entries()) {
    const label = `Record ${index + 1}`;
    if (item.institution.trim().length < 2) {
      return `${label}: institution must be at least 2 characters`;
    }
    if (!item.degree.trim()) {
      return `${label}: degree is required`;
    }
    if (item.field.trim().length < 2) {
      return `${label}: field of study must be at least 2 characters`;
    }
    if (!item.startDate.trim()) {
      return `${label}: start date is required`;
    }
    if (item.website && !isUsableHref(item.website)) {
      return `${label}: website must use https, mailto, or a site path`;
    }
  }
}

export function AdminEducationPage() {
  const [items, setItems] = useState<Education[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const { fieldErrors, formError, resetErrors, applyFieldErrors, applyCaughtError } =
    useFormErrors<EducationFields>();

  useEffect(() => {
    void apiGet<{ education: Education[] }>("/education", { cache: "no-store" })
      .then((payload) => {
        setItems(normalizeEducationList(payload.education));
      })
      .catch((caught: unknown) => {
        applyCaughtError(caught, "Could not load education");
      })
      .finally(() => setLoading(false));
  }, [applyCaughtError]);

  function patch(index: number, patchValue: Partial<Education>) {
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
    const next = readyEducation(items);
    resetErrors();
    setSaved(false);
    if (applyFieldErrors(collectErrors({ education: listError(next) }))) {
      return;
    }

    setPending(true);
    try {
      const payload = await apiPut<{ education: Education[] }>("/education", {
        education: next,
      });
      setItems(normalizeEducationList(payload.education));
      setDirty(false);
      setSaved(true);
    } catch (caught) {
      applyCaughtError(caught, "Could not save education");
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
          <h1 className="mt-2 font-display text-3xl text-ink">Education</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-ink-soft">
            Degrees and institutions visitors see on the education page and the CV. Current study
            should sit at the top.
          </p>
        </div>
        <a href="/education" className="text-sm text-accent hover:text-accent-dark">
          View public page →
        </a>
      </div>

      <AuthError>{formError}</AuthError>
      {fieldErrors.education ? (
        <p className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-accent" role="alert">
          {fieldErrors.education}
        </p>
      ) : null}
      {saved ? (
        <p className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink" role="status">
          Education published.
        </p>
      ) : null}

      <form className="space-y-6" onSubmit={handleSubmit} noValidate>
        {items.map((item, index) => (
          <SectionCard
            key={item.id ?? `school-${index}`}
            title={
              [item.degree.trim(), item.field.trim()].filter(Boolean).join(" ") || `Record ${index + 1}`
            }
            description={`${item.institution.trim() || "Institution"} · ${item.startDate || "dates"}`}
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
                label="Institution"
                name={`institution-${index}`}
                value={item.institution}
                onChange={(event) => patch(index, { institution: event.target.value })}
              />
              <FormField
                label="Degree"
                name={`degree-${index}`}
                value={item.degree}
                onChange={(event) => patch(index, { degree: event.target.value })}
              />
              <FormField
                label="Field of study"
                name={`field-${index}`}
                value={item.field}
                onChange={(event) => patch(index, { field: event.target.value })}
              />
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
                hint="Year or month, such as 2021 or Jan 2021"
                onChange={(event) => patch(index, { startDate: event.target.value })}
              />
              <FormField
                label="End date"
                name={`endDate-${index}`}
                value={item.current ? "Present" : item.endDate}
                disabled={item.current}
                onChange={(event) => patch(index, { endDate: event.target.value })}
              />
              <FormField
                label="Grade / CGPA"
                name={`grade-${index}`}
                value={item.grade}
                onChange={(event) => patch(index, { grade: event.target.value })}
              />
              <FormField
                label="Institution website"
                name={`website-${index}`}
                value={item.website ?? ""}
                placeholder="https://"
                onChange={(event) => patch(index, { website: event.target.value || null })}
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
              Currently studying here
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
              label="Achievements"
              name={`achievements-${index}`}
              rows={3}
              value={item.achievements.join("\n")}
              hint="One item per line"
              onChange={(event) => patch(index, { achievements: event.target.value.split("\n") })}
            />
            <LogoPicker
              url={item.logoUrl ?? null}
              disabled={pending}
              label="Institution logo"
              hint="Optional. Square works best."
              onChange={(url) => patch(index, { logoUrl: url })}
            />
            <DocumentPicker
              url={item.documentUrl ?? null}
              fileName={item.documentName ?? null}
              disabled={pending}
              onChange={({ url, fileName }) =>
                patch(index, { documentUrl: url, documentName: fileName })
              }
            />
          </SectionCard>
        ))}

        <button
          className="cursor-pointer rounded-full border border-line bg-surface px-4 py-2 text-sm text-ink hover:border-accent"
          type="button"
          onClick={() => {
            setItems((current) => [...current, emptyEducation(current.length)]);
            setDirty(true);
            setSaved(false);
          }}
        >
          Add education
        </button>

        <div className="sticky bottom-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface/95 px-4 py-3 shadow-lg backdrop-blur">
          <p className="text-xs text-muted">{dirty ? "Unsaved changes" : "All changes saved"}</p>
          <button
            className="rounded-full bg-ink px-5 py-2.5 text-sm text-paper hover:bg-accent disabled:opacity-60"
            type="submit"
            disabled={pending}
          >
            {pending ? "Publishing…" : "Publish education"}
          </button>
        </div>
      </form>
    </div>
  );
}
