import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { FormField, FormTextArea } from "@/components/ui/FormField";
import { VideoPlayer } from "@/features/about/VideoPlayer";
import { mediaHref } from "@/lib/mediaUrl";
import {
  displayNameFor,
  formatBytes,
  formatMediaDate,
  mediaDownloadUrl,
  mediaKindLabels,
  type MediaAsset,
} from "@/types/media";

const ghostAction =
  "inline-flex h-9 items-center rounded-lg px-2.5 text-sm text-ink-soft transition hover:bg-paper-muted hover:text-ink";

export function MediaInspector({
  asset,
  busy,
  onClose,
  onSave,
  onRemove,
  onPreview,
}: {
  asset: MediaAsset;
  busy: boolean;
  onClose: () => void;
  onSave: (input: { originalName: string; alt: string; caption: string }) => Promise<void>;
  onRemove: () => void;
  onPreview: () => void;
}) {
  const titleId = useId();
  const [name, setName] = useState(asset.originalName);
  const [alt, setAlt] = useState(asset.alt);
  const [caption, setCaption] = useState(asset.caption);
  const [copied, setCopied] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const nameId = `media-name-${asset.id}`;
  const href = mediaHref(asset.url);
  const downloadHref = mediaHref(mediaDownloadUrl(asset.url, asset.originalName));
  const nextName = displayNameFor(name, asset.filename) || asset.originalName;
  const dirty = nextName !== asset.originalName || alt !== asset.alt || caption !== asset.caption;

  useEffect(() => {
    setName(asset.originalName);
    setAlt(asset.alt);
    setCaption(asset.caption);
  }, [asset.alt, asset.caption, asset.id, asset.originalName, asset.updatedAt]);

  useEffect(() => {
    closeRef.current?.focus();
  }, [asset.id]);

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(asset.url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  function focusName() {
    const field = document.getElementById(nameId);
    if (field instanceof HTMLInputElement) {
      field.focus();
      field.select();
    }
  }

  async function save() {
    if (!name.trim()) {
      return;
    }
    await onSave({ originalName: nextName, alt, caption });
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
        aria-labelledby={titleId}
      >
        <header className="flex items-center gap-3 border-b border-line px-5 py-3.5">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="truncate text-sm font-medium text-ink" title={asset.originalName}>
              {asset.originalName}
            </h2>
            <p className="mt-0.5 truncate text-xs text-muted">
              {mediaKindLabels[asset.kind]} · {formatBytes(asset.sizeBytes)} · {formatMediaDate(asset.createdAt)}
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
          <MediaInspectorPreview asset={asset} href={href} onPreview={onPreview} />

          <div className="space-y-6 px-5 py-5">
            <dl className="text-sm">
              <MetaRow label="Format" value={asset.contentType} />
              <MetaRow
                label="Usage"
                value={
                  asset.usedIn.length === 0
                    ? "Unused"
                    : `${asset.usedIn.length} placement${asset.usedIn.length === 1 ? "" : "s"}`
                }
              />
            </dl>

            <div className="space-y-3">
              <FormField
                id={nameId}
                label="Name"
                name={nameId}
                value={name}
                maxLength={180}
                hint="Shown in the library. The public URL does not change."
                onChange={(event) => setName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void save();
                  }
                }}
              />
              <FormField
                label="Alt text"
                name={`alt-${asset.id}`}
                value={alt}
                maxLength={160}
                hint="Shown when the image cannot load."
                onChange={(event) => setAlt(event.target.value)}
              />
              <FormTextArea
                label="Caption"
                name={`caption-${asset.id}`}
                value={caption}
                rows={3}
                maxLength={240}
                hint="Studio note only."
                onChange={(event) => setCaption(event.target.value)}
              />
            </div>

            <section>
              <h3 className="text-sm font-medium text-ink">Used on</h3>
              {asset.usedIn.length === 0 ? (
                <p className="mt-2 text-sm text-ink-soft">Not referenced on any published page yet.</p>
              ) : (
                <ul className="mt-2 divide-y divide-line border-y border-line">
                  {asset.usedIn.map((item) => (
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
                dirty
                  ? "border border-line text-ink hover:border-accent"
                  : "bg-ink text-paper hover:bg-accent"
              }`}
              onClick={() => void copyUrl()}
            >
              {copied ? "Copied" : "Copy URL"}
            </button>
            {dirty ? (
              <button
                type="button"
                className="h-9 cursor-pointer whitespace-nowrap rounded-full bg-ink px-3.5 text-sm text-paper hover:bg-accent disabled:opacity-60"
                disabled={busy || !name.trim()}
                onClick={() => void save()}
              >
                Save
              </button>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-x-1 gap-y-1" aria-label="File actions">
            <button type="button" className={`${ghostAction} cursor-pointer`} onClick={focusName}>
              Rename
            </button>
            <a href={href} target="_blank" rel="noreferrer" className={ghostAction}>
              Open
            </a>
            <a href={downloadHref} className={ghostAction}>
              Download
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

function MediaInspectorPreview({
  asset,
  href,
  onPreview,
}: {
  asset: MediaAsset;
  href: string;
  onPreview: () => void;
}) {
  if (asset.kind === "image") {
    return (
      <button
        type="button"
        className="group relative aspect-video w-full cursor-pointer overflow-hidden border-b border-line bg-paper-muted"
        onClick={onPreview}
      >
        <img
          src={href}
          alt={asset.alt || asset.originalName}
          className="absolute inset-0 h-full w-full object-contain"
        />
        <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-ink/55 px-4 py-2 text-left text-xs text-paper opacity-0 transition group-hover:opacity-100">
          View full size
        </span>
      </button>
    );
  }
  if (asset.kind === "video") {
    return (
      <div className="overflow-hidden border-b border-line bg-ink">
        <VideoPlayer src={href} title={asset.originalName} className="rounded-none" />
      </div>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="grid h-40 place-items-center border-b border-line bg-paper text-sm text-ink-soft hover:text-ink"
    >
      PDF · Open preview
    </a>
  );
}

export function MediaConfirmRemove({
  asset,
  busy,
  onCancel,
  onConfirm,
}: {
  asset: MediaAsset;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const titleId = useId();
  const inUse = asset.usedIn.length > 0;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-ink/45 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-[0_16px_40px_rgb(26_22_18/0.12)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className="font-display text-2xl text-ink">
          {inUse ? `Can't remove ${asset.originalName}` : `Remove ${asset.originalName}?`}
        </h2>
        <p className="mt-3 text-sm leading-7 text-ink-soft">
          {inUse
            ? `This file is used on ${asset.usedIn.map((item) => item.label).join(", ")}. Remove it from those pages first.`
            : "This removes the file from the library and from storage. Pages that paste the URL later will not find it."}
        </p>
        {inUse ? (
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {asset.usedIn.map((item) => (
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
            Keep file
          </button>
          {inUse ? null : (
            <button
              type="button"
              className="h-9 cursor-pointer rounded-full bg-ink px-3.5 text-sm text-paper hover:bg-accent disabled:opacity-60"
              disabled={busy}
              onClick={onConfirm}
            >
              Remove file
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
