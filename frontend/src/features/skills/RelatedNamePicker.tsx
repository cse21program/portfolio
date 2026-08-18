import { useId, useMemo, useRef, useState } from "react";
import {
  isKnownRelated,
  relatedLabel,
  relatedSlugFromQuery,
  searchRelated,
  suggestedRelated,
  type RelatedOption,
} from "@/features/skills/relatedOptions";

function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3 w-3" aria-hidden="true">
      <path
        d="M4 4l8 8M12 4l-8 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function RelatedNamePicker({
  label,
  hint,
  name,
  selected,
  options,
  suggestFrom,
  onChange,
}: {
  label: string;
  hint?: string;
  name: string;
  selected: string[];
  options: RelatedOption[];
  suggestFrom: string[];
  onChange: (slugs: string[]) => void;
}) {
  const inputId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const chosen = selected.map((slug) => slug.trim().toLowerCase()).filter(Boolean);
  const suggested = useMemo(
    () => suggestedRelated(options, chosen, suggestFrom).slice(0, 4),
    [options, chosen, suggestFrom],
  );
  const remaining = useMemo(
    () => searchRelated(options, chosen, query).slice(0, 8),
    [options, chosen, query],
  );
  const catalog = useMemo(() => searchRelated(options, chosen, ""), [options, chosen]);
  const typedSlug = relatedSlugFromQuery(query);
  const canAddTypedSlug = Boolean(typedSlug) && !chosen.includes(typedSlug);
  const searching = Boolean(query.trim());
  const list = searching ? remaining : [];
  const chips = (suggested.length > 0 ? suggested : catalog).slice(0, 4);
  const showMenu = open && (list.length > 0 || canAddTypedSlug || searching);

  function add(slug: string) {
    const next = slug.trim().toLowerCase();
    if (!next || chosen.includes(next)) {
      return;
    }
    onChange([...chosen, next]);
    setQuery("");
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="rounded-2xl border border-line bg-paper/55 p-4">
      <label className="text-sm font-medium text-ink" htmlFor={inputId}>
        {label}
      </label>
      {hint ? <p className="mt-1 text-xs leading-5 text-muted">{hint}</p> : null}

      {chosen.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {chosen.map((slug) => {
            const known = isKnownRelated(options, slug);
            return (
              <li
                key={slug}
                className="inline-flex max-w-full items-center gap-2 rounded-full border border-accent/20 bg-accent/10 py-1 pr-1 pl-3 text-xs text-accent-dark"
              >
                <span className="truncate">{relatedLabel(options, slug)}</span>
                {known ? null : <span className="text-muted">not found</span>}
                <button
                  type="button"
                  className="grid h-6 w-6 shrink-0 cursor-pointer place-items-center rounded-full text-accent-dark hover:bg-accent/15"
                  aria-label={`Remove ${relatedLabel(options, slug)}`}
                  onClick={() => onChange(chosen.filter((item) => item !== slug))}
                >
                  <CloseIcon />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      <div className="relative mt-3">
        <input
          id={inputId}
          name={name}
          value={query}
          type="text"
          autoComplete="off"
          placeholder="Search by name"
          className="w-full rounded-xl border border-line bg-surface px-4 py-3 outline-none focus:border-accent"
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={(event) => {
            const next = event.relatedTarget as Node | null;
            if (next && rootRef.current?.contains(next)) {
              return;
            }
            window.setTimeout(() => {
              if (rootRef.current?.contains(document.activeElement)) {
                return;
              }
              setOpen(false);
            }, 0);
          }}
          onKeyDown={(event) => {
            if (event.key !== "Enter") {
              return;
            }
            event.preventDefault();
            const first = searching ? remaining[0] : chips[0];
            if (first) {
              add(first.slug);
              return;
            }
            if (typedSlug) {
              add(typedSlug);
            }
          }}
        />
        {showMenu ? (
          <ul
            className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-2xl border border-line bg-surface py-1 shadow-[0_18px_40px_rgb(26_22_18/0.12)]"
            role="listbox"
            aria-label={label}
          >
            {list.map((option) => (
              <li key={option.slug}>
                <button
                  type="button"
                  className="flex w-full cursor-pointer flex-col px-4 py-2.5 text-left hover:bg-paper"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => add(option.slug)}
                >
                  <span className="text-sm text-ink">{option.name}</span>
                  <span className="text-[11px] text-muted" aria-hidden="true">
                    {option.slug}
                  </span>
                </button>
              </li>
            ))}
            {canAddTypedSlug && !list.some((option) => option.slug === typedSlug) ? (
              <li>
                <button
                  type="button"
                  className="flex w-full cursor-pointer px-4 py-2.5 text-left text-sm text-ink hover:bg-paper"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => add(typedSlug)}
                >
                  Add slug {typedSlug}
                </button>
              </li>
            ) : null}
            {list.length === 0 && !canAddTypedSlug ? (
              <li className="px-4 py-2.5 text-sm text-muted">No matching {label.toLowerCase()}</li>
            ) : null}
          </ul>
        ) : null}
      </div>

      {!searching && chips.length > 0 ? (
        <div className="mt-3">
          <p className="text-[11px] tracking-[0.14em] text-muted uppercase">Suggested</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {chips.map((option) => (
              <li key={option.slug}>
                <button
                  type="button"
                  className="cursor-pointer rounded-full border border-line bg-surface px-3 py-1.5 text-xs text-ink transition hover:border-accent hover:text-accent-dark"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => add(option.slug)}
                >
                  {option.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
