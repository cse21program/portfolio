import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { PublishingControls } from "@/components/content/PublishingControls";
import { FormField, FormSelect, FormTextArea } from "@/components/ui/FormField";
import { AuthError } from "@/features/auth/AuthForm";
import { LogoPicker } from "@/features/experience/LogoPicker";
import { previewHref } from "@/lib/publishing";
import { apiGet, apiPut } from "@/lib/api";
import { useFormErrors } from "@/lib/useFormErrors";
import { collectErrors } from "@/lib/validation";
import {
  emptyFaq,
  emptyPackage,
  emptyService,
  listFromLines,
  normalizeServiceList,
  slugFromTitle,
  servicePricingTypes,
  type Service,
} from "@/types/services";

type ServiceFields = "services";

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

function readyServices(items: Service[]) {
  return items.map((item, index) => ({
    id: item.id,
    title: item.title.trim(),
    slug: (item.slug.trim() || slugFromTitle(item.title)).toLowerCase(),
    shortDescription: item.shortDescription.trim(),
    description: item.description.trim(),
    thumbnailUrl: item.thumbnailUrl?.trim() || null,
    category: item.category?.trim() ?? "",
    startingPrice: item.startingPrice.trim(),
    pricingType: item.pricingType,
    deliveryTime: item.deliveryTime.trim(),
    features: (item.features ?? []).map((entry) => entry.trim()).filter(Boolean),
    requirements: (item.requirements ?? []).map((entry) => entry.trim()).filter(Boolean),
    technologies: (item.technologies ?? []).map((entry) => entry.trim()).filter(Boolean),
    faq: (item.faq ?? [])
      .map((entry) => ({ question: entry.question.trim(), answer: entry.answer.trim() }))
      .filter((entry) => entry.question && entry.answer),
    packages: (item.packages ?? [])
      .map((entry) => ({
        name: entry.name.trim(),
        price: entry.price.trim(),
        deliveryTime: entry.deliveryTime.trim(),
        features: (entry.features ?? []).map((feature) => feature.trim()).filter(Boolean),
      }))
      .filter((entry) => entry.name),
    available: item.available !== false,
    featured: item.featured,
    status: item.status?.trim() || "published",
    publishedAt: item.publishedAt?.trim() ?? "",
    seoTitle: item.seoTitle?.trim() ?? "",
    seoDescription: item.seoDescription?.trim() ?? "",
    canonicalUrl: item.canonicalUrl?.trim() ?? "",
    sortOrder: index,
  }));
}

function listError(items: ReturnType<typeof readyServices>) {
  const slugs = new Set<string>();
  for (const [index, item] of items.entries()) {
    const label = `Service ${index + 1}`;
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
    if (item.description.length < 20) {
      return `${label}: description must be at least 20 characters`;
    }
  }
}

