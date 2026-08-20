import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterChip, FilterGroups, FilterRow, FilterSearch, FilterToolbar } from "@/components/ui/FilterBar";
import { GalleryLightbox } from "@/features/about/GalleryViewer";
import { AuthError } from "@/features/auth/AuthForm";
import { MediaConfirmRemove, MediaInspector } from "@/features/media/MediaInspector";
import { useMediaLibrary } from "@/features/media/useMediaLibrary";
import { mediaHref } from "@/lib/mediaUrl";
import {
  formatBytes,
  kindForFile,
  maxBytesFor,
  mediaKindLabels,
  mediaKinds,
  sizeLimitMessage,
  sortMedia,
  type MediaAsset,
  type MediaKind,
  type MediaSort,
} from "@/types/media";

const ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif,video/mp4,video/webm,.mp4,.webm,application/pdf,.pdf";

type KindFilter = "all" | MediaKind;

type QueueItem = {
  id: string;
  name: string;
  status: "uploading" | "done" | "error";
  error?: string;
};

function matchesQuery(asset: MediaAsset, needle: string) {
  if (!needle) {
    return true;
  }
  return [asset.originalName, asset.alt, asset.caption, asset.kind, asset.filename]
    .join(" ")
    .toLowerCase()
    .includes(needle);
}

function filesFromDrop(event: DragEvent) {
  return Array.from(event.dataTransfer?.files ?? []);
}

