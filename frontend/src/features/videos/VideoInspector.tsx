import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { FormField, FormTextArea } from "@/components/ui/FormField";
import { EmbedPlayer } from "@/features/about/IntroVideo";
import { VideoPlayer } from "@/features/about/VideoPlayer";
import { mediaHref } from "@/lib/mediaUrl";
import { formatBytes, formatMediaDate } from "@/types/media";
import { videoProviderLabels, type ManagedVideo } from "@/types/video";

const ghostAction =
  "inline-flex h-9 items-center rounded-lg px-2.5 text-sm text-ink-soft transition hover:bg-paper-muted hover:text-ink";

export function VideoInspector({
  video,
  busy,
  onClose,
  onSave,
  onRemove,
}: {
  video: ManagedVideo;
  busy: boolean;
  onClose: () => void;
  onSave: (input: { title: string; caption: string }) => Promise<void>;
  onRemove: () => void;
}) {
  const headingId = useId();
  const [title, setTitle] = useState(video.title);
  const [caption, setCaption] = useState(video.caption);
  const [copied, setCopied] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const nameId = `video-title-${video.id}`;
  const playUrl = video.playUrl ? mediaHref(video.playUrl) : null;
  const href = mediaHref(video.url);
  const dirty = title.trim() !== video.title || caption !== video.caption;

  useEffect(() => {
    setTitle(video.title);
    setCaption(video.caption);
  }, [video.caption, video.id, video.title, video.updatedAt]);

  useEffect(() => {
    closeRef.current?.focus();
  }, [video.id]);

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(video.url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  function focusTitle() {
    const field = document.getElementById(nameId);
    if (field instanceof HTMLInputElement) {
      field.focus();
      field.select();
    }
  }

  async function save() {
    if (!title.trim()) {
      return;
    }
    await onSave({ title: title.trim(), caption });
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 cursor-pointer bg-ink/30"
        aria-label="Close inspector"
        onClick={onClose}
      />
      <aside
        className="relative flex h-full w-full max-w-md flex-col border-l border-line bg-surface shadow-[-20px_0_40px_rgb(26_22_18/0.08)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
      >
        <header className="flex items-center gap-3 border-b border-line px-5 py-3.5">
          <div className="min-w-0 flex-1">
            <h2 id={headingId} className="truncate text-sm font-medium text-ink" title={video.title}>
              {video.title}
            </h2>
            <p className="mt-0.5 truncate text-xs text-muted">
              {videoProviderLabels[video.provider]}
              {video.sizeBytes ? ` · ${formatBytes(video.sizeBytes)}` : ""} · {formatMediaDate(video.createdAt)}
            </p>
          </div>
          {dirty ? <span className="shrink-0 text-xs font-medium text-accent">Unsaved</span> : null}
          <button
            ref={closeRef}
            type="button"
            className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-lg text-muted hover:bg-paper-muted hover:text-ink"
            onClick={onClose}
          >
            <span className="sr-only">Close</span>
            <Icon>
              <path d="M6 6l12 12M18 6 6 18" />
            </Icon>
          </button>
        </header>

        <div className="scroll-pane min-h-0 flex-1 overflow-y-auto">
          <div className="overflow-hidden border-b border-line bg-ink">
            {video.embedUrl ? (
              <EmbedPlayer
                src={video.embedUrl}
                title={video.title}
                poster={video.posterUrl}
                className="rounded-none"
              />
            ) : playUrl ? (
              <VideoPlayer src={playUrl} title={video.title} poster={video.posterUrl ?? undefined} className="rounded-none" />
            ) : (
              <p className="grid aspect-video place-items-center text-sm text-paper/70">This video cannot be played.</p>
            )}
          </div>

          <div className="space-y-6 px-5 py-5">
            <dl className="text-sm">
              <MetaRow label="Source" value={videoProviderLabels[video.provider]} />
              <MetaRow
                label="Usage"
                value={
                  video.usedIn.length === 0
                    ? "Unused"
                    : `${video.usedIn.length} placement${video.usedIn.length === 1 ? "" : "s"}`
                }
              />
            </dl>
            <div className="space-y-3">
              <FormField
                id={nameId}
                label="Title"
                name={nameId}
                value={title}
                maxLength={180}
                hint="Shown in this catalog. Paste the URL into About, Topics, or Courses."
                onChange={(event) => setTitle(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void save();
                  }
                }}
              />
              <FormTextArea
                label="Caption"
                name={`caption-${video.id}`}
                value={caption}
                rows={3}
                maxLength={240}
                hint="Studio note only."
                onChange={(event) => setCaption(event.target.value)}
              />
            </div>
            <section>
              <h3 className="text-sm font-medium text-ink">Used on</h3>
              {video.usedIn.length === 0 ? (
                <p className="mt-2 text-sm text-ink-soft">Not referenced on any published page yet.</p>
              ) : (
                <ul className="mt-2 divide-y divide-line border-y border-line">
                  {video.usedIn.map((item) => (
                    <li key={`${item.href}-${item.label}`}>
                      <Link
                        to={item.href}
                        className="flex items-center justify-between gap-3 py-2.5 text-sm text-ink hover:text-accent"
                      >
                        {item.label}
                        <span aria-hidden="true" className="text-muted">
                          →
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>

        <footer className="space-y-3 border-t border-line px-5 py-3">
          <div className={`grid gap-2 ${dirty ? "grid-cols-2" : "grid-cols-1"}`}>
            <button
              type="button"
              className={`h-9 cursor-pointer whitespace-nowrap rounded-full px-3.5 text-sm ${
                dirty ? "border border-line text-ink hover:border-accent" : "bg-ink text-paper hover:bg-accent"
              }`}
              onClick={() => void copyUrl()}
            >
              {copied ? "Copied" : "Copy URL"}
            </button>
            {dirty ? (
              <button
                type="button"
                className="h-9 cursor-pointer whitespace-nowrap rounded-full bg-ink px-3.5 text-sm text-paper hover:bg-accent disabled:opacity-60"
                disabled={busy || !title.trim()}
                onClick={() => void save()}
              >
                Save
              </button>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-x-1 gap-y-1" aria-label="Video actions">
            <button type="button" className={`${ghostAction} cursor-pointer`} onClick={focusTitle}>
              Rename
            </button>
            <a href={href} target="_blank" rel="noreferrer" className={ghostAction}>
              Open
            </a>
            <span className="mx-1 h-4 w-px bg-line" aria-hidden="true" />
            <button type="button" className={`${ghostAction} cursor-pointer`} disabled={busy} onClick={onRemove}>
              Remove
            </button>
          </div>
        </footer>
      </aside>
    </div>,
    document.body,
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line py-2.5 first:pt-0">
      <dt className="text-muted">{label}</dt>
      <dd className="truncate text-ink">{value}</dd>
    </div>
  );
}

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function VideoConfirmRemove({
  video,
  busy,
  onCancel,
  onConfirm,
}: {
  video: ManagedVideo;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const titleId = useId();
  const inUse = video.usedIn.length > 0;

  return createPortal(
    <div className="fixed inset-0 z-[60] grid place-items-center bg-ink/45 p-4" onClick={onCancel}>
      <div
        className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-[0_16px_40px_rgb(26_22_18/0.12)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className="font-display text-2xl text-ink">
          {inUse ? `Can't remove ${video.title}` : `Remove ${video.title}?`}
        </h2>
        <p className="mt-3 text-sm leading-7 text-ink-soft">
          {inUse
            ? `This video is used on ${video.usedIn.map((item) => item.label).join(", ")}. Remove it from those pages first.`
            : video.origin === "upload"
              ? "This removes the uploaded file from the media library and from storage."
              : "This removes the hosted link from the catalog. The original YouTube, Vimeo, or CDN file is not deleted."}
        </p>
        {inUse ? (
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {video.usedIn.map((item) => (
              <li key={`${item.href}-${item.label}`}>
                <Link
                  to={item.href}
                  className="flex items-center justify-between gap-3 py-2.5 text-sm text-ink hover:text-accent"
                >
                  {item.label}
                  <span aria-hidden="true" className="text-muted">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            className="h-9 cursor-pointer rounded-full border border-line px-3.5 text-sm text-ink hover:border-accent"
            onClick={onCancel}
          >
            Keep video
          </button>
          {inUse ? null : (
            <button
              type="button"
              className="h-9 cursor-pointer rounded-full bg-ink px-3.5 text-sm text-paper hover:bg-accent disabled:opacity-60"
              disabled={busy}
              onClick={onConfirm}
            >
              Remove video
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
