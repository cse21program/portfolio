import { useEffect, useId, useRef, useState, type ChangeEvent, type DragEvent, type KeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ApiRequestError, apiUpload } from "@/lib/api";
import { VideoPlayer } from "@/features/about/VideoPlayer";
import { GalleryLightbox } from "@/features/about/GalleryViewer";
import type { GalleryPhoto } from "@/types/about";

type UploadedFile = {
  url: string;
  kind: "image" | "video";
};

const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif";
const VIDEO_ACCEPT = "video/mp4,video/webm,.mp4,.webm";
const GALLERY_MAX = 24;
const PREVIEW_LIMIT = 5;
const IMAGE_MAX_BYTES = 5 * 1024 * 1024;

function errorMessage(caught: unknown, fallback: string) {
  if (caught instanceof ApiRequestError) {
    return caught.message;
  }
  return fallback;
}

async function uploadFile(file: File, kind: "image" | "video") {
  return apiUpload<UploadedFile>(`/media?kind=${kind}`, file);
}

function FileButton({
  id,
  label,
  accept,
  multiple,
  disabled,
  variant = "outline",
  onPick,
}: {
  id: string;
  label: string;
  accept: string;
  multiple?: boolean;
  disabled?: boolean;
  variant?: "outline" | "solid";
  onPick: (files: FileList) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (files && files.length > 0) {
      onPick(files);
    }
    event.target.value = "";
  }

  return (
    <>
      <input
        ref={inputRef}
        id={id}
        className="sr-only"
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={handleChange}
      />
      <button
        className={
          variant === "solid"
            ? "cursor-pointer rounded-full bg-ink px-4 py-2 text-sm text-paper hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
            : "cursor-pointer rounded-full border border-line bg-surface px-4 py-2 text-sm text-ink hover:border-accent disabled:cursor-not-allowed disabled:opacity-60"
        }
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        {label}
      </button>
    </>
  );
}

function PrintMat({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`overflow-hidden rounded-[1.4rem] border border-line bg-surface p-1.5 shadow-[0_12px_28px_rgb(26_22_18/0.06)] ${className}`}
    >
      {children}
    </div>
  );
}

function GhostButton({
  children,
  disabled,
  onClick,
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="cursor-pointer rounded-full px-4 py-2 text-sm text-muted hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
      type="button"
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function useImageUpload(onChange: (url: string | null) => void) {
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function onPick(files: FileList) {
    const file = files[0];
    if (!file) {
      return;
    }
    setBusy(true);
    setUploadError(null);
    try {
      const uploaded = await uploadFile(file, "image");
      onChange(uploaded.url);
    } catch (caught) {
      setUploadError(errorMessage(caught, "Could not upload that image"));
    } finally {
      setBusy(false);
    }
  }

  return { busy, uploadError, setUploadError, onPick };
}

function StageActions({
  fieldId,
  hasValue,
  busy,
  onPick,
  onRemove,
}: {
  fieldId: string;
  hasValue: boolean;
  busy: boolean;
  onPick: (files: FileList) => void;
  onRemove: () => void;
}) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <FileButton
        id={fieldId}
        label={hasValue ? (busy ? "Uploading…" : "Replace from device") : busy ? "Uploading…" : "Choose from device"}
        accept={IMAGE_ACCEPT}
        disabled={busy}
        variant={hasValue ? "outline" : "solid"}
        onPick={onPick}
      />
      {hasValue ? (
        <GhostButton disabled={busy} onClick={onRemove}>
          Remove
        </GhostButton>
      ) : null}
    </div>
  );
}

