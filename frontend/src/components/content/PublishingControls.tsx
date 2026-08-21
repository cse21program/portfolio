import { Link } from "react-router-dom";
import { FormField, FormSelect } from "@/components/ui/FormField";
import { contentStatusLabel, contentStatuses, todayStamp, type ContentStatus } from "@/lib/publishing";

export function PublishingControls({
  idPrefix,
  status,
  publishedAt,
  previewHref,
  onChange,
}: {
  idPrefix: string;
  status: string;
  publishedAt: string;
  previewHref: string;
  onChange: (patch: { status?: string; publishedAt?: string }) => void;
}) {
  const value = (contentStatuses as readonly string[]).includes(status) ? (status as ContentStatus) : "draft";

  return (
    <div className="space-y-4 rounded-2xl border border-line bg-paper/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs tracking-[0.16em] text-muted uppercase">Publishing</p>
        <div className="flex flex-wrap gap-2">
          <Link
            to={previewHref}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-line px-3 py-1.5 text-sm text-ink hover:border-accent"
          >
            Preview
          </Link>
          <button
            type="button"
            className="rounded-full bg-ink px-3 py-1.5 text-sm text-paper hover:bg-accent"
            onClick={() => onChange({ status: "published", publishedAt: publishedAt.trim() || todayStamp() })}
          >
            Publish now
          </button>
          <button
            type="button"
            className="rounded-full border border-line px-3 py-1.5 text-sm text-ink hover:border-accent"
            onClick={() => onChange({ status: "draft" })}
          >
            Unpublish
          </button>
          <button
            type="button"
            className="rounded-full border border-line px-3 py-1.5 text-sm text-ink hover:border-accent"
            onClick={() => onChange({ status: "archived" })}
          >
            Archive
          </button>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormSelect
          label="Status"
          name={`${idPrefix}-status`}
          value={value}
          onChange={(event) => onChange({ status: event.target.value })}
        >
          {contentStatuses.map((entry) => (
            <option key={entry} value={entry}>
              {contentStatusLabel(entry)}
            </option>
          ))}
        </FormSelect>
        <FormField
          label={value === "scheduled" ? "Go live at" : "Published date"}
          name={`${idPrefix}-publishedAt`}
          value={publishedAt}
          hint={
            value === "scheduled"
              ? "Use YYYY-MM-DD or YYYY-MM-DDTHH:MM. The public site shows it once that time has passed."
              : "Shown on the public page."
          }
          onChange={(event) => onChange({ publishedAt: event.target.value })}
        />
      </div>
    </div>
  );
}

export function CatalogVisibilityControls({
  idPrefix,
  published,
  previewHref,
  onChange,
}: {
  idPrefix: string;
  published: boolean;
  previewHref: string;
  onChange: (published: boolean) => void;
}) {
  return (
    <div className="space-y-4 rounded-2xl border border-line bg-paper/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs tracking-[0.16em] text-muted uppercase">Publishing</p>
        <div className="flex flex-wrap gap-2">
          <Link
            to={previewHref}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-line px-3 py-1.5 text-sm text-ink hover:border-accent"
          >
            Preview
          </Link>
          <button
            type="button"
            className="rounded-full bg-ink px-3 py-1.5 text-sm text-paper hover:bg-accent"
            onClick={() => onChange(true)}
          >
            Publish now
          </button>
          <button
            type="button"
            className="rounded-full border border-line px-3 py-1.5 text-sm text-ink hover:border-accent"
            onClick={() => onChange(false)}
          >
            Unpublish
          </button>
          <button
            type="button"
            className="rounded-full border border-line px-3 py-1.5 text-sm text-ink hover:border-accent"
            onClick={() => onChange(false)}
          >
            Archive
          </button>
        </div>
      </div>
      <FormSelect
        label="Status"
        name={`${idPrefix}-visibility`}
        value={published ? "published" : "draft"}
        onChange={(event) => onChange(event.target.value === "published")}
      >
        <option value="published">Published</option>
        <option value="draft">Draft</option>
      </FormSelect>
    </div>
  );
}