export function AdminMediaPage() {
  const { assets, summary, loading, error, upload, update, remove } = useMediaLibrary();
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<KindFilter>("all");
  const [sort, setSort] = useState<MediaSort>("newest");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingRemove, setPendingRemove] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [busy, setBusy] = useState("");
  const [actionError, setActionError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCount = useRef(0);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return sortMedia(
      assets.filter((item) => (kind === "all" || item.kind === kind) && matchesQuery(item, needle)),
      sort,
    );
  }, [assets, kind, query, sort]);

  const selected = assets.find((item) => item.id === selectedId) ?? null;
  const gallery = useMemo(
    () => assets.filter((item) => item.kind === "image").map((item) => mediaHref(item.url)),
    [assets],
  );
  const filtering = Boolean(query.trim() || kind !== "all" || sort !== "newest");

  function clearFilters() {
    setQuery("");
    setKind("all");
    setSort("newest");
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }
      if (lightboxIndex !== null) {
        setLightboxIndex(null);
        return;
      }
      if (pendingRemove) {
        setPendingRemove(false);
        return;
      }
      if (selectedId) {
        setSelectedId(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIndex, pendingRemove, selectedId]);

  async function onPick(files: FileList | File[]) {
    const list = Array.from(files);
    if (list.length === 0) {
      return;
    }
    setActionError("");
    const started = list.map((file, index) => ({
      id: `${file.name}-${file.size}-${index}-${Date.now()}`,
      name: file.name,
      status: "uploading" as const,
    }));
    setQueue((current) => [...started, ...current].slice(0, 8));

    for (const [index, file] of list.entries()) {
      const itemId = started[index]!.id;
      const nextKind = kindForFile(file);
      if (!nextKind) {
        setQueue((current) =>
          current.map((item) =>
            item.id === itemId
              ? { ...item, status: "error", error: "Use a JPEG, PNG, WebP, GIF, MP4, WebM, or PDF" }
              : item,
          ),
        );
        continue;
      }
      if (file.size > maxBytesFor(nextKind)) {
        setQueue((current) =>
          current.map((item) =>
            item.id === itemId ? { ...item, status: "error", error: sizeLimitMessage(nextKind) } : item,
          ),
        );
        continue;
      }
      setBusy("upload");
      try {
        const asset = await upload(file, nextKind);
        setQueue((current) =>
          current.map((item) => (item.id === itemId ? { ...item, status: "done" } : item)),
        );
        if (asset) {
          setSelectedId(asset.id);
        }
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : "Could not upload that file";
        setQueue((current) =>
          current.map((item) => (item.id === itemId ? { ...item, status: "error", error: message } : item)),
        );
        setActionError(message);
      } finally {
        setBusy("");
      }
    }
  }

  async function onSave(input: { originalName: string; alt: string; caption: string }) {
    if (!selected) {
      return;
    }
    setActionError("");
    setBusy(selected.id);
    try {
      await update(selected.id, input);
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : "Could not save metadata");
    } finally {
      setBusy("");
    }
  }

  async function onRemove() {
    if (!selected) {
      return;
    }
    setActionError("");
    setBusy(selected.id);
    try {
      await remove(selected.id);
      setPendingRemove(false);
      setSelectedId(null);
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : "Could not remove that file");
    } finally {
      setBusy("");
    }
  }

  return (
    <div
      className="space-y-8"
      onDragEnter={(event) => {
        event.preventDefault();
        dragCount.current += 1;
        setDragging(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        dragCount.current = Math.max(0, dragCount.current - 1);
        if (dragCount.current === 0) {
          setDragging(false);
        }
      }}
      onDrop={(event) => {
        event.preventDefault();
        dragCount.current = 0;
        setDragging(false);
        void onPick(filesFromDrop(event));
      }}
    >
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-xs tracking-[0.16em] text-accent uppercase">Studio</p>
          <h1 className="mt-2 font-display text-4xl text-ink">Media library</h1>
          <p className="mt-3 max-w-2xl text-ink-soft">
            One source of truth for every image, video, and PDF on the site. Upload once, inspect
            usage, then reuse the URL anywhere in Studio.
          </p>
        </div>
        <button
          type="button"
          className="cursor-pointer rounded-full bg-ink px-4 py-2 text-sm text-paper hover:bg-accent disabled:opacity-60"
          disabled={busy === "upload"}
          onClick={() => inputRef.current?.click()}
        >
          {busy === "upload" ? "Uploading…" : "Upload"}
        </button>
      </div>

      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[1.5rem] border border-line bg-line sm:grid-cols-5">
        <Stat label="Files" value={String(assets.length)} />
        <Stat label="Storage" value={formatBytes(summary.totalBytes)} />
        <Stat label="Images" value={String(summary.image)} />
        <Stat label="Videos" value={String(summary.video)} />
        <Stat label="Documents" value={String(summary.document)} />
      </dl>

      {error ? <AuthError>{error}</AuthError> : null}
      {actionError ? <AuthError>{actionError}</AuthError> : null}

      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept={ACCEPT}
        multiple
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          if (event.target.files && event.target.files.length > 0) {
            void onPick(event.target.files);
          }
          event.target.value = "";
        }}
      />

      <Dropzone
        dragging={dragging}
        compact={assets.length > 0}
        disabled={busy === "upload"}
        onBrowse={() => inputRef.current?.click()}
      />

      {queue.length > 0 ? (
        <ul className="space-y-2" aria-live="polite">
          {queue.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-2 text-sm"
            >
              <span className="truncate text-ink">{item.name}</span>
              <span className={item.status === "error" ? "shrink-0 text-accent" : "shrink-0 text-muted"}>
                {item.status === "uploading" ? "Uploading…" : item.status === "done" ? "Added" : item.error}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {assets.length > 0 ? (
        <FilterToolbar>
          <FilterSearch
            id="media-search"
            label="Search media"
            value={query}
            placeholder="Filename, alt text, or caption"
            resultLabel={`${visible.length} ${visible.length === 1 ? "file" : "files"}`}
            filtering={filtering}
            onChange={setQuery}
            onClear={clearFilters}
          />
          <FilterGroups count={(kind !== "all" ? 1 : 0) + (sort !== "newest" ? 1 : 0)}>
            <FilterRow label="Type" groupLabel="Filter by type">
              <FilterChip label="All" active={kind === "all"} onClick={() => setKind("all")} />
              {mediaKinds.map((item) => (
                <FilterChip
                  key={item}
                  label={mediaKindLabels[item]}
                  active={kind === item}
                  onClick={() => setKind(item)}
                />
              ))}
            </FilterRow>
            <FilterRow label="Sort" groupLabel="Sort media">
              <FilterChip label="Newest" active={sort === "newest"} onClick={() => setSort("newest")} />
              <FilterChip label="Oldest" active={sort === "oldest"} onClick={() => setSort("oldest")} />
              <FilterChip label="Largest" active={sort === "largest"} onClick={() => setSort("largest")} />
              <FilterChip label="Name" active={sort === "name"} onClick={() => setSort("name")} />
            </FilterRow>
          </FilterGroups>
        </FilterToolbar>
      ) : null}

      {loading && assets.length === 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="aspect-square animate-pulse rounded-[1.25rem] bg-paper-muted" />
          ))}
        </div>
      ) : assets.length === 0 ? (
        <EmptyState
          title="Library is empty"
          description="Drop files here or upload from About, Projects, Courses, and the rest of Studio. They all land in this library."
        />
      ) : visible.length === 0 ? (
        <EmptyState title="No files in this view" description="Try another type or clear the search." />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {visible.map((asset) => (
            <MediaTile
              key={asset.id}
              asset={asset}
              selected={asset.id === selectedId}
              onSelect={() => {
                setPendingRemove(false);
                setLightboxIndex(null);
                setSelectedId(asset.id);
              }}
            />
          ))}
        </ul>
      )}

      {selected ? (
        <MediaInspector
          asset={selected}
          busy={busy === selected.id}
          onClose={() => {
            setPendingRemove(false);
            setLightboxIndex(null);
            setSelectedId(null);
          }}
          onSave={onSave}
          onRemove={() => setPendingRemove(true)}
          onPreview={() => {
            if (!selected || selected.kind !== "image") {
              return;
            }
            const href = mediaHref(selected.url);
            const index = gallery.indexOf(href);
            setLightboxIndex(index >= 0 ? index : 0);
          }}
        />
      ) : null}

      {selected && pendingRemove ? (
        <MediaConfirmRemove
          asset={selected}
          busy={busy === selected.id}
          onCancel={() => setPendingRemove(false)}
          onConfirm={() => void onRemove()}
        />
      ) : null}

      {lightboxIndex !== null && gallery[lightboxIndex] ? (
        <GalleryLightbox
          images={gallery}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onShow={(next) => {
            if (gallery.length === 0) {
              return;
            }
            setLightboxIndex((next + gallery.length) % gallery.length);
          }}
        />
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface px-4 py-3">
      <dt className="text-xs tracking-[0.14em] text-muted uppercase">{label}</dt>
      <dd className="mt-1 font-display text-2xl text-ink">{value}</dd>
    </div>
  );
}

