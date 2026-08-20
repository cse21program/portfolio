import { useId, useState, type ReactNode } from "react";

export function FilterChip({
  label,
  active,
  onClick,
  size = "md",
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  size?: "sm" | "md";
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={`cursor-pointer rounded-full transition ${
        size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm"
      } ${
        active
          ? "bg-accent text-paper shadow-sm hover:bg-accent-dark"
          : "border border-line bg-surface text-ink hover:border-accent hover:text-accent-dark"
      }`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

export function FilterRow({
  label,
  groupLabel,
  children,
}: {
  label: string;
  groupLabel: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-5">
      <p className="shrink-0 font-display text-base text-ink sm:w-24 sm:pt-0.5">{label}</p>
      <div className="flex min-w-0 flex-wrap gap-2" role="group" aria-label={groupLabel}>
        {children}
      </div>
    </div>
  );
}

export function FilterSearch({
  id,
  label,
  value,
  placeholder,
  resultLabel,
  filtering,
  onChange,
  onClear,
}: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  resultLabel: string;
  filtering: boolean;
  onChange: (value: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="min-w-0 flex-1 space-y-3">
        <div className="flex items-end justify-between gap-3">
          <label className="text-sm font-medium text-ink" htmlFor={id}>
            {label}
          </label>
          <div className="flex items-center gap-3">
            <p className="sr-only" aria-live="polite">
              {resultLabel}
            </p>
            {filtering ? (
              <button
                type="button"
                className="cursor-pointer text-sm font-medium text-accent hover:text-accent-dark"
                onClick={onClear}
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>
      <div className="relative">
        <svg
          viewBox="0 0 20 20"
          className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-accent"
          aria-hidden="true"
        >
          <path
            d="M8.5 3.5a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm7 12-3.2-3.2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
        <input
          id={id}
          type="search"
          value={value}
          autoComplete="off"
          placeholder={placeholder}
          className="h-12 min-w-0 w-full rounded-full border border-line bg-surface pr-4 pl-11 text-sm text-ink outline-none placeholder:text-muted focus:border-accent"
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
            }
          }}
        />
      </div>
    </div>
  );
}

export function FilterGroups({
  children,
  count = 0,
}: {
  children: ReactNode;
  count?: number;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const active = open || count > 0;

  return (
    <>
      <button
        type="button"
        className={`group relative grid h-12 w-12 shrink-0 cursor-pointer place-items-center self-end rounded-full border bg-surface transition ${
          active
            ? "border-accent text-accent"
            : "border-line text-ink hover:border-accent hover:text-accent-dark"
        }`}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="Filters"
        onClick={() => setOpen((value) => !value)}
      >
        <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
          <path
            d="M3.5 5h13M3.5 10h13M3.5 15h13"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
          <circle cx="7.5" cy="5" r="1.85" fill="currentColor" />
          <circle cx="12.5" cy="10" r="1.85" fill="currentColor" />
          <circle cx="8.5" cy="15" r="1.85" fill="currentColor" />
        </svg>
        {count > 0 ? (
          <span className="absolute -top-1 -right-1 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-medium leading-none text-paper">
            {count}
          </span>
        ) : null}
        <span
          className="pointer-events-none absolute top-full right-0 z-10 mt-2 rounded-full bg-ink px-2.5 py-1 text-xs tracking-wide text-paper opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
          aria-hidden="true"
        >
          Filter
        </span>
      </button>
      {open ? (
        <div id={panelId} className="w-full basis-full space-y-4 border-t border-line pt-4">
          {children}
        </div>
      ) : null}
    </>
  );
}

export function FilterToolbar({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-end gap-x-2 gap-y-4">{children}</div>;
}
