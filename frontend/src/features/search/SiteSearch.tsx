import { useOptionalSearchModal } from "@/features/search/SearchContext";

function shortcutLabel() {
  if (typeof navigator === "undefined") {
    return "Ctrl K";
  }
  return /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) ? "⌘K" : "Ctrl K";
}

function SearchMark() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 text-accent" aria-hidden="true">
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

export function SiteSearch({ compact = false }: { compact?: boolean }) {
  const search = useOptionalSearchModal();

  function open() {
    search?.openSearch();
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={open}
        className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-paper py-1.5 pr-1.5 pl-3 text-sm text-ink-soft transition hover:border-accent hover:text-ink"
        aria-label="Search the catalog"
      >
        <SearchMark />
        <span>Search</span>
        <kbd className="rounded-full border border-line bg-surface px-2 py-0.5 text-[10px] tracking-[0.08em] text-muted">
          {shortcutLabel()}
        </kbd>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={open}
      className="inline-flex w-full cursor-pointer items-center gap-3 rounded-full border border-line bg-surface px-4 py-3 text-left text-sm text-muted transition hover:border-accent hover:text-ink"
    >
      <SearchMark />
      <span className="flex-1">Search the catalog</span>
      <kbd className="rounded-full border border-line px-2 py-0.5 text-[10px] tracking-[0.08em]">
        {shortcutLabel()}
      </kbd>
    </button>
  );
}
