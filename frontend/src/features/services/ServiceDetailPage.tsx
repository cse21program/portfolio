import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { PreviewBanner } from "@/components/content/PreviewBanner";
import { Container } from "@/components/ui/Container";
import { NotFoundState } from "@/components/ui/NotFoundState";
import { FormField, FormTextArea } from "@/components/ui/FormField";
import { AuthError } from "@/features/auth/AuthForm";
import { useAuth } from "@/features/auth/AuthContext";
import { ContentCard } from "@/components/ui/ContentCard";
import { Chip } from "@/features/tutorials/tutorialUi";
import { useServiceDetail } from "@/features/services/useServices";
import { useServiceOrders } from "@/features/services/useServiceOrders";
import { AddToCartButton } from "@/features/cart/AddToCartButton";
import { ProductReviews } from "@/features/reviews/ProductReviews";
import { parsePriceCents } from "@/lib/money";
import { useFormErrors } from "@/lib/useFormErrors";
import { collectErrors, validateMessage } from "@/lib/validation";
import type { Service, ServicePackage } from "@/types/services";
import { isLiveContent } from "@/lib/publishing";

function primaryButtonClass(filled = true) {
  return filled
    ? "inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
    : "inline-flex min-h-11 items-center justify-center rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-medium text-ink transition hover:border-accent/40";
}

function PackageCard({
  item,
  selected,
  onSelect,
}: {
  item: ServicePackage;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`h-full rounded-[1.5rem] border p-5 text-left transition ${
        selected ? "border-accent bg-accent/5" : "border-line bg-surface hover:border-accent/40"
      }`}
    >
      <p className="text-xs tracking-[0.16em] text-accent uppercase">{item.name}</p>
      <p className="mt-2 font-display text-2xl text-ink">{item.price || "Quote"}</p>
      {item.deliveryTime ? <p className="mt-1 text-sm text-muted">{item.deliveryTime}</p> : null}
      {item.features.length > 0 ? (
        <ul className="mt-4 space-y-2 text-sm leading-6 text-ink-soft">
          {item.features.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
      ) : null}
    </button>
  );
}

function RequestForm({ service }: { service: Service }) {
  const { user } = useAuth();
  const { orders, requestService } = useServiceOrders(Boolean(user));
  const packages = service.packages ?? [];
  const [packageName, setPackageName] = useState(packages[0]?.name ?? "");
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const { fieldErrors, formError, resetErrors, applyFieldErrors, applyCaughtError, clearField, setFieldError } =
    useFormErrors<"requirements">();

  const open = orders.find(
    (item) =>
      item.serviceSlug === service.slug &&
      item.status !== "cancelled" &&
      item.status !== "completed",
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const requirements = String(form.get("requirements") ?? "");
    resetErrors();
    setSent(false);
    if (applyFieldErrors(collectErrors({ requirements: validateMessage(requirements) }))) {
      return;
    }
    setPending(true);
    try {
      await requestService({
        serviceSlug: service.slug,
        packageName,
        requirements,
        budget: String(form.get("budget") ?? ""),
        timeline: String(form.get("timeline") ?? ""),
      });
      setSent(true);
    } catch (caught) {
      applyCaughtError(caught, "Could not send this request");
    } finally {
      setPending(false);
    }
  }

  if (!service.available) {
    return (
      <p className="rounded-2xl border border-line bg-paper/70 p-5 text-sm leading-7 text-ink-soft">
        This offering is not taking new requests. Use contact if you need a custom timeline.
      </p>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-wrap gap-3">
        <Link to="/login" state={{ from: `/services/${service.slug}` }} className={primaryButtonClass()}>
          Sign in to request
        </Link>
        <Link
          to={`/contact?subject=${encodeURIComponent(`Service: ${service.title}`)}&service=${service.slug}`}
          className={primaryButtonClass(false)}
        >
          Contact instead
        </Link>
      </div>
    );
  }

  if (open || sent) {
    return (
      <div className="space-y-3 rounded-2xl border border-line bg-paper/70 p-5">
        <p className="text-sm leading-7 text-ink-soft">
          {sent ? "Request sent. " : null}
          Track it on your orders page. I will confirm the first slice from Studio.
        </p>
        <Link to="/dashboard/orders" className={primaryButtonClass()}>
          View orders
        </Link>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <AuthError>{formError}</AuthError>
      {packages.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {packages.map((item) => (
            <PackageCard
              key={item.name}
              item={item}
              selected={packageName === item.name}
              onSelect={() => setPackageName(item.name)}
            />
          ))}
        </div>
      ) : null}
      <FormTextArea
        label="Requirements"
        name="requirements"
        rows={5}
        hint="What should be true when this is done? At least 20 characters."
        error={fieldErrors.requirements}
        onChange={() => clearField("requirements")}
        onBlur={(event) => setFieldError("requirements", validateMessage(event.target.value))}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Budget" name="budget" hint="Optional" />
        <FormField label="Timeline" name="timeline" hint="Optional" />
      </div>
      <button type="submit" className={primaryButtonClass()} disabled={pending}>
        {pending ? "Sending…" : "Request this service"}
      </button>
      {packages.some((item) => parsePriceCents(item.price)) ? (
        <p className="text-sm text-muted">Or add a priced package to your cart.</p>
      ) : parsePriceCents(service.startingPrice) &&
        !/hourly|custom quote/i.test(service.pricingType) &&
        packages.length === 0 ? (
        <AddToCartButton kind="service" slug={service.slug} label="Add to cart" primary={false} />
      ) : null}
    </form>
  );
}

