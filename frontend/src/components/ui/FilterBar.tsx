import type { ReactNode } from "react";

export function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={`cursor-pointer rounded-full px-3 py-1.5 text-sm transition ${
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
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <label className="text-sm font-medium text-ink" htmlFor={id}>
          {label}
        </label>
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted" aria-live="polite">
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
          className="w-full rounded-full border border-line bg-surface py-3 pr-4 pl-11 text-sm text-ink outline-none placeholder:text-muted focus:border-accent"
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

export function FilterGroups({ children }: { children: ReactNode }) {
  return <div className="space-y-4 border-t border-line pt-5">{children}</div>;
}

export function FilterToolbar({ children }: { children: ReactNode }) {
  return <div className="space-y-5">{children}</div>;
}
