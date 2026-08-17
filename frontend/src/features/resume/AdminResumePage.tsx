import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { FormField, FormTextArea } from "@/components/ui/FormField";
import { AuthError } from "@/features/auth/AuthForm";
import { isUsableHref } from "@/features/about/linkPlatforms";
import { CreditsEditor } from "@/features/resume/CreditsEditor";
import { PdfPicker } from "@/features/resume/PdfPicker";
import { isBlankResume, suggestedResumeDraft } from "@/features/resume/suggested";
import { ApiRequestError, apiGet, apiPut } from "@/lib/api";
import { useFormErrors } from "@/lib/useFormErrors";
import { collectErrors } from "@/lib/validation";
import { fallbackResume, normalizeResume, type ResumeCredit, type ResumeDocument } from "@/types/resume";

type ResumeFields = "headline" | "summary" | "awards" | "publications" | "pdfUrl" | "pdfFileName";

type Draft = {
  headline: string;
  summary: string;
  awards: ResumeCredit[];
  publications: ResumeCredit[];
  pdfUrl: string | null;
  pdfFileName: string | null;
};

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

function readyCredits(items: ResumeCredit[]) {
  return items
    .map((item) => ({
      title: item.title.trim(),
      detail: item.detail.trim(),
      year: item.year.trim(),
      href: item.href?.trim() || null,
    }))
    .filter((item) => item.title.length > 0);
}

function creditListError(items: ResumeCredit[], label: string) {
  for (const item of items) {
    if (item.title.length === 1) {
      return `${label} titles need at least 2 characters`;
    }
    if (item.href && !isUsableHref(item.href)) {
      return `${label} links must use https, mailto, or a site path`;
    }
  }
}

const emptyDraft: Draft = {
  headline: "",
  summary: "",
  awards: [],
  publications: [],
  pdfUrl: null,
  pdfFileName: null,
};