function Dropzone({
  dragging,
  compact,
  disabled,
  onBrowse,
}: {
  dragging: boolean;
  compact: boolean;
  disabled: boolean;
  onBrowse: () => void;
}) {
  return (
    <div
      className={`rounded-[1.5rem] border border-dashed px-5 text-center transition ${
        dragging ? "border-accent bg-accent/5" : "border-line bg-surface"
      } ${compact ? "py-4" : "py-10"}`}
    >
      <p className="font-display text-xl text-ink">{dragging ? "Drop to add to the library" : "Drop files here"}</p>
      <p className="mt-2 text-sm text-ink-soft">
        JPEG, PNG, WebP, GIF · 5 MB · MP4, WebM · 40 MB · PDF · 10 MB
      </p>
      {!compact ? (
        <button
          type="button"
          className="mt-5 cursor-pointer rounded-full border border-line px-4 py-2 text-sm text-ink hover:border-accent disabled:opacity-60"
          disabled={disabled}
          onClick={onBrowse}
        >
          Browse files
        </button>
      ) : null}
    </div>
  );
}

function MediaTile({
  asset,
  selected,
  onSelect,
}: {
  asset: MediaAsset;
  selected: boolean;
  onSelect: () => void;
}) {
  const href = mediaHref(asset.url);
  const used = asset.usedIn.length > 0;

  return (
    <li>
      <button
        type="button"
        aria-pressed={selected}
        aria-label={asset.originalName}
        className={`group w-full cursor-pointer overflow-hidden rounded-[1.25rem] border text-left transition ${
          selected
            ? "border-accent ring-2 ring-accent/30"
            : "border-line hover:border-accent/50"
        }`}
        onClick={onSelect}
      >
        <div className="relative aspect-square bg-paper">
          <MediaThumb asset={asset} href={href} />
          <span className="absolute top-2 left-2 rounded-full bg-ink/80 px-2 py-0.5 text-[10px] tracking-[0.12em] text-paper uppercase">
            {mediaKindLabels[asset.kind]}
          </span>
          {used ? (
            <span className="absolute top-2 right-2 rounded-full bg-surface/95 px-2 py-0.5 text-[10px] tracking-[0.12em] text-accent uppercase">
              In use
            </span>
          ) : null}
        </div>
        <div className="border-t border-line bg-surface px-3 py-2.5">
          <p className="truncate text-sm font-medium text-ink" title={asset.originalName}>
            {asset.originalName}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted">
            {formatBytes(asset.sizeBytes)}
            {used ? ` · ${asset.usedIn.length === 1 ? asset.usedIn[0]?.label : `${asset.usedIn.length} placements`}` : ""}
          </p>
        </div>
      </button>
    </li>
  );
}

function MediaThumb({ asset, href }: { asset: MediaAsset; href: string }) {
  if (asset.kind === "image") {
    return (
      <img src={href} alt="" className="h-full w-full object-cover" />
    );
  }
  if (asset.kind === "video") {
    return <video src={href} className="h-full w-full object-cover" muted preload="metadata" />;
  }
  return (
    <div className="grid h-full place-items-center bg-paper-muted font-display text-3xl text-ink-soft">
      PDF
    </div>
  );
}