export function ServiceDetailPage() {
  const { slug = "" } = useParams();
  const { service, related, loading, notFound } = useServiceDetail(slug);

  if (loading && !service) {
    return (
      <Container className="py-16">
        <div className="h-80 animate-pulse rounded-[1.75rem] bg-paper-muted" />
      </Container>
    );
  }

  if (notFound || !service) {
    return <NotFoundState title="Service not found" />;
  }

  return (
    <Container className="space-y-12 py-14 sm:py-16">
      {!isLiveContent(service) ? <PreviewBanner status={service.status} /> : null}
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)]">
        <div className="max-w-3xl">
          <p className="text-xs tracking-[0.18em] text-accent uppercase">
            {service.pricingType}
            {service.category ? ` · ${service.category}` : ""}
          </p>
          <h1 className="mt-3 font-display text-4xl tracking-tight text-ink sm:text-5xl">{service.title}</h1>
          <p className="mt-4 text-lg leading-8 text-ink-soft">{service.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Chip accent>{service.available === false ? "Unavailable" : "Available"}</Chip>
            {service.featured ? <Chip>Featured</Chip> : null}
            {service.technologies.map((tech) => (
              <Chip key={tech}>{tech}</Chip>
            ))}
          </div>
          <p className="mt-5 text-sm text-ink">
            <span className="font-medium">{service.startingPrice}</span>
            {service.deliveryTime ? <span className="text-muted"> · {service.deliveryTime}</span> : null}
          </p>
        </div>
        {service.thumbnailUrl ? (
          <img
            src={service.thumbnailUrl}
            alt=""
            className="aspect-[16/10] w-full rounded-[1.5rem] border border-line object-cover"
          />
        ) : null}
      </div>

      {service.features.length > 0 ? (
        <section>
          <h2 className="font-display text-3xl text-ink">Included</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-ink-soft">
            {service.features.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {service.packages && service.packages.length > 0 ? (
        <section>
          <h2 className="font-display text-3xl text-ink">Packages</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {service.packages.map((item) => (
              <article key={item.name} className="rounded-[1.5rem] border border-line bg-surface p-5">
                <p className="text-xs tracking-[0.16em] text-accent uppercase">{item.name}</p>
                <p className="mt-2 font-display text-2xl text-ink">{item.price || "Quote"}</p>
                {item.deliveryTime ? <p className="mt-1 text-sm text-muted">{item.deliveryTime}</p> : null}
                {item.features.length > 0 ? (
                  <ul className="mt-4 space-y-2 text-sm leading-6 text-ink-soft">
                    {item.features.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                ) : null}
                {parsePriceCents(item.price) ? (
                  <div className="mt-5">
                    <AddToCartButton
                      kind="service"
                      slug={service.slug}
                      packageName={item.name}
                      label={`Add ${item.name}`}
                      primary={false}
                    />
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {service.requirements && service.requirements.length > 0 ? (
        <section>
          <h2 className="font-display text-3xl text-ink">What I need from you</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-ink-soft">
            {service.requirements.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-[1.75rem] border border-line bg-surface p-6 sm:p-8">
        <h2 className="font-display text-3xl text-ink">Request this service</h2>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-ink-soft">
          No checkout yet. A signed-in request becomes an order I can confirm, start, and close from
          Studio.
        </p>
        <div className="mt-6">
          <RequestForm service={service} />
        </div>
      </section>

      <ProductReviews kind="service" slug={service.slug} />

      {service.faq.length > 0 ? (
        <section>
          <h2 className="font-display text-3xl text-ink">FAQ</h2>
          <div className="mt-6 space-y-6">
            {service.faq.map((item) => (
              <article key={item.question}>
                <h3 className="font-medium text-ink">{item.question}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-soft">{item.answer}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {related.length > 0 ? (
        <section>
          <h2 className="font-display text-3xl text-ink">Related</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {related.map((item) => (
              <ContentCard
                key={item.slug}
                to={`/services/${item.slug}`}
                eyebrow={item.pricingType}
                title={item.title}
                description={item.shortDescription}
                meta={`${item.startingPrice} · ${item.deliveryTime}`}
              />
            ))}
          </div>
        </section>
      ) : null}
    </Container>
  );
}
