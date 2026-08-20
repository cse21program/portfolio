import { useEffect, useState } from "react";
import { FormField, FormSelect, FormTextArea } from "@/components/ui/FormField";
import { AuthError } from "@/features/auth/AuthForm";
import { apiGet, apiPatch } from "@/lib/api";
import type { AdminPaymentProvider } from "@/types/payment";

function statusLabel(provider: AdminPaymentProvider) {
  if (!provider.enabled) {
    return "Off";
  }
  if (provider.liveReady) {
    return "Live";
  }
  return "Demo";
}

function isManual(provider: AdminPaymentProvider) {
  return provider.kind === "manual" || provider.id === "bank";
}

function fieldValues(provider: AdminPaymentProvider) {
  return Object.fromEntries(
    provider.fields
      .filter((field) => field.type !== "password")
      .map((field) => [
        field.key,
        field.value || (field.type === "select" ? field.options?.[0]?.value || "sandbox" : ""),
      ]),
  );
}

function summaryLine(provider: AdminPaymentProvider) {
  const visibility = provider.enabled ? "Shown at checkout" : "Hidden from checkout";
  const ready = provider.fields.filter((field) => field.required).every((field) => field.configured);
  const details = isManual(provider)
    ? ready
      ? "Account details saved"
      : "Account details needed for live"
    : ready
      ? "Keys saved"
      : "Keys needed for live";
  return `${visibility} · ${statusLabel(provider)} · ${details}`;
}

