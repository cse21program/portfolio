import type { ResumeCredit } from "@/types/resume";
import { emptyCredit } from "@/types/resume";

export function CreditsEditor({
  label,
  hint,
  items,
  onChange,
}: {
  label: string;
  hint: string;
  items: ResumeCredit[];
  onChange: (items: ResumeCredit[]) => void;
}) {
  function update(index: number, patch: Partial<ResumeCredit>) {
    onChange(items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">{hint}</p>
      <ul className="space-y-3">
        {items.map((item, index) => (
          <li key={`${label}-${index}`} className="rounded-2xl border border-line bg-surface p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm text-ink">
                {label === "Publications" ? "Publication title" : "Award title"}
                <input
                  className="mt-1.5 w-full rounded-xl border border-line bg-paper/50 px-3 py-2 text-sm outline-none focus:border-accent"
                  value={item.title}
                  onChange={(event) => update(index, { title: event.target.value })}
                />
              </label>
              <label className="text-sm text-ink">
                Year
                <input
                  className="mt-1.5 w-full rounded-xl border border-line bg-paper/50 px-3 py-2 text-sm outline-none focus:border-accent"
                  value={item.year}
                  onChange={(event) => update(index, { year: event.target.value })}
                />
              </label>
              <label className="text-sm text-ink sm:col-span-2">
                Detail
                <input
                  className="mt-1.5 w-full rounded-xl border border-line bg-paper/50 px-3 py-2 text-sm outline-none focus:border-accent"
                  value={item.detail}
                  placeholder="Issuer, venue, or short note"
                  onChange={(event) => update(index, { detail: event.target.value })}
                />
              </label>
              <label className="text-sm text-ink sm:col-span-2">
                Link
                <input
                  className="mt-1.5 w-full rounded-xl border border-line bg-paper/50 px-3 py-2 text-sm outline-none focus:border-accent"
                  value={item.href ?? ""}
                  placeholder="https://"
                  onChange={(event) => update(index, { href: event.target.value || null })}
                />
              </label>
            </div>
            <button
              className="mt-3 cursor-pointer text-sm text-muted hover:text-ink"
              type="button"
              onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      <button
        className="cursor-pointer rounded-full border border-line bg-surface px-4 py-2 text-sm text-ink hover:border-accent"
        type="button"
        onClick={() => onChange([...items, emptyCredit()])}
      >
        Add {label === "Publications" ? "publication" : "award"}
      </button>
    </div>
  );
}
