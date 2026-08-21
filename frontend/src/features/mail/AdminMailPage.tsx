import { useEffect, useMemo, useState } from "react";
import { FormField, FormSelect } from "@/components/ui/FormField";
import { AuthError } from "@/features/auth/AuthForm";
import { apiGet, apiPatch, apiPost, apiPut } from "@/lib/api";
import type { AdminMailProvider, AdminMailSettings, MailCredentialField, MailTransportId } from "@/types/mail";

function transportLabel(transport: MailTransportId) {
  if (transport === "ses") {
    return "Amazon SES";
  }
  if (transport === "smtp") {
    return "SMTP";
  }
  return "Paused";
}

function statusLabel(provider: AdminMailProvider) {
  if (provider.active) {
    return "Sending";
  }
  if (provider.ready) {
    return "Ready";
  }
  return "Needs setup";
}

function fieldValues(provider: AdminMailProvider) {
  return Object.fromEntries(
    provider.fields
      .filter((field) => field.type !== "password")
      .map((field) => [
        field.key,
        field.value ||
          (field.key === "region"
            ? "ap-south-1"
            : field.key === "port"
              ? "587"
              : field.type === "select"
                ? field.options?.[0]?.value || ""
                : ""),
      ]),
  );
}

function fieldByKey(provider: AdminMailProvider, key: string) {
  return provider.fields.find((field) => field.key === key);
}

function fromLine(provider: AdminMailProvider) {
  const email = fieldByKey(provider, "fromEmail")?.value?.trim() || "";
  const name = fieldByKey(provider, "fromName")?.value?.trim() || "";
  if (email && name) {
    return `${name} · ${email}`;
  }
  return email || "No From address yet";
}

type FieldGroup = {
  title: string;
  note?: string;
  keys: string[];
};

function fieldGroups(provider: AdminMailProvider): FieldGroup[] {
  if (provider.id === "ses") {
    return [
      { title: "From address", keys: ["fromEmail", "fromName"] },
      {
        title: "SES SMTP",
        note: "Create SMTP credentials in Amazon SES. This is not an IAM access key and does not use the EC2 instance role, so it works from this machine and from the server.",
        keys: ["region", "user", "password"],
      },
    ];
  }
  return [
    { title: "From address", keys: ["fromEmail", "fromName"] },
    { title: "Server", keys: ["host", "port", "secure"] },
    { title: "Login", keys: ["user", "password"] },
  ];
}

function groupedFields(provider: AdminMailProvider) {
  const groups = fieldGroups(provider);
  const used = new Set(groups.flatMap((group) => group.keys));
  const leftover = provider.fields.filter((field) => !used.has(field.key)).map((field) => field.key);
  if (leftover.length === 0) {
    return groups;
  }
  return [...groups, { title: "More", keys: leftover }];
}