function ProviderCard({
  provider,
  expanded,
  onToggle,
  onSaved,
}: {
  provider: AdminPaymentProvider;
  expanded: boolean;
  onToggle: () => void;
  onSaved: (next: AdminPaymentProvider) => void;
}) {
  const [enabled, setEnabled] = useState(provider.enabled);
  const [mode, setMode] = useState(provider.mode);
  const [credentials, setCredentials] = useState<Record<string, string>>(() => fieldValues(provider));
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const manual = isManual(provider);

  useEffect(() => {
    setEnabled(provider.enabled);
    setMode(provider.mode);
    setCredentials(fieldValues(provider));
  }, [provider]);

  async function save() {
    setPending(true);
    setError("");
    setNotice("");
    try {
      const payload = await apiPatch<{ provider: AdminPaymentProvider }>(
        `/payments/admin/providers/${provider.id}`,
        { enabled, mode, credentials },
      );
      onSaved(payload.provider);
      setCredentials(fieldValues(payload.provider));
      setNotice(
        manual
          ? "Saved. Checkout will show these account details on the next bank payment."
          : "Saved. Checkout will use this gateway on the next payment.",
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save this gateway");
    } finally {
      setPending(false);
    }
  }

  async function copyWebhook() {
    try {
      await navigator.clipboard.writeText(provider.webhookUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy the webhook URL");
    }
  }

  return (
    <section className="space-y-5 rounded-3xl border border-line bg-surface p-6 shadow-[0_1px_0_rgb(26_22_18/0.04)] sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-ink">{provider.name}</h2>
          <p className="mt-1 text-sm text-muted">
            {manual
              ? "Publish the receiving account. Customers transfer to these details; you confirm in Orders."
              : "Paste credentials here. Switching Demo and Live does not require a code change."}
          </p>
        </div>
        <span className="rounded-full border border-line px-3 py-1 text-xs tracking-[0.16em] text-ink-soft uppercase">
          {statusLabel(provider)}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          className="cursor-pointer text-sm text-accent hover:text-accent-dark"
          type="button"
          aria-expanded={expanded}
          onClick={onToggle}
        >
          {expanded ? "Collapse" : "Configure"}
        </button>
      </div>

      {!expanded ? <p className="text-sm text-muted">{summaryLine(provider)}</p> : null}

      {expanded ? (
        <>
          {error ? <AuthError>{error}</AuthError> : null}
          {notice ? <p className="text-sm text-ink-soft">{notice}</p> : null}

          <label className="flex cursor-pointer items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-line accent-accent"
              checked={enabled}
              onChange={(event) => setEnabled(event.target.checked)}
            />
            <span>
              <span className="text-ink">Show this gateway at checkout</span>
              <span className="mt-0.5 block text-muted">
                Turned-off gateways stay in Studio but are hidden from customers.
              </span>
            </span>
          </label>

          <FormSelect
            label="Mode"
            name={`${provider.id}-mode`}
            value={mode}
            onChange={(event) => setMode(event.target.value as "demo" | "live")}
            hint={
              manual
                ? "Demo can still simulate payment. Live shows these account details and waits for you to confirm."
                : "Demo uses the on-site checkout. Live sends the customer to the provider using the keys below."
            }
          >
            <option value="demo">Demo</option>
            <option value="live">Live</option>
          </FormSelect>

          {manual || !provider.webhookUrl ? null : (
            <div>
              <p className="text-sm text-ink">Webhook URL</p>
              <p className="mt-1.5 text-sm text-muted">
                Add this URL in the provider dashboard so paid events reach this site.
              </p>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <code className="block min-w-0 flex-1 overflow-x-auto rounded-xl border border-line bg-paper px-4 py-3 text-xs text-ink">
                  {provider.webhookUrl}
                </code>
                <button
                  type="button"
                  className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-line bg-surface px-4 text-sm font-medium text-ink transition hover:border-accent"
                  onClick={() => void copyWebhook()}
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {provider.fields.map((field) =>
              field.type === "select" ? (
                <FormSelect
                  key={field.key}
                  label={field.label}
                  name={`${provider.id}-${field.key}`}
                  hint={field.hint}
                  value={credentials[field.key] ?? field.value ?? field.options?.[0]?.value ?? "sandbox"}
                  onChange={(event) =>
                    setCredentials((current) => ({ ...current, [field.key]: event.target.value }))
                  }
                >
                  {(field.options ?? []).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </FormSelect>
              ) : field.type === "textarea" ? (
                <div key={field.key} className="sm:col-span-2">
                  <FormTextArea
                    label={field.label}
                    name={`${provider.id}-${field.key}`}
                    hint={field.hint}
                    rows={4}
                    value={credentials[field.key] ?? ""}
                    onChange={(event) =>
                      setCredentials((current) => ({ ...current, [field.key]: event.target.value }))
                    }
                  />
                </div>
              ) : (
                <FormField
                  key={field.key}
                  label={field.label}
                  name={`${provider.id}-${field.key}`}
                  type={field.type === "password" ? "password" : "text"}
                  autoComplete="off"
                  hint={
                    field.type === "password" && field.configured ? `${field.hint} Currently saved.` : field.hint
                  }
                  placeholder={
                    field.type === "password" && field.configured ? "Saved — leave blank to keep" : undefined
                  }
                  value={credentials[field.key] ?? ""}
                  onChange={(event) =>
                    setCredentials((current) => ({ ...current, [field.key]: event.target.value }))
                  }
                />
              ),
            )}
          </div>

          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition hover:bg-accent disabled:opacity-60"
            disabled={pending}
            onClick={() => void save()}
          >
            {pending ? "Saving…" : `Save ${provider.name}`}
          </button>
        </>
      ) : null}
    </section>
  );
}

export function AdminPaymentsPage() {
  const [providers, setProviders] = useState<AdminPaymentProvider[]>([]);
  const [openId, setOpenId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    apiGet<{ providers: AdminPaymentProvider[] }>("/payments/admin/providers", { cache: "no-store" })
      .then((payload) => {
        if (!cancelled) {
          setProviders(payload.providers ?? []);
          setError("");
        }
      })
      .catch((caught) => {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : "Could not load payment providers");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs tracking-[0.16em] text-accent uppercase">Studio</p>
        <h1 className="mt-2 font-display text-4xl text-ink">Payments</h1>
        <p className="mt-3 max-w-2xl text-ink-soft">
          Enable Stripe, PayPal, SSLCommerz, bKash, Nagad, or a manual bank transfer from this page. Hosted
          gateways need live keys. Bank transfer publishes the receiving account; you confirm those payments in
          Orders.
        </p>
      </div>

      {error ? <AuthError>{error}</AuthError> : null}

      {loading ? (
        <div className="h-40 animate-pulse rounded-[1.75rem] bg-paper-muted" />
      ) : (
        <div className="space-y-6">
          {providers.map((provider) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              expanded={openId === provider.id}
              onToggle={() => setOpenId((current) => (current === provider.id ? "" : provider.id))}
              onSaved={(next) =>
                setProviders((current) => current.map((item) => (item.id === next.id ? next : item)))
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
