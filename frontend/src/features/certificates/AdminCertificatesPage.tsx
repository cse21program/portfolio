import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { PublishingControls } from "@/components/content/PublishingControls";
import { FormField, FormTextArea } from "@/components/ui/FormField";
import { AuthError } from "@/features/auth/AuthForm";
import { isUsableHref } from "@/features/about/linkPlatforms";
import { DocumentPicker } from "@/features/education/DocumentPicker";
import { LogoPicker } from "@/features/experience/LogoPicker";
import { previewHref, contentStatusLabel } from "@/lib/publishing";
import { apiGet, apiPut } from "@/lib/api";
import { useFormErrors } from "@/lib/useFormErrors";
import { collectErrors } from "@/lib/validation";
import {
  emptyCertificate,
  normalizeCertificateList,
  slugFromTitle,
  type Certificate,
} from "@/types/certificates";

type CertificateFields = "certificates";

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

function readyCertificates(items: Certificate[]) {
  return items.map((item, index) => ({
    id: item.id,
    title: item.title.trim(),
    slug: (item.slug.trim() || slugFromTitle(item.title)).toLowerCase(),
    organization: item.organization.trim(),
    issueDate: item.issueDate?.trim() ?? "",
    expiryDate: item.expiryDate?.trim() ?? "",
    credentialId: item.credentialId?.trim() ?? "",
    skill: item.skill?.trim() ?? "",
    description: item.description.trim(),
    imageUrl: item.imageUrl?.trim() || null,
    documentUrl: item.documentUrl?.trim() || null,
    documentName: item.documentName?.trim() || null,
    verificationUrl: item.verificationUrl?.trim() || null,
    featured: item.featured,
    status: item.status?.trim() || "draft",
    publishedAt: item.publishedAt?.trim() ?? "",
    seoTitle: item.seoTitle?.trim() ?? "",
    seoDescription: item.seoDescription?.trim() ?? "",
    sortOrder: index,
  }));
}

function listError(items: ReturnType<typeof readyCertificates>) {
  const slugs = new Set<string>();
  for (const [index, item] of items.entries()) {
    const label = `Certificate ${index + 1}`;
    if (item.title.length < 2) {
      return `${label}: title must be at least 2 characters`;
    }
    if (item.slug.length < 2) {
      return `${label}: slug must be at least 2 characters`;
    }
    if (slugs.has(item.slug)) {
      return `${label}: each slug must be unique`;
    }
    slugs.add(item.slug);
    if (item.organization.length < 2) {
      return `${label}: organization must be at least 2 characters`;
    }
    if (item.verificationUrl && !isUsableHref(item.verificationUrl)) {
      return `${label}: verification URL must use https, mailto, or a site path`;
    }
  }
}