function FieldControl({
  provider,
  field,
  value,
  onChange,
}: {
  provider: AdminMailProvider;
  field: MailCredentialField;
  value: string;
  onChange: (value: string) => void;
}) {
  const name = `${provider.id}-${field.key}`;
  if (field.type === "select") {
    return (
      <FormSelect
        label={field.label}
        name={name}
        hint={field.hint}
        value={value || field.value || field.options?.[0]?.value || ""}
        onChange={(event) => onChange(event.target.value)}
      >
        {(field.options ?? []).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </FormSelect>
    );
  }
  return (
    <FormField
      label={field.label}
      name={name}
      type={field.type === "password" ? "password" : "text"}
      autoComplete="off"
      hint={field.type === "password" && field.configured ? `${field.hint} Currently saved.` : field.hint}
      placeholder={field.type === "password" && field.configured ? "Saved — leave blank to keep" : undefined}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function ProviderRow({
  provider,
  expanded,
  divided,
  onToggle,
  onSaved,
}: {
  provider: AdminMailProvider;
  expanded: boolean;
  divided: boolean;
  onToggle: () => void;
  onSaved: (next: AdminMailProvider) => void;
}) {
  const [credentials, setCredentials] = useState<Record<string, string>>(() => fieldValues(provider));
  const [pending, setPending] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const groups = useMemo(() => groupedFields(provider), [provider]);

  useEffect(() => {
    setCredentials(fieldValues(provider));
  }, [provider]);

  function setField(key: string, value: string) {
    setCredentials((current) => ({ ...current, [key]: value }));
    setNotice("");
  }

  async function save(activate: boolean) {
    setPending(activate ? "activate" : "save");
    setError("");
    setNotice("");
    try {
      const payload = await apiPatch<{ provider: AdminMailProvider }>(
        `/mail/admin/providers/${provider.id}`,
        { credentials, activate },
      );
      onSaved(payload.provider);
      setCredentials(fieldValues(payload.provider));
      setNotice(
        activate
          ? `Saved. Outbound mail now uses ${provider.name}.`
          : "Saved. Use this transport when you want it to send.",
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save this transport");
    } finally {
      setPending("");
    }
  }

  async function sendTest() {
    setPending("test");
    setError("");
    setNotice("");
    try {
      const payload = await apiPost<{ to: string; provider: string }>("/mail/admin/test", {
        provider: provider.id,
      });
      setNotice(`Test sent to ${payload.to} with ${provider.name}.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not send a test");
    } finally {
      setPending("");
    }
  }

  const sending = provider.active;

  return (
    <li className={`[overflow-anchor:none] ${divided ? "border-t border-line" : ""} ${sending ? "bg-surface" : "bg-paper-muted/40"}`}>
      <div className="flex flex-col gap-4 px-5 py-5 sm:px-7 sm:py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-2xl text-ink">{provider.name}</h2>
              <span
                className={
                  sending
                    ? "rounded-full bg-ink/90 px-2.5 py-0.5 text-[11px] tracking-[0.12em] text-paper uppercase"
                    : provider.ready
                      ? "rounded-full border border-line bg-surface px-2.5 py-0.5 text-[11px] tracking-[0.12em] text-ink-soft uppercase"
                      : "rounded-full border border-line bg-surface px-2.5 py-0.5 text-[11px] tracking-[0.12em] text-muted uppercase"
                }
              >
                {statusLabel(provider)}
              </span>
            </div>
            <p className="mt-1 max-w-xl text-sm text-ink-soft">{provider.hint}</p>
            <p className="mt-2 text-sm text-muted">
              {fromLine(provider)}
              {provider.ready ? " · Credentials saved" : " · Add the required fields to send"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {sending ? (
              <p className="text-sm text-ink">This one sends mail</p>
            ) : (
              <button
                type="button"
                className="cursor-pointer text-sm text-accent hover:text-accent-dark disabled:opacity-60"
                disabled={Boolean(pending)}
                aria-label={`Use ${provider.name} for sending`}
                onClick={() => void save(true)}
              >
                {pending === "activate" ? "Switching…" : "Use for sending"}
              </button>
            )}
            <button
              type="button"
              className="cursor-pointer text-sm text-ink hover:text-accent"
              aria-expanded={expanded}
              onClick={onToggle}
            >
              {expanded ? "Collapse" : "Configure"}
            </button>
          </div>
        </div>

        {expanded ? (
          <div className="space-y-6 border-t border-line pt-5">
            {error ? <AuthError>{error}</AuthError> : null}
            {notice ? <p className="text-sm text-ink-soft">{notice}</p> : null}

            {groups.map((group) => {
              const fields = group.keys
                .map((key) => provider.fields.find((field) => field.key === key))
                .filter((field): field is MailCredentialField => Boolean(field));
              if (fields.length === 0) {
                return null;
              }
              return (
                <div key={group.title} className="space-y-4">
                  <div>
                    <h3 className="text-xs tracking-[0.16em] text-muted uppercase">{group.title}</h3>
                    {group.note ? <p className="mt-1 text-sm text-muted">{group.note}</p> : null}
                    {provider.id === "ses" && group.title === "SES SMTP" ? (
                      <p className="mt-1 font-mono text-xs text-ink-soft">
                        {`email-smtp.${(credentials.region || "ap-south-1").trim()}.amazonaws.com`} · 587 · STARTTLS
                      </p>
                    ) : null}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {fields.map((field) => (
                      <FieldControl
                        key={field.key}
                        provider={provider}
                        field={field}
                        value={credentials[field.key] ?? ""}
                        onChange={(value) => setField(field.key, value)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition hover:bg-accent disabled:opacity-60"
                disabled={Boolean(pending)}
                onClick={() => void save(false)}
              >
                {pending === "save" ? "Saving…" : "Save credentials"}
              </button>
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-medium text-ink transition hover:border-accent disabled:opacity-60"
                disabled={Boolean(pending)}
                onClick={() => void sendTest()}
              >
                {pending === "test" ? "Sending…" : "Send test"}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </li>
  );
}

export function AdminMailPage() {
  const [settings, setSettings] = useState<AdminMailSettings | null>(null);
  const [openId, setOpenId] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    apiGet<AdminMailSettings>("/mail/admin", { cache: "no-store" })
      .then((payload) => {
        if (!cancelled) {
          setSettings(payload);
          setError("");
        }
      })
      .catch((caught) => {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : "Could not load mail settings");
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

  async function pauseSending() {
    setPending(true);
    setError("");
    try {
      const payload = await apiPut<AdminMailSettings>("/mail/admin/transport", { transport: "log" });
      setSettings(payload);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not pause sending");
    } finally {
      setPending(false);
    }
  }

  function applyProvider(next: AdminMailProvider) {
    setSettings((current) => {
      if (!current) {
        return current;
      }
      const fromEmail = fieldByKey(next, "fromEmail")?.value?.trim() || current.fromEmail;
      const fromName = fieldByKey(next, "fromName")?.value?.trim() || current.fromName;
      return {
        ...current,
        transport: next.active ? next.id : current.transport === next.id ? "log" : current.transport,
        fromEmail,
        fromName,
        providers: current.providers.map((item) =>
          item.id === next.id ? next : next.active ? { ...item, active: false } : item,
        ),
      };
    });
  }

  const providers = settings?.providers ?? [];
  const paused = settings?.transport === "log";

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs tracking-[0.16em] text-accent uppercase">Studio</p>
        <h1 className="mt-2 font-display text-4xl text-ink">Email</h1>
        <p className="mt-3 max-w-2xl text-ink-soft">
          Save Amazon SES SMTP and a generic mailbox separately, then pick one to send. SES uses
          SMTP credentials from the AWS console, so it works here and on the server.
        </p>
      </div>

      {error ? <AuthError>{error}</AuthError> : null}

      {loading ? (
        <div className="h-28 animate-pulse rounded-[1.5rem] bg-paper-muted" />
      ) : settings ? (
        <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-[1.5rem] border border-line bg-line sm:grid-cols-3">
          <div className="bg-surface px-5 py-4">
            <dt className="text-xs tracking-[0.16em] text-muted uppercase">Sending with</dt>
            <dd className="mt-2 font-display text-2xl text-ink">{transportLabel(settings.transport)}</dd>
          </div>
          <div className="bg-surface px-5 py-4">
            <dt className="text-xs tracking-[0.16em] text-muted uppercase">From</dt>
            <dd className="mt-2 text-sm leading-6 text-ink">
              {settings.fromEmail ? (
                <>
                  {settings.fromName ? <span className="block font-medium">{settings.fromName}</span> : null}
                  <span className="text-ink-soft">{settings.fromEmail}</span>
                </>
              ) : (
                <span className="text-muted">Add a From address</span>
              )}
            </dd>
          </div>
          <div className="bg-surface px-5 py-4">
            <dt className="text-xs tracking-[0.16em] text-muted uppercase">Delivery</dt>
            <dd className="mt-2">
              {paused ? (
                <p className="text-sm text-ink-soft">Logged in Studio until you choose a transport.</p>
              ) : (
                <button
                  type="button"
                  className="text-sm text-accent hover:text-accent-dark disabled:opacity-60"
                  disabled={pending}
                  onClick={() => void pauseSending()}
                >
                  {pending ? "Pausing…" : "Pause sending"}
                </button>
              )}
            </dd>
          </div>
        </dl>
      ) : null}

      {loading ? (
        <div className="h-56 animate-pulse rounded-[1.75rem] bg-paper-muted" />
      ) : (
        <section className="space-y-3">
          <div>
            <h2 className="font-display text-2xl text-ink">Transports</h2>
            <p className="mt-1 text-sm text-muted">
              Both can be saved. Only the one marked Sending delivers mail.
            </p>
          </div>
          <ul className="overflow-hidden rounded-[1.75rem] border border-line">
            {providers.map((provider, index) => (
              <ProviderRow
                key={provider.id}
                provider={provider}
                divided={index > 0}
                expanded={openId === provider.id}
                onToggle={() => setOpenId((current) => (current === provider.id ? "" : provider.id))}
                onSaved={applyProvider}
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
