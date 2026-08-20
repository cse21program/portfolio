import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterChip, FilterGroups, FilterRow, FilterSearch, FilterToolbar } from "@/components/ui/FilterBar";
import { AuthError } from "@/features/auth/AuthForm";
import { VideoPlayFace } from "@/features/about/VideoPlayer";
import { VideoConfirmRemove, VideoInspector } from "@/features/videos/VideoInspector";
import { useVideoLibrary } from "@/features/videos/useVideoLibrary";
import { mediaHref } from "@/lib/mediaUrl";
import { kindForFile, maxBytesFor, sizeLimitMessage } from "@/types/media";
import {
  sortVideos,
  videoProviderLabels,
  videoProviders,
  type ManagedVideo,
  type VideoProvider,
  type VideoSort,
} from "@/types/video";

const ACCEPT = "video/mp4,video/webm,.mp4,.webm";

type ProviderFilter = "all" | VideoProvider;

function matchesQuery(video: ManagedVideo, needle: string) {
  if (!needle) {
    return true;
  }
  return [video.title, video.caption, video.provider, video.url].join(" ").toLowerCase().includes(needle);
}

export function AdminVideosPage() {
  const { videos, loading, error, addUrl, upload, update, remove } = useVideoLibrary();
  const [query, setQuery] = useState("");
  const [provider, setProvider] = useState<ProviderFilter>("all");
  const [sort, setSort] = useState<VideoSort>("newest");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingRemove, setPendingRemove] = useState(false);
  const [urlValue, setUrlValue] = useState("");
  const [busy, setBusy] = useState("");
  const [actionError, setActionError] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCount = useRef(0);

  const counts = useMemo(
    () => ({
      file: videos.filter((item) => item.provider === "file").length,
      youtube: videos.filter((item) => item.provider === "youtube").length,
      vimeo: videos.filter((item) => item.provider === "vimeo").length,
      url: videos.filter((item) => item.provider === "url").length,
    }),
    [videos],
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return sortVideos(
      videos.filter((item) => (provider === "all" || item.provider === provider) && matchesQuery(item, needle)),
      sort,
    );
  }, [videos, provider, query, sort]);

  const selected = videos.find((item) => item.id === selectedId) ?? null;
  const filtering = Boolean(query.trim() || provider !== "all" || sort !== "newest");

  function clearFilters() {
    setQuery("");
    setProvider("all");
    setSort("newest");
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") {
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
  }, [pendingRemove, selectedId]);

  async function onAddUrl(event: FormEvent) {
    event.preventDefault();
    const next = urlValue.trim();
    if (!next) {
      return;
    }
    setActionError("");
    setBusy("url");
    try {
      const video = await addUrl(next);
      setUrlValue("");
      setSelectedId(video.id);
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : "Could not add that video");
    } finally {
      setBusy("");
    }
  }

  async function onPick(files: FileList | File[]) {
    const list = Array.from(files);
    if (list.length === 0) {
      return;
    }
    setActionError("");
    for (const file of list) {
      if (kindForFile(file) !== "video") {
        setActionError("Use an MP4 or WebM video");
        return;
      }
      if (file.size > maxBytesFor("video")) {
        setActionError(sizeLimitMessage("video"));
        return;
      }
      setBusy("upload");
      try {
        await upload(file);
      } catch (caught) {
        setActionError(caught instanceof Error ? caught.message : "Could not upload that video");
        return;
      } finally {
        setBusy("");
      }
    }
  }

  async function onSave(input: { title: string; caption: string }) {
    if (!selected) {
      return;
    }
    setActionError("");
    setBusy(selected.id);
    try {
      await update(selected.id, input);
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : "Could not save that video");
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
      setActionError(caught instanceof Error ? caught.message : "Could not remove that video");
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
        void onPick(Array.from(event.dataTransfer?.files ?? []));
      }}
    >
      <div>
        <p className="text-xs tracking-[0.16em] text-accent uppercase">Studio</p>
        <h1 className="mt-2 font-display text-4xl text-ink">Videos</h1>
        <p className="mt-3 max-w-2xl text-ink-soft">
          YouTube, Vimeo, CDN links, and uploaded MP4 or WebM files — including URLs already used on
          Courses, Tutorials, About, Topics, and the rest of the site.
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[1.5rem] border border-line bg-line sm:grid-cols-5">
        <Stat label="All" value={String(videos.length)} />
        <Stat label="Uploaded" value={String(counts.file)} />
        <Stat label="YouTube" value={String(counts.youtube)} />
        <Stat label="Vimeo" value={String(counts.vimeo)} />
        <Stat label="CDN" value={String(counts.url)} />
      </dl>

      {error ? <AuthError>{error}</AuthError> : null}
      {actionError ? <AuthError>{actionError}</AuthError> : null}

      <form className="flex flex-col gap-2 sm:flex-row" onSubmit={(event) => void onAddUrl(event)}>
        <label className="min-w-0 flex-1 text-sm">
          <span className="sr-only">Video URL</span>
          <input
            value={urlValue}
            placeholder="YouTube, Vimeo, or https://…/video.mp4"
            className="h-12 w-full rounded-full border border-line bg-surface px-4 text-sm text-ink outline-none placeholder:text-muted focus:border-accent"
            onChange={(event) => setUrlValue(event.target.value)}
          />
        </label>
        <button
          type="submit"
          className="h-12 shrink-0 cursor-pointer rounded-full bg-ink px-5 text-sm text-paper hover:bg-accent disabled:opacity-60"
          disabled={busy === "url" || !urlValue.trim()}
        >
          {busy === "url" ? "Adding…" : "Add URL"}
        </button>
      </form>

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

      <div
        className={`rounded-[1.5rem] border border-dashed px-5 py-4 text-center transition ${
          dragging ? "border-accent bg-accent/5" : "border-line bg-surface"
        }`}
      >
        <p className="font-display text-xl text-ink">{dragging ? "Drop to upload" : "Drop MP4 or WebM here"}</p>
        <p className="mt-2 text-sm text-ink-soft">40 MB or smaller. Hosted platforms stay on YouTube, Vimeo, or your CDN.</p>
        <button
          type="button"
          className="mt-4 cursor-pointer rounded-full border border-line px-4 py-2 text-sm text-ink hover:border-accent disabled:opacity-60"
          disabled={busy === "upload"}
          onClick={() => inputRef.current?.click()}
        >
          {busy === "upload" ? "Uploading…" : "Upload file"}
        </button>
      </div>

      {videos.length > 0 ? (
        <FilterToolbar>
          <FilterSearch
            id="video-search"
            label="Search videos"
            value={query}
            placeholder="Title, caption, or URL"
            resultLabel={`${visible.length} ${visible.length === 1 ? "video" : "videos"}`}
            filtering={filtering}
            onChange={setQuery}
            onClear={clearFilters}
          />
          <FilterGroups count={(provider !== "all" ? 1 : 0) + (sort !== "newest" ? 1 : 0)}>
            <FilterRow label="Source" groupLabel="Filter by source">
              <FilterChip label="All" active={provider === "all"} onClick={() => setProvider("all")} />
              {videoProviders.map((item) => (
                <FilterChip
                  key={item}
                  label={videoProviderLabels[item]}
                  active={provider === item}
                  onClick={() => setProvider(item)}
                />
              ))}
            </FilterRow>
            <FilterRow label="Sort" groupLabel="Sort videos">
              <FilterChip label="Newest" active={sort === "newest"} onClick={() => setSort("newest")} />
              <FilterChip label="Oldest" active={sort === "oldest"} onClick={() => setSort("oldest")} />
              <FilterChip label="Name" active={sort === "name"} onClick={() => setSort("name")} />
            </FilterRow>
          </FilterGroups>
        </FilterToolbar>
      ) : null}

      {loading && videos.length === 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="aspect-video animate-pulse rounded-[1.25rem] bg-paper-muted" />
          ))}
        </div>
      ) : videos.length === 0 ? (
        <EmptyState
          title="No videos yet"
          description="Add a YouTube or Vimeo link, a direct MP4/WebM URL, or upload a file. URLs already used on Courses, Tutorials, About, and other pages appear here automatically."
        />
      ) : visible.length === 0 ? (
        <EmptyState title="No videos in this view" description="Try another source or clear the search." />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {visible.map((video) => (
            <VideoTile
              key={video.id}
              video={video}
              selected={video.id === selectedId}
              onSelect={() => {
                setPendingRemove(false);
                setSelectedId(video.id);
              }}
            />
          ))}
        </ul>
      )}

      {selected ? (
        <VideoInspector
          video={selected}
          busy={busy === selected.id}
          onClose={() => {
            setPendingRemove(false);
            setSelectedId(null);
          }}
          onSave={onSave}
          onRemove={() => setPendingRemove(true)}
        />
      ) : null}

      {selected && pendingRemove ? (
        <VideoConfirmRemove
          video={selected}
          busy={busy === selected.id}
          onCancel={() => setPendingRemove(false)}
          onConfirm={() => void onRemove()}
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

function VideoTile({
  video,
  selected,
  onSelect,
}: {
  video: ManagedVideo;
  selected: boolean;
  onSelect: () => void;
}) {
  const used = video.usedIn.length > 0;
  const poster = video.posterUrl;

  return (
    <li>
      <button
        type="button"
        aria-pressed={selected}
        aria-label={video.title}
        className={`group w-full cursor-pointer overflow-hidden rounded-[1.25rem] border text-left transition ${
          selected ? "border-accent ring-2 ring-accent/30" : "border-line hover:border-accent/50"
        }`}
        onClick={onSelect}
      >
        <div className="relative aspect-video bg-ink">
          {poster ? (
            <img src={poster} alt="" className="h-full w-full object-cover" />
          ) : video.playUrl ? (
            <video src={mediaHref(video.playUrl)} className="h-full w-full object-cover" muted preload="metadata" />
          ) : (
            <span className="absolute inset-0 bg-ink" />
          )}
          <span className="absolute inset-0 grid place-items-center opacity-90">
            <VideoPlayFace />
          </span>
          <span className="absolute top-2 left-2 rounded-full bg-ink/80 px-2 py-0.5 text-[10px] tracking-[0.12em] text-paper uppercase">
            {videoProviderLabels[video.provider]}
          </span>
          {used ? (
            <span className="absolute top-2 right-2 rounded-full bg-surface/95 px-2 py-0.5 text-[10px] tracking-[0.12em] text-accent uppercase">
              In use
            </span>
          ) : null}
        </div>
        <div className="border-t border-line bg-surface px-3 py-2.5">
          <p className="truncate text-sm font-medium text-ink" title={video.title}>
            {video.title}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted">
            {used ? (video.usedIn.length === 1 ? video.usedIn[0]?.label : `${video.usedIn.length} placements`) : "Unused"}
          </p>
        </div>
      </button>
    </li>
  );
}
