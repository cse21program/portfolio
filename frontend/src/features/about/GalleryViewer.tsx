import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";

const LOAD_WINDOW = 1;
const PREVIEW_LIMIT = 5;

function createLoadQueue(limit: number) {
  let active = 0;
  const waiting: Array<() => void> = [];

  return {
    enqueue(begin: () => void) {
      const run = () => {
        active += 1;
        begin();
      };
      if (active < limit) {
        run();
      } else {
        waiting.push(run);
      }
    },
    release() {
      active = Math.max(0, active - 1);
      waiting.shift()?.();
    },
  };
}

type LoadQueue = ReturnType<typeof createLoadQueue>;

function Icon({ children, className = "h-5 w-5" }: { children: ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function GalleryLightbox({
  images,
  index,
  onClose,
  onShow,
}: {
  images: string[];
  index: number;
  onClose: () => void;
  onShow: (next: number) => void;
}) {
  const labelId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const current = images[index];
  const total = images.length;

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    const active = stripRef.current?.querySelector("[data-active='true']");
    if (active instanceof HTMLElement && typeof active.scrollIntoView === "function") {
      active.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
    }
  }, [index]);

  function onDialogKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      onShow(index + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      onShow(index - 1);
    }
  }

  if (!current) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/90 p-4 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelId}
      tabIndex={-1}
      onKeyDown={onDialogKey}
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-5xl flex-col"
        onClick={(event) => event.stopPropagation()}
        onTouchStart={(event) => {
          touchStartX.current = event.changedTouches[0]?.clientX ?? null;
        }}
        onTouchEnd={(event) => {
          const start = touchStartX.current;
          const end = event.changedTouches[0]?.clientX;
          touchStartX.current = null;
          if (start === null || end === undefined) {
            return;
          }
          const delta = end - start;
          if (delta > 50) {
            onShow(index - 1);
          } else if (delta < -50) {
            onShow(index + 1);
          }
        }}
      >
        <div className="mb-3 flex items-center justify-between gap-3 text-paper">
          <div>
            <p id={labelId} className="text-sm text-paper">
              Photo {index + 1} of {total}
            </p>
            <p className="mt-0.5 hidden text-xs text-paper/55 sm:block">Swipe, or use the arrow keys</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="grid h-11 w-11 cursor-pointer place-items-center rounded-full border border-paper/20 bg-ink/50 text-paper hover:bg-paper/15"
            aria-label="Close gallery"
            onClick={onClose}
          >
            <Icon>
              <path d="M6 6l12 12M18 6 6 18" />
            </Icon>
          </button>
        </div>

        <div
          className="mb-3 h-1.5 overflow-hidden rounded-full bg-paper/20"
          role="progressbar"
          aria-label="Gallery progress"
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={index + 1}
        >
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-300"
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </div>

        <figure className="relative overflow-hidden rounded-[1.5rem] border border-paper/10 bg-ink">
          <img
            src={current}
            alt={`Gallery image ${index + 1} of ${total}`}
            className="max-h-[68vh] w-full object-contain sm:max-h-[72vh]"
            decoding="async"
            onLoad={() => {
              const next = images[(index + 1) % images.length];
              if (!next || next === current) {
                return;
              }
              const preload = new Image();
              preload.decoding = "async";
              preload.src = next;
            }}
          />
          {total > 1 ? (
            <>
              <button
                type="button"
                className="absolute top-1/2 left-3 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-paper/20 bg-ink/70 text-paper hover:bg-accent"
                aria-label="Previous image"
                onClick={() => onShow(index - 1)}
              >
                <Icon className="h-6 w-6">
                  <path d="M15 5 8 12l7 7" />
                </Icon>
              </button>
              <button
                type="button"
                className="absolute top-1/2 right-3 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-paper/20 bg-ink/70 text-paper hover:bg-accent"
                aria-label="Next image"
                onClick={() => onShow(index + 1)}
              >
                <Icon className="h-6 w-6">
                  <path d="m9 5 7 7-7 7" />
                </Icon>
              </button>
            </>
          ) : null}
        </figure>

        {total > 1 ? (
          <div
            ref={stripRef}
            className="mt-3 flex gap-2 overflow-x-auto pb-1"
            role="tablist"
            aria-label="Gallery thumbnails"
          >
            {images.map((src, imageIndex) => {
              const active = imageIndex === index;
              return (
                <button
                  key={src}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  data-active={active}
                  className={`h-16 w-20 shrink-0 overflow-hidden rounded-xl border transition ${
                    active
                      ? "border-accent ring-2 ring-accent/40"
                      : "border-paper/15 opacity-70 hover:opacity-100"
                  }`}
                  aria-label={`Go to photo ${imageIndex + 1} of ${total}`}
                  onClick={() => onShow(imageIndex)}
                >
                  {active ? (
                    <img src={src} alt="" className="h-full w-full object-cover" decoding="async" />
                  ) : (
                    <span className="grid h-full w-full place-items-center bg-paper/10 text-[11px] text-paper/45">
                      {imageIndex + 1}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

function mosaicGrid(total: number) {
  if (total === 1) {
    return "grid grid-cols-1";
  }
  if (total <= 3) {
    return "grid grid-cols-2 gap-3";
  }
  return "grid grid-cols-2 gap-3 sm:grid-cols-4";
}

function mosaicItem(total: number, index: number) {
  if (total === 3 && index === 0) {
    return "row-span-2";
  }
  if (total >= 4 && index === 0) {
    return "col-span-2 sm:row-span-2";
  }
  return undefined;
}

function mosaicTile(total: number, index: number) {
  if (total === 1) {
    return "aspect-[16/10] sm:aspect-[16/9]";
  }
  if (total === 2) {
    return "aspect-[4/3]";
  }
  if (total === 3) {
    return index === 0 ? "h-full min-h-[16rem] sm:min-h-[22rem]" : "aspect-square";
  }
  return index === 0 ? "aspect-[16/10] h-full sm:min-h-[22rem] sm:aspect-auto" : "aspect-square";
}

function MosaicPhoto({
  src,
  width,
  height,
  queue,
}: {
  src: string;
  width: number;
  height: number;
  queue: LoadQueue;
}) {
  const hostRef = useRef<HTMLSpanElement>(null);
  const slotRef = useRef({ acquired: false, released: false });
  const [ready, setReady] = useState(false);

  function releaseSlot() {
    if (slotRef.current.acquired && !slotRef.current.released) {
      slotRef.current.released = true;
      queue.release();
    }
  }

  useEffect(() => {
    const host = hostRef.current;
    let cancelled = false;
    slotRef.current = { acquired: false, released: false };
    setReady(false);

    function begin() {
      if (cancelled) {
        queue.release();
        return;
      }
      slotRef.current.acquired = true;
      setReady(true);
    }

    if (!host || typeof IntersectionObserver === "undefined") {
      queue.enqueue(begin);
      return () => {
        cancelled = true;
        releaseSlot();
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          queue.enqueue(begin);
        }
      },
      { rootMargin: "120px 0px", threshold: 0.01 },
    );
    observer.observe(host);

    return () => {
      cancelled = true;
      observer.disconnect();
      releaseSlot();
    };
  }, [queue, src]);

  return (
    <span ref={hostRef} className="absolute inset-0 bg-paper-muted">
      {ready ? (
        <img
          src={src}
          alt=""
          width={width}
          height={height}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={releaseSlot}
          onError={releaseSlot}
        />
      ) : null}
    </span>
  );
}

function AlbumOverlay({
  images,
  onClose,
  onPick,
}: {
  images: string[];
  onClose: () => void;
  onPick: (index: number) => void;
}) {
  const labelId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const queueRef = useRef(createLoadQueue(LOAD_WINDOW));
  const total = images.length;
  const countLabel = total === 1 ? "1 photo" : `${total} photos`;

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  function onDialogKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-paper"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelId}
      tabIndex={-1}
      onKeyDown={onDialogKey}
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.18em] text-accent uppercase">About</p>
            <h2 id={labelId} className="mt-2 font-display text-4xl text-ink">
              Photos
            </h2>
            <p className="mt-2 text-sm text-ink-soft">
              {countLabel}. Open any picture to view it larger.
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full border border-line bg-surface text-ink hover:border-accent"
            aria-label="Close photos"
            onClick={onClose}
          >
            <Icon>
              <path d="M6 6l12 12M18 6 6 18" />
            </Icon>
          </button>
        </div>
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((src, imageIndex) => (
            <li key={src}>
              <button
                type="button"
                className="group relative aspect-[4/5] w-full cursor-zoom-in overflow-hidden rounded-2xl border border-line bg-surface"
                onClick={() => onPick(imageIndex)}
                aria-label={`View gallery image ${imageIndex + 1} of ${total}`}
              >
                <MosaicPhoto src={src} width={640} height={800} queue={queueRef.current} />
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/35 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                <span className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-surface/95 px-3 py-1 text-xs text-ink opacity-0 shadow-sm transition group-hover:opacity-100">
                  View
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>,
    document.body,
  );
}

export function GalleryViewer({
  images,
  title,
  titleClassName = "font-display text-3xl text-ink",
}: {
  images: string[];
  title?: string;
  titleClassName?: string;
}) {
  const queueRef = useRef(createLoadQueue(LOAD_WINDOW));
  const [index, setIndex] = useState<number | null>(null);
  const [albumOpen, setAlbumOpen] = useState(false);
  const total = images.length;
  const truncated = total > PREVIEW_LIMIT;
  const tiles = truncated ? images.slice(0, PREVIEW_LIMIT) : images;
  const tileCount = tiles.length;
  const countLabel = total === 1 ? "1 photo" : `${total} photos`;

  function show(next: number) {
    if (total === 0) {
      return;
    }
    setIndex((next + total) % total);
  }

  if (total === 0) {
    return null;
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        {title ? <h2 className={titleClassName}>{title}</h2> : <span />}
        {truncated ? (
          <button
            type="button"
            className="cursor-pointer text-sm text-accent hover:text-accent-dark"
            onClick={() => setAlbumOpen(true)}
          >
            View all {total} photos
          </button>
        ) : (
          <p className="text-sm text-muted">{countLabel}</p>
        )}
      </div>
      <ul className={mosaicGrid(tileCount)}>
        {tiles.map((src, imageIndex) => {
          const overflow = truncated && imageIndex === tileCount - 1;
          const remaining = total - (PREVIEW_LIMIT - 1);
          return (
            <li key={src} className={mosaicItem(tileCount, imageIndex)}>
              <button
                type="button"
                className={`group relative w-full overflow-hidden rounded-2xl border border-line bg-surface ${overflow ? "cursor-pointer" : "cursor-zoom-in"} ${mosaicTile(tileCount, imageIndex)}`}
                onClick={() => (overflow ? setAlbumOpen(true) : setIndex(imageIndex))}
                aria-label={
                  overflow ? `View all ${total} photos` : `View gallery image ${imageIndex + 1} of ${total}`
                }
              >
                <MosaicPhoto
                  src={src}
                  width={imageIndex === 0 ? 1200 : 640}
                  height={imageIndex === 0 ? 750 : 800}
                  queue={queueRef.current}
                />
                {overflow ? (
                  <span className="pointer-events-none absolute inset-0 grid place-items-center bg-ink/55">
                    <span className="text-center">
                      <span className="block font-display text-3xl text-paper">+{remaining}</span>
                      <span className="mt-1 block text-sm text-paper/80">View all</span>
                    </span>
                  </span>
                ) : (
                  <>
                    <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/35 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                    <span className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-surface/95 px-3 py-1 text-xs text-ink opacity-0 shadow-sm transition group-hover:opacity-100">
                      View
                    </span>
                  </>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      {albumOpen ? (
        <AlbumOverlay images={images} onClose={() => setAlbumOpen(false)} onPick={setIndex} />
      ) : null}
      {index !== null ? (
        <GalleryLightbox images={images} index={index} onClose={() => setIndex(null)} onShow={show} />
      ) : null}
    </>
  );
}
