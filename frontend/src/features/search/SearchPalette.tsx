import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type Ref } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FilterChip } from "@/components/ui/FilterBar";
import { useSearch } from "@/features/search/useSearch";
import { useSiteAccess } from "@/features/content/SiteAccessContext";
import { searchKindCatalog } from "@/types/siteAccess";
import { catalogPriceBandLabels, type CatalogPriceBand } from "@/lib/catalogFilters";
import {
  parseSearchAccess,
  parseSearchKind,
  parseSearchPrice,
  parseSearchSort,
  parseSearchYear,
  searchAccessLabels,
  searchKindLabels,
  searchKinds,
  searchSortLabels,
  searchSorts,
  type SearchAccess,
  type SearchHit,
  type SearchKind,
  type SearchSort,
} from "@/types/search";

const SUGGESTIONS = ["Docker", "Spring Boot", "architecture", "JWT"];

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
      <path
        d="M8.5 3.5a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm7 12-3.2-3.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function shortcutLabel() {
  if (typeof navigator === "undefined") {
    return "Ctrl K";
  }
  return /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) ? "⌘K" : "Ctrl K";
}

export function SearchPalette({
  onClose,
  syncUrl = false,
}: {
  onClose?: () => void;
  syncUrl?: boolean;
}) {
  const labelId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedRef = useRef<HTMLAnchorElement>(null);
  const [params, setParams] = useSearchParams();
  const [draft, setDraft] = useState(() => (syncUrl ? (params.get("q") ?? "") : ""));
  const [query, setQuery] = useState(draft);
  const [kind, setKind] = useState<SearchKind | "">(syncUrl ? parseSearchKind(params.get("kind")) : "");
  const [sort, setSort] = useState<SearchSort>(syncUrl ? parseSearchSort(params.get("sort")) : "relevance");
  const [year, setYear] = useState(syncUrl ? parseSearchYear(params.get("year")) : "");
  const [skill, setSkill] = useState(syncUrl ? (params.get("skill")?.trim() ?? "") : "");
  const [topic, setTopic] = useState(syncUrl ? (params.get("topic")?.trim() ?? "") : "");
  const [access, setAccess] = useState<SearchAccess | "">(
    syncUrl ? parseSearchAccess(params.get("access")) : "",
  );
  const [price, setPrice] = useState(syncUrl ? parseSearchPrice(params.get("price")) : "");
  const [filtersOpen, setFiltersOpen] = useState(Boolean(year || skill || topic || access || price));
  const [selected, setSelected] = useState(0);
  const { results, loading, error } = useSearch({ query, kind, sort, year, skill, topic, access, price });
  const { catalogs } = useSiteAccess();
  const liveKinds = searchKinds.filter((item) => catalogs[searchKindCatalog[item]] !== false);
  const facets = results.facets;
  const hasQuery = Boolean(query.trim());
  const years = facets?.years ?? [];
  const skills = facets?.skills ?? [];
  const topics = facets?.topics ?? [];
  const accessOptions = facets?.access ?? [];
  const prices = facets?.prices ?? [];
  const extraFilters =
    (hasQuery && years.length > 1) ||
    (hasQuery && skills.length > 1) ||
    (hasQuery && topics.length > 1) ||
    (hasQuery && accessOptions.length > 1) ||
    (hasQuery && prices.length > 0);
  const hits = useMemo(
    () => results.groups.flatMap((group) => group.items),
    [results.groups],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(draft), 180);
    return () => window.clearTimeout(timer);
  }, [draft]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setSelected(0);
  }, [query, kind, sort, year, skill, topic, access, price, results.total]);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  useEffect(() => {
    if (!syncUrl) {
      return;
    }
    const next = new URLSearchParams();
    if (draft.trim()) {
      next.set("q", draft.trim());
    }
    if (kind) {
      next.set("kind", kind);
    }
    if (sort !== "relevance") {
      next.set("sort", sort);
    }
    if (year) {
      next.set("year", year);
    }
    if (skill) {
      next.set("skill", skill);
    }
    if (topic) {
      next.set("topic", topic);
    }
    if (access) {
      next.set("access", access);
    }
    if (price) {
      next.set("price", price);
    }
    if (next.toString() !== params.toString()) {
      setParams(next, { replace: true });
    }
  }, [syncUrl, draft, kind, sort, year, skill, topic, access, price, params, setParams]);

  function clearFilters() {
    setDraft("");
    setQuery("");
    setKind("");
    setSort("relevance");
    setYear("");
    setSkill("");
    setTopic("");
    setAccess("");
    setPrice("");
    setFiltersOpen(false);
    inputRef.current?.focus();
  }

  function onKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      if (onClose) {
        onClose();
      } else {
        clearFilters();
      }
      return;
    }
    if (!hits.length) {
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelected((index) => (index + 1) % hits.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelected((index) => (index - 1 + hits.length) % hits.length);
    } else if (event.key === "Enter") {
      const current = hits[selected];
      if (current && event.target instanceof HTMLInputElement) {
        event.preventDefault();
        selectedRef.current?.click();
      }
    }
  }

  const resultLabel = hasQuery
    ? `${results.total} ${results.total === 1 ? "result" : "results"}`
    : "Catalog";

  return (
    <div
      className="flex max-h-[min(40rem,calc(100dvh-4rem))] w-full max-w-2xl flex-col overflow-hidden rounded-[1.75rem] border border-line bg-surface shadow-[0_28px_80px_rgb(26_22_18/0.22)]"
      onKeyDown={onKeyDown}
    >
      <div className="relative border-b border-line px-4 pt-4 pb-3 sm:px-5">
        <div className="pointer-events-none absolute -top-16 right-8 h-32 w-32 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <SearchIcon className="h-5 w-5 shrink-0 text-accent" />
          <input
            ref={inputRef}
            id="global-search"
            type="search"
            value={draft}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder="Docker, Spring Boot, architecture…"
            aria-labelledby={labelId}
            aria-controls="search-results"
            className="min-w-0 flex-1 bg-transparent py-2 text-base text-ink outline-none placeholder:text-muted sm:text-lg"
            onChange={(event) => setDraft(event.target.value)}
          />
          {draft ? (
            <button
              type="button"
              className="cursor-pointer text-xs font-medium text-accent hover:text-accent-dark"
              onClick={clearFilters}
            >
              Clear
            </button>
          ) : null}
          {onClose ? (
            <button
              type="button"
              className="hidden cursor-pointer rounded-full border border-line px-2.5 py-1 text-[11px] tracking-[0.12em] text-muted uppercase hover:border-accent hover:text-ink sm:inline"
              onClick={onClose}
            >
              Esc
            </button>
          ) : null}
        </div>
        <p id={labelId} className="sr-only">
          Search the catalog
        </p>
      </div>

      <div className="border-b border-line px-4 py-3 sm:px-5">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by type">
          <FilterChip label="All" active={!kind} onClick={() => setKind("")} size="sm" />
          {liveKinds.map((item) => (
            <FilterChip
              key={item}
              label={searchKindLabels[item]}
              active={kind === item}
              onClick={() => setKind(item)}
              size="sm"
            />
          ))}
        </div>
        {hasQuery ? (
          <div className="mt-3 flex flex-wrap items-center gap-1.5" role="group" aria-label="Sort results">
            {searchSorts.map((item) => (
              <FilterChip
                key={item}
                label={searchSortLabels[item]}
                active={sort === item}
                onClick={() => setSort(item)}
                size="sm"
              />
            ))}
            {extraFilters ? (
              <button
                type="button"
                className="ml-1 cursor-pointer text-xs font-medium text-accent hover:text-accent-dark"
                aria-expanded={filtersOpen}
                onClick={() => setFiltersOpen((open) => !open)}
              >
                {filtersOpen ? "Hide filters" : "More filters"}
              </button>
            ) : null}
          </div>
        ) : null}
        {filtersOpen && extraFilters ? (
          <div className="mt-3 space-y-3 border-t border-line pt-3">
            {years.length > 1 ? (
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by year">
                <FilterChip label="All years" active={!year} onClick={() => setYear("")} size="sm" />
                {years.map((item) => (
                  <FilterChip key={item} label={item} active={year === item} onClick={() => setYear(item)} size="sm" />
                ))}
              </div>
            ) : null}
            {skills.length > 1 ? (
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by skill">
                <FilterChip label="All skills" active={!skill} onClick={() => setSkill("")} size="sm" />
                {skills.map((item) => (
                  <FilterChip key={item} label={item} active={skill === item} onClick={() => setSkill(item)} size="sm" />
                ))}
              </div>
            ) : null}
            {topics.length > 1 ? (
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by topic">
                <FilterChip label="All topics" active={!topic} onClick={() => setTopic("")} size="sm" />
                {topics.map((item) => (
                  <FilterChip key={item} label={item} active={topic === item} onClick={() => setTopic(item)} size="sm" />
                ))}
              </div>
            ) : null}
            {accessOptions.length > 1 ? (
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by access">
                <FilterChip label="All access" active={!access} onClick={() => setAccess("")} size="sm" />
                {accessOptions.map((item) => (
                  <FilterChip
                    key={item}
                    label={searchAccessLabels[item]}
                    active={access === item}
                    onClick={() => setAccess(item)}
                    size="sm"
                  />
                ))}
              </div>
            ) : null}
            {prices.length > 0 ? (
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by price">
                <FilterChip label="All prices" active={!price} onClick={() => setPrice("")} size="sm" />
                {prices.map((item) => (
                  <FilterChip
                    key={item}
                    label={catalogPriceBandLabels[item as CatalogPriceBand]}
                    active={price === item}
                    onClick={() => setPrice(item)}
                    size="sm"
                  />
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div id="search-results" className="scroll-pane min-h-0 flex-1 overflow-y-auto" aria-live="polite">
        {!hasQuery ? (
          <div className="px-6 py-10">
            <p className="text-xs tracking-[0.16em] text-accent uppercase">Search</p>
            <h1 className="mt-3 font-display text-3xl tracking-tight text-ink">Find work and writing</h1>
            <p className="mt-3 max-w-md text-sm leading-7 text-ink-soft">
              Projects, skills, topics, blogs, tutorials, courses, and services — labeled by type.
            </p>
            <p className="mt-6 text-xs tracking-[0.14em] text-muted uppercase">Try</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {SUGGESTIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  className="cursor-pointer rounded-full border border-line bg-paper px-3 py-1.5 text-sm text-ink hover:border-accent hover:text-accent-dark"
                  onClick={() => {
                    setDraft(item);
                    inputRef.current?.focus();
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
            <p className="mt-8 text-sm text-muted">Start with a word</p>
          </div>
        ) : loading && results.total === 0 && !error ? (
          <div className="space-y-3 px-5 py-6">
            <div className="h-16 animate-pulse rounded-2xl bg-paper" />
            <div className="h-16 animate-pulse rounded-2xl bg-paper" />
            <div className="h-16 animate-pulse rounded-2xl bg-paper" />
          </div>
        ) : error ? (
          <div className="px-6 py-10">
            <h2 className="font-display text-2xl text-ink">Search failed</h2>
            <p className="mt-2 text-sm text-ink-soft">{error}</p>
          </div>
        ) : results.groups.length === 0 ? (
          <div className="px-6 py-10">
            <h2 className="font-display text-2xl text-ink">Nothing matched</h2>
            <p className="mt-2 text-sm leading-7 text-ink-soft">
              No published {kind ? searchKindLabels[kind].toLowerCase() : "catalog items"} for “{query.trim()}”.
            </p>
          </div>
        ) : (
          <div className="py-2">
            {results.groups.map((group) => (
              <section key={group.kind} className="px-2">
                <h2 className="sticky top-0 z-10 bg-surface/95 px-4 py-2 font-display text-lg tracking-tight text-ink backdrop-blur-sm">
                  {group.label}
                </h2>
                <ul>
                  {group.items.map((item) => {
                    const index = hits.indexOf(item);
                    return (
                      <li key={`${item.kind}-${item.href}`}>
                        <ResultRow
                          item={item}
                          active={index === selected}
                          rowRef={index === selected ? selectedRef : undefined}
                          onPointer={() => setSelected(index)}
                          onNavigate={onClose}
                        />
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-line bg-paper/60 px-4 py-2.5 text-xs text-muted sm:px-5">
        <p aria-live="polite">{resultLabel}</p>
        <p className="hidden sm:block">
          {shortcutLabel()} to open · ↑↓ to move · Enter to open
        </p>
      </div>
    </div>
  );
}

function ResultRow({
  item,
  active,
  rowRef,
  onPointer,
  onNavigate,
}: {
  item: SearchHit;
  active: boolean;
  rowRef?: Ref<HTMLAnchorElement>;
  onPointer: () => void;
  onNavigate?: () => void;
}) {
  return (
    <Link
      ref={rowRef}
      to={item.href}
      className={`block rounded-2xl px-4 py-3 transition ${
        active ? "bg-paper" : "hover:bg-paper/70"
      }`}
      onMouseEnter={onPointer}
      onFocus={onPointer}
      onClick={onNavigate}
    >
      <p className="text-[11px] tracking-[0.16em] text-accent uppercase">
        {searchKindLabels[item.kind]}
        {item.meta ? ` · ${item.meta}` : ""}
      </p>
      <h3 className="mt-1 font-display text-xl tracking-tight text-ink">{item.title}</h3>
      {item.summary ? (
        <p className="mt-1 line-clamp-2 text-sm leading-6 text-ink-soft">{item.summary}</p>
      ) : null}
    </Link>
  );
}
