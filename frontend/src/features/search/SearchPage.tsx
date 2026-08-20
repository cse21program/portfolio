import { SearchPalette } from "@/features/search/SearchPalette";

export function SearchPage() {
  return (
    <section className="relative min-h-[calc(100dvh-4.25rem)] overflow-hidden border-b border-line">
      <div className="pointer-events-none absolute inset-0 bg-ink/20" />
      <div className="pointer-events-none absolute -top-28 left-1/3 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
      <div className="pointer-events-none absolute right-0 bottom-0 h-56 w-56 rounded-full bg-paper-muted blur-3xl" />
      <div className="relative mx-auto flex max-w-2xl justify-center px-4 py-10 sm:px-6 sm:py-16">
        <SearchPalette syncUrl />
      </div>
    </section>
  );
}