export function AdminServicesPage() {
  const [items, setItems] = useState<Service[]>([]);
  const [openIndex, setOpenIndex] = useState(-1);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const { fieldErrors, formError, resetErrors, applyFieldErrors, applyCaughtError } =
    useFormErrors<ServiceFields>();

  useEffect(() => {
    void apiGet<{ services: Service[] }>("/services", { cache: "no-store" })
      .then((payload) => {
        setItems(normalizeServiceList(payload.services));
      })
      .catch((caught: unknown) => {
        applyCaughtError(caught, "Could not load services");
      })
      .finally(() => setLoading(false));
  }, [applyCaughtError]);

  function patch(index: number, patchValue: Partial<Service>) {
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
    const next = readyServices(items);
    resetErrors();
    setSaved(false);
    if (applyFieldErrors(collectErrors({ services: listError(next) }))) {
      return;
    }
    setPending(true);
    try {
      const payload = await apiPut<{ services: Service[] }>("/services", { services: next });
      setItems(normalizeServiceList(payload.services));
      setDirty(false);
      setSaved(true);
    } catch (caught) {
      applyCaughtError(caught, "Could not save services");
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
          <p className="text-xs tracking-[0.18em] text-accent uppercase">Studio</p>
          <h1 className="mt-2 font-display text-3xl text-ink">Services</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-ink-soft">
            Offerings on Home and /services. Drafts stay off the public catalog. Orders are managed
            separately.
          </p>
        </div>
        <a href="/services" className="text-sm text-accent hover:text-accent-dark">
          View public page →
        </a>
      </div>

      <AuthError>{formError}</AuthError>
      {fieldErrors.services ? (
        <p className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-accent" role="alert">
          {fieldErrors.services}
        </p>
      ) : null}
      {saved ? (
        <p className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink" role="status">
          Services published.
        </p>
      ) : null}

      <form className="space-y-6" onSubmit={handleSubmit} noValidate>
        {items.map((item, index) => {
          const expanded = openIndex === index;
          return (
          <SectionCard
            key={item.id ?? `service-${index}`}
            title={item.title.trim() || `Service ${index + 1}`}
            description={item.slug ? `/services/${item.slug}` : "Slug used in /services/your-slug"}
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
                {[item.status === "draft" ? "Draft" : "Published", item.pricingType, item.startingPrice, item.category]
                  .filter(Boolean)
                  .join(" · ")}
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
                  patch(index, { title, slug: item.slug ? item.slug : slugFromTitle(title) });
                }}
              />
              <FormField
                label="Slug"
                name={`slug-${index}`}
                value={item.slug}
                hint="Used in /services/your-slug"
                onChange={(event) => patch(index, { slug: event.target.value })}
              />
              <FormField
                label="Category"
                name={`category-${index}`}
                value={item.category ?? ""}
                onChange={(event) => patch(index, { category: event.target.value })}
              />
              <FormSelect
                label="Pricing type"
                name={`pricingType-${index}`}
                value={item.pricingType}
                onChange={(event) => patch(index, { pricingType: event.target.value })}
              >
                {servicePricingTypes.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </FormSelect>
              <FormField
                label="Starting price"
                name={`startingPrice-${index}`}
                value={item.startingPrice}
                onChange={(event) => patch(index, { startingPrice: event.target.value })}
              />
              <FormField
                label="Delivery time"
                name={`deliveryTime-${index}`}
                value={item.deliveryTime}
                onChange={(event) => patch(index, { deliveryTime: event.target.value })}
              />
              <FormSelect
                label="Availability"
                name={`available-${index}`}
                value={item.available === false ? "no" : "yes"}
                onChange={(event) => patch(index, { available: event.target.value === "yes" })}
              >
                <option value="yes">Taking requests</option>
                <option value="no">Not taking requests</option>
              </FormSelect>
              <FormSelect
                label="Featured"
                name={`featured-${index}`}
                value={item.featured ? "yes" : "no"}
                onChange={(event) => patch(index, { featured: event.target.value === "yes" })}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </FormSelect>
            </div>

            <PublishingControls
              idPrefix={`service-${index}`}
              status={item.status || "draft"}
              publishedAt={item.publishedAt ?? ""}
              previewHref={previewHref(`/services/${item.slug || "draft"}`)}
              onChange={(next) => patch(index, next)}
            />

            <LogoPicker
              label="Thumbnail"
              hint="Optional. Wide images work best on the catalog."
              url={item.thumbnailUrl ?? null}
              onChange={(url) => patch(index, { thumbnailUrl: url })}
            />

            <FormField
              label="Short description"
              name={`short-${index}`}
              value={item.shortDescription}
              onChange={(event) => patch(index, { shortDescription: event.target.value })}
            />
            <FormTextArea
              label="Detailed description"
              name={`description-${index}`}
              rows={5}
              value={item.description}
              onChange={(event) => patch(index, { description: event.target.value })}
            />
            <FormTextArea
              label="Features"
              name={`features-${index}`}
              rows={4}
              hint="One per line"
              value={(item.features ?? []).join("\n")}
              onChange={(event) => patch(index, { features: listFromLines(event.target.value) })}
            />
            <FormTextArea
              label="Requirements"
              name={`requirements-${index}`}
              rows={3}
              hint="One per line"
              value={(item.requirements ?? []).join("\n")}
              onChange={(event) => patch(index, { requirements: listFromLines(event.target.value) })}
            />
            <FormField
              label="Technologies"
              name={`tech-${index}`}
              hint="Comma separated"
              value={(item.technologies ?? []).join(", ")}
              onChange={(event) =>
                patch(index, {
                  technologies: event.target.value
                    .split(",")
                    .map((entry) => entry.trim())
                    .filter(Boolean),
                })
              }
            />

            <div className="space-y-3">
              <p className="text-sm font-medium text-ink">Packages</p>
              {(item.packages ?? []).map((entry, packageIndex) => (
                <div key={`${item.id}-pkg-${packageIndex}`} className="grid gap-3 rounded-2xl border border-line p-4 sm:grid-cols-2">
                  <FormField
                    label="Name"
                    name={`pkg-name-${index}-${packageIndex}`}
                    value={entry.name}
                    onChange={(event) => {
                      const packages = [...(item.packages ?? [])];
                      packages[packageIndex] = { ...entry, name: event.target.value };
                      patch(index, { packages });
                    }}
                  />
                  <FormField
                    label="Price"
                    name={`pkg-price-${index}-${packageIndex}`}
                    value={entry.price}
                    onChange={(event) => {
                      const packages = [...(item.packages ?? [])];
                      packages[packageIndex] = { ...entry, price: event.target.value };
                      patch(index, { packages });
                    }}
                  />
                  <FormField
                    label="Delivery"
                    name={`pkg-time-${index}-${packageIndex}`}
                    value={entry.deliveryTime}
                    onChange={(event) => {
                      const packages = [...(item.packages ?? [])];
                      packages[packageIndex] = { ...entry, deliveryTime: event.target.value };
                      patch(index, { packages });
                    }}
                  />
                  <FormTextArea
                    label="Included"
                    name={`pkg-features-${index}-${packageIndex}`}
                    rows={3}
                    hint="One per line"
                    value={entry.features.join("\n")}
                    onChange={(event) => {
                      const packages = [...(item.packages ?? [])];
                      packages[packageIndex] = { ...entry, features: listFromLines(event.target.value) };
                      patch(index, { packages });
                    }}
                  />
                  <button
                    type="button"
                    className="text-sm text-muted hover:text-ink"
                    onClick={() =>
                      patch(index, { packages: (item.packages ?? []).filter((_, i) => i !== packageIndex) })
                    }
                  >
                    Remove package
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="text-sm font-medium text-accent hover:text-accent-dark"
                onClick={() => patch(index, { packages: [...(item.packages ?? []), emptyPackage()] })}
              >
                Add package
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-ink">FAQ</p>
              {(item.faq ?? []).map((entry, faqIndex) => (
                <div key={`${item.id}-faq-${faqIndex}`} className="space-y-3 rounded-2xl border border-line p-4">
                  <FormField
                    label="Question"
                    name={`faq-q-${index}-${faqIndex}`}
                    value={entry.question}
                    onChange={(event) => {
                      const faq = [...(item.faq ?? [])];
                      faq[faqIndex] = { ...entry, question: event.target.value };
                      patch(index, { faq });
                    }}
                  />
                  <FormTextArea
                    label="Answer"
                    name={`faq-a-${index}-${faqIndex}`}
                    rows={3}
                    value={entry.answer}
                    onChange={(event) => {
                      const faq = [...(item.faq ?? [])];
                      faq[faqIndex] = { ...entry, answer: event.target.value };
                      patch(index, { faq });
                    }}
                  />
                  <button
                    type="button"
                    className="text-sm text-muted hover:text-ink"
                    onClick={() => patch(index, { faq: (item.faq ?? []).filter((_, i) => i !== faqIndex) })}
                  >
                    Remove question
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="text-sm font-medium text-accent hover:text-accent-dark"
                onClick={() => patch(index, { faq: [...(item.faq ?? []), emptyFaq()] })}
              >
                Add question
              </button>
            </div>
              </>
            ) : null}
          </SectionCard>
          );
        })}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-medium text-ink hover:border-accent/40"
            onClick={() => {
              setItems((current) => [...current, emptyService(current.length)]);
              setOpenIndex(items.length);
              setDirty(true);
              setSaved(false);
            }}
          >
            Add service
          </button>
          <button
            type="submit"
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper hover:bg-accent disabled:opacity-60"
            disabled={pending || !dirty}
          >
            {pending ? "Saving…" : "Save services"}
          </button>
        </div>
      </form>
    </div>
  );
}