export function AdminResumePage() {
  const [resume, setResume] = useState<ResumeDocument>(fallbackResume);
  const [headline, setHeadline] = useState("");
  const [summary, setSummary] = useState("");
  const [awards, setAwards] = useState<ResumeCredit[]>([]);
  const [publications, setPublications] = useState<ResumeCredit[]>([]);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [suggested, setSuggested] = useState(false);
  const versionRef = useRef(0);
  const draftRef = useRef<Draft>(emptyDraft);
  const persistQueue = useRef(Promise.resolve());
  const { fieldErrors, formError, resetErrors, applyFieldErrors, applyCaughtError } =
    useFormErrors<ResumeFields>();

  function syncDraft(next: Draft) {
    draftRef.current = next;
    setHeadline(next.headline);
    setSummary(next.summary);
    setAwards(next.awards);
    setPublications(next.publications);
    setPdfUrl(next.pdfUrl);
    setPdfFileName(next.pdfFileName);
  }

  function patchDraft(patch: Partial<Draft>) {
    const next = { ...draftRef.current, ...patch };
    draftRef.current = next;
    if (patch.headline !== undefined) setHeadline(patch.headline);
    if (patch.summary !== undefined) setSummary(patch.summary);
    if (patch.awards !== undefined) setAwards(patch.awards);
    if (patch.publications !== undefined) setPublications(patch.publications);
    if (patch.pdfUrl !== undefined) setPdfUrl(patch.pdfUrl);
    if (patch.pdfFileName !== undefined) setPdfFileName(patch.pdfFileName);
    setDirty(true);
  }

  function applyResume(raw: ResumeDocument) {
    const next = normalizeResume(raw);
    versionRef.current = next.version;
    setResume(next);

    if (isBlankResume(next)) {
      syncDraft({
        headline: suggestedResumeDraft.headline,
        summary: suggestedResumeDraft.summary,
        awards: suggestedResumeDraft.awards,
        publications: suggestedResumeDraft.publications,
        pdfUrl: next.pdfUrl,
        pdfFileName: next.pdfFileName,
      });
      setSuggested(true);
      setDirty(true);
      return;
    }

    syncDraft({
      headline: next.headline ?? "",
      summary: next.summary ?? "",
      awards: next.awards,
      publications: next.publications,
      pdfUrl: next.pdfUrl,
      pdfFileName: next.pdfFileName,
    });
    setSuggested(false);
  }

  useEffect(() => {
    void apiGet<{ resume: ResumeDocument }>("/portfolio/resume", { cache: "no-store" })
      .then((payload) => {
        applyResume(payload.resume);
      })
      .catch((caught: unknown) => {
        applyCaughtError(caught, "Could not load the resume");
      })
      .finally(() => setLoading(false));
  }, [applyCaughtError]);

  function validate(next: { headline: string; summary: string; awards: ResumeCredit[]; publications: ResumeCredit[] }) {
    return collectErrors<ResumeFields>({
      headline: next.headline.length > 120 ? "Headline must be 120 characters or fewer" : undefined,
      summary: next.summary.length > 1200 ? "Summary must be 1200 characters or fewer" : undefined,
      awards: creditListError(next.awards, "Award"),
      publications: creditListError(next.publications, "Publication"),
    });
  }

  async function persist(asPublish: boolean) {
    const draft = draftRef.current;
    const nextAwards = readyCredits(draft.awards);
    const nextPublications = readyCredits(draft.publications);

    if (asPublish) {
      resetErrors();
      setSaved(false);
      if (
        applyFieldErrors(
          validate({
            headline: draft.headline.trim(),
            summary: draft.summary.trim(),
            awards: nextAwards,
            publications: nextPublications,
          }),
        )
      ) {
        return;
      }
    }

    setPending(true);
    persistQueue.current = persistQueue.current.then(async () => {
      const draft = draftRef.current;
      const nextAwards = readyCredits(draft.awards);
      const nextPublications = readyCredits(draft.publications);
      try {
        const payload = await apiPut<{ resume: ResumeDocument }>(
          "/portfolio/resume",
          {
            headline: draft.headline.trim() || null,
            summary: draft.summary.trim() || null,
            awards: nextAwards,
            publications: nextPublications,
            pdfUrl: draft.pdfUrl,
            pdfFileName: draft.pdfFileName,
          },
          { headers: { "If-Match": `"${versionRef.current}"` } },
        );
        applyResume(payload.resume);
        setDirty(false);
        if (asPublish) {
          setSaved(true);
          setSuggested(false);
        }
      } catch (caught) {
        if (caught instanceof ApiRequestError && caught.status === 412) {
          applyCaughtError(caught, "This page was updated elsewhere. Reload and try again.");
        } else {
          applyCaughtError(caught, asPublish ? "Could not save the resume" : "Could not save the PDF");
        }
      } finally {
        setPending(false);
      }
    });
    await persistQueue.current;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await persist(true);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 animate-pulse rounded-full bg-paper-muted" />
        <div className="h-48 animate-pulse rounded-3xl bg-paper-muted" />
      </div>
    );
  }

  const updatedLabel =
    resume.version > 0
      ? `Version ${resume.version} · ${new Date(resume.updatedAt).toLocaleString()}`
      : "Not loaded from the API";

  return (
    <div className="space-y-8 pb-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.18em] text-accent uppercase">Portfolio</p>
          <h1 className="mt-2 font-display text-3xl text-ink">Resume</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-ink-soft">
            Headline, summary, awards, publications, and an optional PDF. The PDF is saved as soon
            as it uploads. Work experience is edited on its own page. Education stays on the public
            page until that module has an editor.
          </p>
          <p className="mt-2 text-xs text-muted">{updatedLabel}</p>
        </div>
        <Link to="/resume" className="text-sm text-accent hover:text-accent-dark">
          View public page →
        </Link>
      </div>

      <AuthError>{formError}</AuthError>
      {suggested ? (
        <p className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink" role="status">
          Starter CV content is filled from the site. Review it, then publish.
        </p>
      ) : null}
      {saved ? (
        <p className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink" role="status">
          Resume published.
        </p>
      ) : null}

      <SectionCard title="File" description="Saved immediately. Visitors download this from the CV page.">
        <PdfPicker
          url={pdfUrl}
          fileName={pdfFileName}
          error={fieldErrors.pdfUrl}
          disabled={pending}
          onChange={(next) => {
            patchDraft({ pdfUrl: next.url, pdfFileName: next.fileName });
            void persist(false);
          }}
        />
      </SectionCard>

      <form className="space-y-6" onSubmit={handleSubmit} onInput={() => setDirty(true)} noValidate>
        <SectionCard
          title="Opening"
          description="Leave blank to reuse the About title and short biography."
        >
          <FormField
            label="Headline"
            name="headline"
            value={headline}
            hint="Optional. Overrides the professional title on the CV."
            error={fieldErrors.headline}
            onChange={(event) => patchDraft({ headline: event.target.value })}
          />
          <FormTextArea
            label="Summary"
            name="summary"
            rows={4}
            maxLength={1200}
            value={summary}
            hint="Optional. Overrides the short biography on the CV."
            error={fieldErrors.summary}
            onChange={(event) => patchDraft({ summary: event.target.value })}
          />
        </SectionCard>

        <SectionCard title="Awards" description="Optional. Shown on the public CV when a title is set.">
          <CreditsEditor
            label="Awards"
            hint="Title is required. Year, detail, and link are optional."
            items={awards}
            onChange={(items) => patchDraft({ awards: items })}
          />
          {fieldErrors.awards ? (
            <p className="text-sm text-accent" role="alert">
              {fieldErrors.awards}
            </p>
          ) : null}
        </SectionCard>

        <SectionCard
          title="Publications"
          description="Papers, articles, or talks. Same shape as awards."
        >
          <CreditsEditor
            label="Publications"
            hint="Title is required. Year, detail, and link are optional."
            items={publications}
            onChange={(items) => patchDraft({ publications: items })}
          />
          {fieldErrors.publications ? (
            <p className="text-sm text-accent" role="alert">
              {fieldErrors.publications}
            </p>
          ) : null}
        </SectionCard>

        <div className="sticky bottom-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface/95 px-4 py-3 shadow-lg backdrop-blur">
          <p className="text-xs text-muted">{dirty ? "Unsaved changes" : "All changes saved"}</p>
          <button
            className="rounded-full bg-ink px-5 py-2.5 text-sm text-paper hover:bg-accent disabled:opacity-60"
            type="submit"
            disabled={pending}
          >
            {pending ? "Publishing…" : "Publish resume"}
          </button>
        </div>
      </form>
    </div>
  );
}