export function AdminCertificatesPage() {
  const [items, setItems] = useState<Certificate[]>([]);
  const [openIndex, setOpenIndex] = useState(-1);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const { fieldErrors, formError, resetErrors, applyFieldErrors, applyCaughtError } =
    useFormErrors<CertificateFields>();

  useEffect(() => {
    void apiGet<{ certificates: Certificate[] }>("/certificates", { cache: "no-store" })
      .then((payload) => {
        setItems(normalizeCertificateList(payload.certificates));
      })
      .catch((caught: unknown) => {
        applyCaughtError(caught, "Could not load certificates");
      })
      .finally(() => setLoading(false));
  }, [applyCaughtError]);

  function patch(index: number, patchValue: Partial<Certificate>) {
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
    const next = readyCertificates(items);
    resetErrors();
    setSaved(false);
    if (applyFieldErrors(collectErrors({ certificates: listError(next) }))) {
      return;
    }

    setPending(true);
    try {
      const payload = await apiPut<{ certificates: Certificate[] }>("/certificates", {
        certificates: next,
      });
      setItems(normalizeCertificateList(payload.certificates));
      setDirty(false);
      setSaved(true);
    } catch (caught) {
      applyCaughtError(caught, "Could not save certificates");
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
          <h1 className="mt-2 font-display text-3xl text-ink">Certificates</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-ink-soft">
            Credentials on the public certificates page, home, and CV. Publish, schedule, or archive
            each record before it goes live.
          </p>
        </div>
        <a href="/certificates" className="text-sm text-accent hover:text-accent-dark">
          View public page →
        </a>
      </div>

      <AuthError>{formError}</AuthError>
      {fieldErrors.certificates ? (
        <p className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-accent" role="alert">
          {fieldErrors.certificates}
        </p>
      ) : null}
      {saved ? (
        <p className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink" role="status">
          Certificates published.
        </p>
      ) : null}

      <form className="space-y-6" onSubmit={handleSubmit} noValidate>
        {items.map((item, index) => {
          const expanded = openIndex === index;
          return (
            <SectionCard
              key={item.id ?? `certificate-${index}`}
              title={item.title.trim() || `Certificate ${index + 1}`}
              description={item.slug ? `/certificates/${item.slug}` : "Slug used in /certificates/your-slug"}
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
                  {[
                    contentStatusLabel(item.status || "draft"),
                    item.organization.trim(),
                    item.skill.trim(),
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
                      hint="Used in /certificates/your-slug"
                      onChange={(event) => patch(index, { slug: event.target.value })}
                    />
                    <FormField
                      label="Organization"
                      name={`organization-${index}`}
                      value={item.organization}
                      onChange={(event) => patch(index, { organization: event.target.value })}
                    />
                    <FormField
                      label="Skill"
                      name={`skill-${index}`}
                      value={item.skill ?? ""}
                      onChange={(event) => patch(index, { skill: event.target.value })}
                    />
                    <FormField
                      label="Issue date"
                      name={`issueDate-${index}`}
                      value={item.issueDate ?? ""}
                      onChange={(event) => patch(index, { issueDate: event.target.value })}
                    />
                    <FormField
                      label="Expiry date"
                      name={`expiryDate-${index}`}
                      value={item.expiryDate ?? ""}
                      onChange={(event) => patch(index, { expiryDate: event.target.value })}
                    />
                    <FormField
                      label="Credential ID"
                      name={`credentialId-${index}`}
                      value={item.credentialId ?? ""}
                      onChange={(event) => patch(index, { credentialId: event.target.value })}
                    />
                    <FormField
                      label="Verification URL"
                      name={`verificationUrl-${index}`}
                      value={item.verificationUrl ?? ""}
                      placeholder="https://"
                      onChange={(event) => patch(index, { verificationUrl: event.target.value || null })}
                    />
                  </div>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-paper px-3 py-1.5 text-sm text-ink">
                    <input
                      type="checkbox"
                      className="accent-accent"
                      checked={item.featured}
                      onChange={(event) => patch(index, { featured: event.target.checked })}
                    />
                    Featured on Home
                  </label>
                  <PublishingControls
                    idPrefix={`certificate-${index}`}
                    status={item.status || "draft"}
                    publishedAt={item.publishedAt ?? ""}
                    previewHref={previewHref(`/certificates/${item.slug || "draft"}`)}
                    onChange={(next) => patch(index, next)}
                  />
                  <FormTextArea
                    label="Description"
                    name={`description-${index}`}
                    rows={3}
                    maxLength={2000}
                    value={item.description}
                    onChange={(event) => patch(index, { description: event.target.value })}
                  />
                  <LogoPicker
                    url={item.imageUrl ?? null}
                    disabled={pending}
                    label="Badge or certificate image"
                    hint="Optional. Square or landscape crop."
                    onChange={(url) => patch(index, { imageUrl: url })}
                  />
                  <DocumentPicker
                    url={item.documentUrl ?? null}
                    fileName={item.documentName ?? null}
                    disabled={pending}
                    label="Certificate PDF"
                    onChange={({ url, fileName }) =>
                      patch(index, { documentUrl: url, documentName: fileName })
                    }
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
            setItems((current) => [...current, emptyCertificate(current.length)]);
            setOpenIndex(items.length);
            setDirty(true);
            setSaved(false);
          }}
        >
          Add certificate
        </button>

        <div className="sticky bottom-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface/95 px-4 py-3 shadow-lg backdrop-blur">
          <p className="text-xs text-muted">{dirty ? "Unsaved changes" : "All changes saved"}</p>
          <button
            className="rounded-full bg-ink px-5 py-2.5 text-sm text-paper hover:bg-accent disabled:opacity-60"
            type="submit"
            disabled={pending}
          >
            {pending ? "Publishing…" : "Publish certificates"}
          </button>
        </div>
      </form>
    </div>
  );
}