export function IdentityStage({
  profileUrl,
  coverUrl,
  onProfileChange,
  onCoverChange,
  profileError,
  coverError,
}: {
  profileUrl: string | null;
  coverUrl: string | null;
  onProfileChange: (url: string | null) => void;
  onCoverChange: (url: string | null) => void;
  profileError?: string;
  coverError?: string;
}) {
  const profile = useImageUpload(onProfileChange);
  const cover = useImageUpload(onCoverChange);
  const profileMessage = profileError ?? profile.uploadError ?? undefined;
  const coverMessage = coverError ?? cover.uploadError ?? undefined;

  return (
    <figure className="overflow-hidden rounded-[1.75rem] border border-line bg-surface">
      <div className="relative aspect-[16/9] bg-paper-muted sm:aspect-[16/7]">
        {coverUrl ? (
          <img src={coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <>
            <div className="pointer-events-none absolute -top-10 left-1/3 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
            <div className="pointer-events-none absolute right-4 bottom-4 h-28 w-28 rounded-full bg-surface blur-2xl" />
            <p className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full border border-line bg-surface/85 px-3 py-1 text-xs text-muted">
              No cover image
            </p>
          </>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/45 via-ink/10 to-transparent" />

        <div className="absolute bottom-4 left-4 sm:bottom-5 sm:left-5">
          <div className="rounded-[1.35rem] border-[3px] border-paper bg-surface p-1 shadow-[0_18px_40px_rgb(26_22_18/0.28)]">
            {profileUrl ? (
              <img
                src={profileUrl}
                alt=""
                className="aspect-[3/4] h-36 w-28 rounded-[1.05rem] object-cover object-top sm:h-44 sm:w-32"
              />
            ) : (
              <div className="grid aspect-[3/4] h-36 w-28 place-items-center rounded-[1.05rem] border border-dashed border-line bg-paper sm:h-44 sm:w-32">
                <p className="px-2 text-center text-xs leading-5 text-muted">No portrait yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <figcaption className="grid gap-5 border-t border-line bg-paper-muted/40 p-4 sm:grid-cols-2 sm:p-5">
        <div>
          <p className="text-[11px] tracking-[0.18em] text-accent uppercase">Portrait</p>
          <label className="mt-1 block text-sm font-medium text-ink" htmlFor="profile-photo">
            Profile photo
          </label>
          <p className="mt-1 text-xs leading-5 text-muted">The face on the About hero.</p>
          <StageActions
            fieldId="profile-photo"
            hasValue={Boolean(profileUrl)}
            busy={profile.busy}
            onPick={profile.onPick}
            onRemove={() => {
              profile.setUploadError(null);
              onProfileChange(null);
            }}
          />
          {profileMessage ? (
            <p className="mt-2 text-sm text-accent" role="alert">
              {profileMessage}
            </p>
          ) : null}
        </div>
        <div>
          <p className="text-[11px] tracking-[0.18em] text-accent uppercase">Banner</p>
          <label className="mt-1 block text-sm font-medium text-ink" htmlFor="cover-image">
            Cover image
          </label>
          <p className="mt-1 text-xs leading-5 text-muted">Wide wash behind the hero. Optional.</p>
          <StageActions
            fieldId="cover-image"
            hasValue={Boolean(coverUrl)}
            busy={cover.busy}
            onPick={cover.onPick}
            onRemove={() => {
              cover.setUploadError(null);
              onCoverChange(null);
            }}
          />
          {coverMessage ? (
            <p className="mt-2 text-sm text-accent" role="alert">
              {coverMessage}
            </p>
          ) : null}
        </div>
      </figcaption>
    </figure>
  );
}

export function VideoPicker({
  label,
  hint,
  error,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  error?: string;
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fieldId = label.toLowerCase().replace(/\s+/g, "-");
  const message = error ?? uploadError ?? undefined;

  async function onPick(files: FileList) {
    const file = files[0];
    if (!file) {
      return;
    }
    setBusy(true);
    setUploadError(null);
    try {
      const uploaded = await uploadFile(file, "video");
      onChange(uploaded.url);
    } catch (caught) {
      setUploadError(errorMessage(caught, "Could not upload that video"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <label className="text-sm font-medium text-ink" htmlFor={fieldId}>
          {label}
        </label>
        <div className="flex flex-wrap gap-2">
          <FileButton
            id={fieldId}
            label={value ? (busy ? "Uploading…" : "Replace from device") : busy ? "Uploading…" : "Choose from device"}
            accept={VIDEO_ACCEPT}
            disabled={busy}
            variant={value ? "outline" : "solid"}
            onPick={onPick}
          />
          {value ? (
            <GhostButton
              disabled={busy}
              onClick={() => {
                setUploadError(null);
                onChange(null);
              }}
            >
              Remove
            </GhostButton>
          ) : null}
        </div>
      </div>
      {value ? (
        <PrintMat>
          <div className="overflow-hidden rounded-[1.05rem]">
            <VideoPlayer src={value} title="Intro video preview" />
          </div>
        </PrintMat>
      ) : (
        <div className="grid aspect-video place-items-center rounded-[1.4rem] border border-dashed border-line bg-paper/70 px-4 text-center">
          <p className="text-sm text-muted">No video selected</p>
        </div>
      )}
      {message ? (
        <p className="text-sm text-accent" role="alert">
          {message}
        </p>
      ) : hint ? (
        <p className="text-sm text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

type PendingUpload = {
  id: string;
  file: File;
  preview: string;
  error?: string;
};

function isImageFile(file: File) {
  return file.type.startsWith("image/") || /\.(jpe?g|png|webp|gif)$/i.test(file.name);
}

function moveItem<T>(values: T[], from: number, to: number) {
  if (to < 0 || to >= values.length || from === to) {
    return values;
  }
  const next = [...values];
  const [item] = next.splice(from, 1);
  if (!item) {
    return values;
  }
  next.splice(to, 0, item);
  return next;
}

function TileControl({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      className="grid h-8 w-8 place-items-center rounded-full bg-surface/95 text-ink shadow-sm hover:bg-paper disabled:opacity-40"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClick();
      }}
    >
      {children}
    </button>
  );
}

function PhotoAction({
  label,
  pressed,
  onClick,
}: {
  label: string;
  pressed?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      draggable={false}
      aria-pressed={pressed}
      className={`cursor-pointer rounded-full px-2.5 py-1 text-xs ${
        pressed ? "bg-ink text-paper" : "bg-surface text-ink hover:bg-paper"
      }`}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClick();
      }}
    >
      {label}
    </button>
  );
}

function PhotoCard({
  photo,
  index,
  total,
  featured,
  onMove,
  onTogglePrivate,
  onRemove,
  onView,
}: {
  photo: GalleryPhoto;
  index: number;
  total: number;
  featured: boolean;
  onMove: (from: number, to: number) => void;
  onTogglePrivate: (index: number) => void;
  onRemove: (index: number) => void;
  onView: (index: number) => void;
}) {
  return (
    <li
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
      }}
      onDrop={(event) => {
        const from = Number(event.dataTransfer.getData("text/plain"));
        if (Number.isInteger(from) && event.dataTransfer.files.length === 0) {
          event.preventDefault();
          event.stopPropagation();
          onMove(from, index);
        }
      }}
    >
      <figure className="overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="group relative">
          <button
            type="button"
            className="block w-full cursor-zoom-in"
            aria-label={`View gallery image ${index + 1} of ${total}`}
            onClick={() => onView(index)}
          >
            <img
              src={photo.url}
              alt=""
              width={800}
              height={800}
              draggable={false}
              className={`aspect-square w-full object-cover ${photo.private ? "opacity-70" : ""}`}
              loading="lazy"
              decoding="async"
            />
          </button>
          <div className="pointer-events-none absolute top-2 left-2 flex flex-wrap gap-1">
            {photo.private ? (
              <span className="rounded-full bg-ink/80 px-2.5 py-1 text-[11px] text-paper">Private</span>
            ) : featured ? (
              <span className="rounded-full bg-accent px-2.5 py-1 text-[11px] text-paper">Featured</span>
            ) : (
              <span className="rounded-full bg-surface/95 px-2.5 py-1 text-[11px] text-ink">
                {index + 1}
              </span>
            )}
          </div>
          <div className="absolute top-2 right-2 flex gap-1">
            <TileControl
              label="Move earlier"
              disabled={index === 0}
              onClick={() => onMove(index, index - 1)}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <path
                  d="M15 5 8 12l7 7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </TileControl>
            <TileControl
              label="Move later"
              disabled={index === total - 1}
              onClick={() => onMove(index, index + 1)}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <path
                  d="m9 5 7 7-7 7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </TileControl>
          </div>
          <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center gap-1.5 bg-gradient-to-t from-ink/75 via-ink/35 to-transparent p-2 pt-8">
            <button
              type="button"
              draggable
              aria-label="Drag to reorder"
              className="grid h-7 w-7 cursor-grab place-items-center rounded-full bg-surface/95 text-ink active:cursor-grabbing"
              onDragStart={(event) => {
                event.dataTransfer.setData("text/plain", String(index));
                event.dataTransfer.effectAllowed = "move";
              }}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <path
                  d="M8 7h.01M8 12h.01M8 17h.01M16 7h.01M16 12h.01M16 17h.01"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <PhotoAction
              label={photo.private ? "Make public" : "Make private"}
              pressed={photo.private}
              onClick={() => onTogglePrivate(index)}
            />
            <button
              className="ml-auto cursor-pointer rounded-full px-2.5 py-1 text-xs text-paper hover:bg-surface/20"
              type="button"
              onClick={() => onRemove(index)}
            >
              Remove
            </button>
          </div>
        </div>
      </figure>
    </li>
  );
}

function PendingCard({
  item,
  onRetry,
  onDismiss,
}: {
  item: PendingUpload;
  onRetry: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  return (
    <li>
      <figure className="relative overflow-hidden rounded-2xl border border-line bg-surface">
        <img src={item.preview} alt="" className="aspect-square w-full object-cover opacity-70" />
        <figcaption className="absolute inset-x-0 bottom-0 bg-ink/70 px-3 py-2 text-xs text-paper">
          {item.error ? item.error : `Uploading ${item.file.name}`}
        </figcaption>
        {item.error ? (
          <div className="absolute top-2 right-2 flex gap-1">
            <button
              className="rounded-full bg-surface/95 px-2.5 py-1 text-xs text-ink"
              type="button"
              onClick={() => onRetry(item.id)}
            >
              Retry
            </button>
            <button
              className="rounded-full bg-surface/95 px-2.5 py-1 text-xs text-ink"
              type="button"
              onClick={() => onDismiss(item.id)}
            >
              Dismiss
            </button>
          </div>
        ) : (
          <span className="absolute top-2 left-2 rounded-full bg-accent px-2.5 py-1 text-[11px] text-paper">
            Uploading
          </span>
        )}
      </figure>
    </li>
  );
}

export function GalleryPicker({
  label,
  hint,
  error,
  photos,
  onChange,
}: {
  label: string;
  hint?: string;
  error?: string;
  photos: GalleryPhoto[];
  onChange: (photos: GalleryPhoto[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const pendingRef = useRef<PendingUpload[]>([]);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [albumOpen, setAlbumOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const albumLabelId = useId();
  const albumCloseRef = useRef<HTMLButtonElement>(null);
  const fieldId = label.toLowerCase().replace(/\s+/g, "-");
  const message = error ?? uploadError ?? undefined;
  const full = photos.length >= GALLERY_MAX;
  const firstPublicIndex = photos.findIndex((photo) => !photo.private);
  const truncated = photos.length > PREVIEW_LIMIT;
  const previewIndexes = truncated
    ? photos.slice(0, PREVIEW_LIMIT - 1).map((_, index) => index)
    : photos.map((_, index) => index);
  const overflowPhoto = truncated ? photos[PREVIEW_LIMIT - 1] : undefined;
  const remaining = photos.length - (PREVIEW_LIMIT - 1);
  const urls = photos.map((photo) => photo.url);
  pendingRef.current = pending;

  useEffect(() => {
    return () => {
      for (const item of pendingRef.current) {
        URL.revokeObjectURL(item.preview);
      }
    };
  }, []);

  useEffect(() => {
    if (!albumOpen) {
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    albumCloseRef.current?.focus();
    return () => {
      document.body.style.overflow = previous;
    };
  }, [albumOpen]);

  useEffect(() => {
    if (albumOpen && photos.length <= PREVIEW_LIMIT) {
      setAlbumOpen(false);
    }
  }, [albumOpen, photos.length]);

  function openPicker() {
    inputRef.current?.click();
  }

  async function uploadOne(item: PendingUpload, current: GalleryPhoto[]) {
    if (item.file.size > IMAGE_MAX_BYTES) {
      setPending((list) =>
        list.map((entry) =>
          entry.id === item.id ? { ...entry, error: "Image must be 5 MB or smaller" } : entry,
        ),
      );
      return current;
    }

    try {
      const uploaded = await uploadFile(item.file, "image");
      URL.revokeObjectURL(item.preview);
      setPending((list) => list.filter((entry) => entry.id !== item.id));
      if (current.some((photo) => photo.url === uploaded.url)) {
        return current;
      }
      const next = [...current, { url: uploaded.url, private: false }];
      onChange(next);
      return next;
    } catch (caught) {
      setPending((list) =>
        list.map((entry) =>
          entry.id === item.id
            ? { ...entry, error: errorMessage(caught, "Could not upload that image") }
            : entry,
        ),
      );
      return current;
    }
  }

  async function addFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList).filter(isImageFile);
    if (files.length === 0) {
      setUploadError("Use a JPEG, PNG, WebP, or GIF image");
      return;
    }

    setUploadError(null);
    const slots = Math.max(0, GALLERY_MAX - photos.length);
    const selected = files.slice(0, slots);
    if (selected.length === 0) {
      setUploadError("Gallery is full (24 photos)");
      return;
    }
    if (files.length > selected.length) {
      setUploadError(`Only ${selected.length} more photo${selected.length === 1 ? "" : "s"} can be added`);
    }

    const items: PendingUpload[] = selected.map((file, index) => ({
      id: `${file.name}-${file.size}-${index}-${Date.now()}`,
      file,
      preview: URL.createObjectURL(file),
    }));
    setPending((list) => [...list, ...items]);
    setBusy(true);
    let current = [...photos];
    for (const item of items) {
      current = await uploadOne(item, current);
    }
    setBusy(false);
  }

  function removeAt(index: number) {
    onChange(photos.filter((_, itemIndex) => itemIndex !== index));
  }

  function togglePrivate(index: number) {
    onChange(
      photos.map((photo, itemIndex) =>
        itemIndex === index ? { ...photo, private: !photo.private } : photo,
      ),
    );
  }

  function showLightbox(next: number) {
    if (photos.length === 0) {
      return;
    }
    setLightboxIndex((next + photos.length) % photos.length);
  }

  function photoCard(index: number) {
    const photo = photos[index];
    if (!photo) {
      return null;
    }
    return (
      <PhotoCard
        key={photo.url}
        photo={photo}
        index={index}
        total={photos.length}
        featured={index === firstPublicIndex}
        onMove={(from, to) => onChange(moveItem(photos, from, to))}
        onTogglePrivate={togglePrivate}
        onRemove={removeAt}
        onView={setLightboxIndex}
      />
    );
  }

  function dismissPending(id: string) {
    setPending((list) => {
      const item = list.find((entry) => entry.id === id);
      if (item) {
        URL.revokeObjectURL(item.preview);
      }
      return list.filter((entry) => entry.id !== id);
    });
  }

  async function retryPending(id: string) {
    const item = pending.find((entry) => entry.id === id);
    if (!item) {
      return;
    }
    setPending((list) =>
      list.map((entry) => (entry.id === id ? { ...entry, error: undefined } : entry)),
    );
    setBusy(true);
    await uploadOne(item, photos);
    setBusy(false);
  }

  function onZoneDragEnter(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    dragDepth.current += 1;
    setDragging(true);
  }

  function onZoneDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = Array.from(event.dataTransfer.types).includes("Files")
      ? "copy"
      : "move";
  }

  function onZoneDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    dragDepth.current -= 1;
    if (dragDepth.current <= 0) {
      dragDepth.current = 0;
      setDragging(false);
    }
  }

  function onZoneDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    if (event.dataTransfer.files.length > 0) {
      void addFiles(event.dataTransfer.files);
    }
  }

  const privateCount = photos.filter((photo) => photo.private).length;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] tracking-[0.18em] text-accent uppercase">Album</p>
          <label className="mt-1.5 block font-display text-xl text-ink" htmlFor={fieldId}>
            {label}
          </label>
          <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-line bg-paper-muted/70 px-2.5 py-1 text-xs text-ink-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
            {photos.length}/{GALLERY_MAX} photos
            {privateCount > 0 ? ` · ${privateCount} private` : ""}
            {busy ? " · Uploading…" : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {truncated ? (
            <button
              className="cursor-pointer rounded-full border border-line bg-surface px-4 py-2 text-sm text-ink hover:border-accent"
              type="button"
              onClick={() => setAlbumOpen(true)}
            >
              View all {photos.length} photos
            </button>
          ) : null}
          <button
            className="cursor-pointer rounded-full bg-ink px-4 py-2 text-sm text-paper hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            disabled={busy || full}
            onClick={openPicker}
          >
            {busy ? "Uploading…" : "Add from device"}
          </button>
        </div>
      </div>
      <input
        ref={inputRef}
        id={fieldId}
        className="sr-only"
        type="file"
        accept={IMAGE_ACCEPT}
        multiple
        disabled={busy || full}
        onChange={(event) => {
          if (event.target.files && event.target.files.length > 0) {
            void addFiles(event.target.files);
          }
          event.target.value = "";
        }}
      />

      <div
        className={`mt-4 rounded-[1.4rem] border border-dashed p-3 transition sm:p-4 ${
          dragging ? "border-accent bg-accent/10" : "border-line bg-surface/70"
        }`}
        onDragEnter={onZoneDragEnter}
        onDragOver={onZoneDragOver}
        onDragLeave={onZoneDragLeave}
        onDrop={onZoneDrop}
      >
        {photos.length === 0 && pending.length === 0 ? (
          <button
            type="button"
            className="flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl px-4 py-12 text-center"
            onClick={openPicker}
            disabled={busy || full}
          >
            <span className="font-display text-xl text-ink">Drop photos here</span>
            <span className="mt-2 max-w-sm text-sm leading-6 text-ink-soft">
              Public photos appear on About. Mark any as private. JPEG, PNG, WebP, or GIF · up to 5 MB
              each.
            </span>
            <span className="mt-4 rounded-full bg-ink px-4 py-2 text-sm text-paper hover:bg-accent">
              Choose from device
            </span>
          </button>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {previewIndexes.map((index) => photoCard(index))}
            {overflowPhoto ? (
              <li>
                <button
                  type="button"
                  className="group relative aspect-square w-full cursor-pointer overflow-hidden rounded-2xl border border-line bg-surface"
                  onClick={() => setAlbumOpen(true)}
                  aria-label={`View all ${photos.length} photos`}
                >
                  <img
                    src={overflowPhoto.url}
                    alt=""
                    className="h-full w-full object-cover"
                    draggable={false}
                  />
                  <span className="pointer-events-none absolute inset-0 grid place-items-center bg-ink/55">
                    <span className="text-center">
                      <span className="block font-display text-3xl text-paper">+{remaining}</span>
                      <span className="mt-1 block text-sm text-paper/80">View all</span>
                    </span>
                  </span>
                </button>
              </li>
            ) : null}
            {pending.map((item) => (
              <PendingCard
                key={item.id}
                item={item}
                onRetry={(id) => void retryPending(id)}
                onDismiss={dismissPending}
              />
            ))}
          </ul>
        )}
      </div>

      {albumOpen
        ? createPortal(
            <div
              className="fixed inset-0 z-50 overflow-y-auto bg-paper"
              role="dialog"
              aria-modal="true"
              aria-labelledby={albumLabelId}
              tabIndex={-1}
              onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
                if (event.key === "Escape" && lightboxIndex === null) {
                  event.preventDefault();
                  setAlbumOpen(false);
                }
              }}
            >
              <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs tracking-[0.18em] text-accent uppercase">Studio</p>
                    <h2 id={albumLabelId} className="mt-2 font-display text-4xl text-ink">
                      Gallery
                    </h2>
                    <p className="mt-2 text-sm text-ink-soft">
                      {photos.length}/{GALLERY_MAX} photos
                      {privateCount > 0 ? ` · ${privateCount} private` : ""}. Open a photo to view it
                      larger, or edit it here.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="cursor-pointer rounded-full border border-line bg-surface px-4 py-2 text-sm text-ink hover:border-accent disabled:cursor-not-allowed disabled:opacity-60"
                      type="button"
                      disabled={busy || full}
                      onClick={openPicker}
                    >
                      {busy ? "Uploading…" : "Add from device"}
                    </button>
                    <button
                      ref={albumCloseRef}
                      type="button"
                      className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full border border-line bg-surface text-ink hover:border-accent"
                      aria-label="Close gallery"
                      onClick={() => setAlbumOpen(false)}
                    >
                      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                        <path
                          d="M6 6l12 12M18 6 6 18"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {photos.map((_, index) => photoCard(index))}
                  {pending.map((item) => (
                    <PendingCard
                      key={item.id}
                      item={item}
                      onRetry={(id) => void retryPending(id)}
                      onDismiss={dismissPending}
                    />
                  ))}
                </ul>
              </div>
            </div>,
            document.body,
          )
        : null}

      {lightboxIndex !== null ? (
        <GalleryLightbox
          images={urls}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onShow={showLightbox}
        />
      ) : null}

      {message ? (
        <p className="mt-3 text-sm text-accent" role="alert">
          {message}
        </p>
      ) : (
        <p className="mt-3 text-sm text-muted">
          {hint ??
            "Private photos are hidden on About as soon as you click Make private. View all keeps every photo on this page."}
        </p>
      )}
    </div>
  );
}
