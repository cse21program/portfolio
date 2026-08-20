import { useMemo, useState } from "react";
import { FilterChip, FilterGroups, FilterRow, FilterSearch, FilterToolbar } from "@/components/ui/FilterBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormSelect, FormTextArea } from "@/components/ui/FormField";
import { AuthError } from "@/features/auth/AuthForm";
import { useContactInquiries } from "@/features/contact/useContactInquiries";
import { env } from "@/config/env";
import {
  contactStatusLabel,
  contactStatuses,
  isOpenContactStatus,
  type ContactMessage,
  type ContactStatus,
} from "@/types/contact";

type StatusFilter = "all" | "open" | ContactStatus;

function formatWhen(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function fileHref(url: string) {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  if (env.apiUrl.startsWith("http")) {
    return `${env.apiUrl.replace(/\/api\/v1\/?$/, "")}${url}`;
  }
  return url;
}

function statusChipClass(status: string) {
  if (status === "new") {
    return "border-accent/25 bg-accent/10 text-accent-dark";
  }
  if (status === "converted") {
    return "border-ink/15 bg-ink text-paper";
  }
  return "border-line bg-paper text-ink-soft";
}

function matchesFilter(item: ContactMessage, filter: StatusFilter) {
  if (filter === "all") {
    return true;
  }
  if (filter === "open") {
    return isOpenContactStatus(item.status);
  }
  return item.status === filter;
}

export function AdminLeadsPage() {
  const { inquiries, loading, error, updateInquiry } = useContactInquiries();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("open");
  const [pending, setPending] = useState("");
  const [updateError, setUpdateError] = useState("");

  const newCount = inquiries.filter((item) => item.status === "new").length;
  const openCount = inquiries.filter((item) => isOpenContactStatus(item.status)).length;

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return inquiries.filter((item) => {
      if (!matchesFilter(item, filter)) {
        return false;
      }
      if (!needle) {
        return true;
      }
      const haystack = [
        item.name,
        item.email,
        item.company,
        item.subject,
        item.serviceTitle,
        item.serviceSlug,
        item.status,
        item.message,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [filter, inquiries, query]);

  async function updateStatus(id: string, status: ContactStatus) {
    setPending(id);
    setUpdateError("");
    try {
      await updateInquiry(id, { status });
    } catch {
      setUpdateError("Could not update this inquiry");
    } finally {
      setPending("");
    }
  }

  async function saveNote(id: string, adminNote: string) {
    setPending(`${id}-note`);
    setUpdateError("");
    try {
      await updateInquiry(id, { adminNote });
    } catch {
      setUpdateError("Could not save that note");
    } finally {
      setPending("");
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs tracking-[0.16em] text-accent uppercase">Studio</p>
        <h1 className="mt-2 font-display text-4xl text-ink">Leads</h1>
        <p className="mt-3 max-w-2xl text-ink-soft">
          Hire-me briefs from the public form. Catalog orders stay under Service orders.
        </p>
        <dl className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-line bg-surface px-4 py-3">
            <dt className="text-xs tracking-[0.16em] text-muted uppercase">New</dt>
            <dd className="mt-1 font-display text-2xl text-ink">{newCount}</dd>
          </div>
          <div className="rounded-2xl border border-line bg-surface px-4 py-3">
            <dt className="text-xs tracking-[0.16em] text-muted uppercase">Open</dt>
            <dd className="mt-1 font-display text-2xl text-ink">{openCount}</dd>
          </div>
          <div className="rounded-2xl border border-line bg-surface px-4 py-3">
            <dt className="text-xs tracking-[0.16em] text-muted uppercase">All</dt>
            <dd className="mt-1 font-display text-2xl text-ink">{inquiries.length}</dd>
          </div>
        </dl>
      </div>

      {error ? <AuthError>{error}</AuthError> : null}
      {updateError ? <AuthError>{updateError}</AuthError> : null}

      <FilterToolbar>
        <FilterSearch
          id="search-leads"
          label="Search inquiries"
          value={query}
          placeholder="Name, email, or subject"
          resultLabel={`${visible.length} ${visible.length === 1 ? "inquiry" : "inquiries"}`}
          filtering={query.trim().length > 0 || filter !== "open"}
          onChange={setQuery}
          onClear={() => {
            setQuery("");
            setFilter("open");
          }}
        />
        <FilterGroups count={filter !== "open" ? 1 : 0}>
          <FilterRow label="Status" groupLabel="Filter by status">
            <FilterChip label="Open" active={filter === "open"} onClick={() => setFilter("open")} />
            <FilterChip label="All" active={filter === "all"} onClick={() => setFilter("all")} />
            {contactStatuses.map((status) => (
              <FilterChip
                key={status}
                label={contactStatusLabel(status)}
                active={filter === status}
                onClick={() => setFilter(status)}
              />
            ))}
          </FilterRow>
        </FilterGroups>
      </FilterToolbar>

      {loading && inquiries.length === 0 ? (
        <div className="grid gap-3">
          <div className="h-40 animate-pulse rounded-[1.75rem] bg-surface" />
          <div className="h-40 animate-pulse rounded-[1.75rem] bg-surface" />
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          title="No inquiries in this view"
          description="Messages from the Hire me page will show here."
          action={{ label: "Open contact page", to: "/contact" }}
        />
      ) : (
        <ul className="space-y-4">
          {visible.map((item) => (
            <li
              key={item.id}
              className={`rounded-[1.75rem] border bg-surface p-5 sm:p-7 ${
                item.status === "new" ? "border-accent/35" : "border-line"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs ${statusChipClass(item.status)}`}
                    >
                      {contactStatusLabel(item.status)}
                    </span>
                    <span className="text-xs tracking-[0.16em] text-muted uppercase">
                      {item.serviceTitle || "General"}
                    </span>
                  </div>
                  <h2 className="mt-3 font-display text-2xl tracking-tight text-ink">{item.subject}</h2>
                  <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm text-ink-soft sm:grid-cols-2">
                    <div>
                      <dt className="text-muted">From</dt>
                      <dd className="text-ink">
                        {item.name}
                        {item.company ? ` · ${item.company}` : ""}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted">Email</dt>
                      <dd>
                        <a className="text-accent hover:text-accent-dark" href={`mailto:${item.email}`}>
                          {item.email}
                        </a>
                      </dd>
                    </div>
                    {item.phone ? (
                      <div>
                        <dt className="text-muted">Phone</dt>
                        <dd>{item.phone}</dd>
                      </div>
                    ) : null}
                    {item.budget ? (
                      <div>
                        <dt className="text-muted">Budget</dt>
                        <dd>{item.budget}</dd>
                      </div>
                    ) : null}
                  </dl>
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-ink-soft">{item.message}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                    {item.attachmentUrl ? (
                      <a
                        href={fileHref(item.attachmentUrl)}
                        className="font-medium text-accent hover:text-accent-dark"
                      >
                        Open attachment →
                      </a>
                    ) : null}
                    <p className="text-xs text-muted">{formatWhen(item.createdAt)}</p>
                  </div>
                </div>
                <FormSelect
                  label="Status"
                  name={`status-${item.id}`}
                  value={item.status}
                  disabled={pending === item.id}
                  onChange={(event) => void updateStatus(item.id, event.target.value as ContactStatus)}
                >
                  {contactStatuses.map((status) => (
                    <option key={status} value={status}>
                      {contactStatusLabel(status)}
                    </option>
                  ))}
                </FormSelect>
              </div>
              <form
                className="mt-6 border-t border-line pt-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  const note = String(new FormData(event.currentTarget).get("adminNote") ?? "");
                  void saveNote(item.id, note);
                }}
              >
                <FormTextArea
                  label="Studio note"
                  name="adminNote"
                  rows={2}
                  defaultValue={item.adminNote}
                  hint="Private. The sender does not see this."
                />
                <button
                  type="submit"
                  className="mt-3 inline-flex min-h-11 items-center justify-center rounded-full border border-line px-4 py-2 text-sm text-ink transition hover:border-accent disabled:opacity-60"
                  disabled={pending === `${item.id}-note`}
                >
                  {pending === `${item.id}-note` ? "Saving…" : "Save note"}
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
