import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { AuthError } from "@/features/auth/AuthForm";
import { useSiteAccess } from "@/features/content/SiteAccessContext";
import { apiGet, apiPut } from "@/lib/api";
import {
  defaultPublicCatalogs,
  normalizePublicCatalogs,
  publicCatalogGroups,
  publicCatalogMeta,
  type PublicCatalogKey,
  type PublicCatalogs,
} from "@/types/siteAccess";

function liveCount(catalogs: PublicCatalogs) {
  return publicCatalogMeta.filter((item) => catalogs[item.key]).length;
}

function sameCatalogs(left: PublicCatalogs, right: PublicCatalogs) {
  return publicCatalogMeta.every((item) => left[item.key] === right[item.key]);
}

function AccessSwitch({
  label,
  live,
  onChange,
}: {
  label: string;
  live: boolean;
  onChange: (live: boolean) => void;
}) {
  const options = [
    { live: true, name: "Live" },
    { live: false, name: "Stop" },
  ] as const;

  return (
    <div
      className="inline-flex rounded-full border border-line bg-paper p-0.5"
      role="group"
      aria-label={`${label} on the public site`}
    >
      {options.map((option) => {
        const active = live === option.live;
        return (
          <button
            key={option.name}
            type="button"
            aria-pressed={active}
            className={`min-w-[4.5rem] rounded-full px-3 py-1.5 text-sm transition ${
              active
                ? option.live
                  ? "bg-ink text-paper shadow-sm"
                  : "bg-paper-muted text-ink shadow-sm"
                : "text-muted hover:text-ink"
            }`}
            onClick={() => onChange(option.live)}
          >
            {option.name}
          </button>
        );
      })}
    </div>
  );
}

export function AdminCatalogsPage() {
  const { reload } = useSiteAccess();
  const [catalogs, setCatalogs] = useState<PublicCatalogs>(defaultPublicCatalogs);
  const [saved, setSaved] = useState<PublicCatalogs>(defaultPublicCatalogs);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const dirtyRef = useRef(false);

  const dirty = !sameCatalogs(catalogs, saved);
  const live = liveCount(catalogs);
  const stopped = publicCatalogMeta.length - live;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const payload = await apiGet<{ catalogs: PublicCatalogs }>("/site-access", { cache: "no-store" });
        if (!cancelled) {
          const next = normalizePublicCatalogs(payload.catalogs);
          setSaved(next);
          if (!dirtyRef.current) {
            setCatalogs(next);
          }
          setError("");
        }
      } catch {
        if (!cancelled) {
          setError("Could not load public catalogs");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const grouped = useMemo(
    () =>
      publicCatalogGroups.map((group) => ({
        ...group,
        items: publicCatalogMeta.filter((item) => item.group === group.id),
      })),
    [],
  );

  function setLive(key: PublicCatalogKey, nextLive: boolean) {
    dirtyRef.current = true;
    setCatalogs((current) => ({ ...current, [key]: nextLive }));
    setNotice("");
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const payload = await apiPut<{ catalogs: PublicCatalogs }>("/site-access", { catalogs });
      const next = normalizePublicCatalogs(payload.catalogs);
      setCatalogs(next);
      setSaved(next);
      dirtyRef.current = false;
      await reload();
      setNotice(
        liveCount(next) === publicCatalogMeta.length
          ? "The full public catalog is live."
          : `${liveCount(next)} of ${publicCatalogMeta.length} catalogs are live on the public site.`,
      );
    } catch {
      setError("Could not save public catalogs");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="space-y-8" onSubmit={(event) => void onSubmit(event)}>
      <div>
        <p className="text-xs tracking-[0.16em] text-accent uppercase">Studio</p>
        <h1 className="mt-2 font-display text-4xl text-ink">Public catalogs</h1>
        <p className="mt-3 max-w-2xl text-ink-soft">
          Stop a catalog to take it off navigation, search, and public URLs. Studio keeps the records.
          Enrolled students still reach their courses.
        </p>
      </div>

      {error ? <AuthError>{error}</AuthError> : null}

      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[1.5rem] border border-line bg-line sm:grid-cols-3">
        <div className="bg-surface px-5 py-4">
          <dt className="text-xs tracking-[0.16em] text-muted uppercase">Live</dt>
          <dd className="mt-2 font-display text-3xl text-ink">{loading ? "—" : live}</dd>
        </div>
        <div className="bg-surface px-5 py-4">
          <dt className="text-xs tracking-[0.16em] text-muted uppercase">Stopped</dt>
          <dd className="mt-2 font-display text-3xl text-ink">{loading ? "—" : stopped}</dd>
        </div>
        <div className="col-span-2 flex items-end justify-between gap-3 bg-surface px-5 py-4 sm:col-span-1 sm:flex-col sm:items-start">
          <dt className="text-xs tracking-[0.16em] text-muted uppercase">Public site</dt>
          <dd className="mt-2">
            <Link to="/" target="_blank" rel="noreferrer" className="text-sm text-accent hover:text-accent-dark">
              View site →
            </Link>
          </dd>
        </div>
      </dl>

      {grouped.map((group) => (
        <section key={group.id} className="space-y-3">
          <div>
            <h2 className="font-display text-2xl text-ink">{group.label}</h2>
            <p className="mt-1 text-sm text-muted">{group.description}</p>
          </div>
          <ul className="overflow-hidden rounded-[1.75rem] border border-line bg-surface">
            {group.items.map((item, index) => {
              const isLive = catalogs[item.key];
              return (
                <li
                  key={item.key}
                  className={`flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7 ${
                    index > 0 ? "border-t border-line" : ""
                  } ${isLive ? "" : "bg-paper-muted/50"}`}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-xl text-ink">{item.label}</h3>
                      <span
                        className={
                          isLive
                            ? "rounded-full bg-ink/90 px-2.5 py-0.5 text-[11px] tracking-[0.12em] text-paper uppercase"
                            : "rounded-full border border-line bg-surface px-2.5 py-0.5 text-[11px] tracking-[0.12em] text-muted uppercase"
                        }
                      >
                        {isLive ? "Live" : "Stopped"}
                      </span>
                    </div>
                    <p className="mt-1 max-w-xl text-sm text-ink-soft">{item.summary}</p>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                      <Link to={item.studioHref} className="text-ink hover:text-accent">
                        Edit in Studio
                      </Link>
                      <Link to={item.href} className="text-muted hover:text-ink">
                        {item.href}
                      </Link>
                    </div>
                  </div>
                  <AccessSwitch
                    label={item.label}
                    live={isLive}
                    onChange={(next) => setLive(item.key, next)}
                  />
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <div className="sticky bottom-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface/95 px-4 py-3 shadow-lg backdrop-blur">
        <p className="text-sm text-muted">
          {saving ? "Saving…" : dirty ? "Unsaved changes" : notice || "All changes saved"}
        </p>
        <div className="flex flex-wrap gap-2">
          {dirty ? (
            <button
              type="button"
              className="rounded-full border border-line px-4 py-2 text-sm text-ink hover:border-accent"
              onClick={() => {
                dirtyRef.current = false;
                setCatalogs(saved);
                setNotice("");
                setError("");
              }}
            >
              Discard
            </button>
          ) : null}
          <button
            type="submit"
            disabled={saving || !dirty}
            className="rounded-full bg-ink px-5 py-2.5 text-sm text-paper hover:bg-accent disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save public site"}
          </button>
        </div>
      </div>
    </form>
  );
}
