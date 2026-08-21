import { contentStatusLabel } from "@/lib/publishing";

export function PreviewBanner({ status }: { status?: string }) {
  return (
    <div
      role="status"
      className="rounded-[1.25rem] border border-accent/30 bg-accent/5 px-5 py-3 text-sm text-ink"
    >
      Preview — this {contentStatusLabel(status).toLowerCase()} item is not on the public catalog.
    </div>
  );
}
