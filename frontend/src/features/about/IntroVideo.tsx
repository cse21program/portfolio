import { useState, type ReactNode } from "react";
import { VideoPlayer } from "@/features/about/VideoPlayer";
import { toEmbedUrl, withAutoplay, youtubePosterUrl } from "@/features/about/videoEmbed";

function MediaFrame({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-line bg-surface p-1.5 shadow-[0_24px_60px_rgb(26_22_18/0.16)] sm:p-2">
      {children}
    </div>
  );
}

function EmbedPlayer({ src, title }: { src: string; title: string }) {
  const [active, setActive] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);
  const poster = youtubePosterUrl(src);

  if (active) {
    return (
      <iframe
        title={title}
        src={withAutoplay(src)}
        className="aspect-video w-full rounded-[1.25rem] bg-ink"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        sandbox="allow-scripts allow-same-origin allow-presentation"
      />
    );
  }

  return (
    <button
      type="button"
      className="group relative block aspect-video w-full cursor-pointer overflow-hidden rounded-[1.25rem] bg-ink"
      onClick={() => setActive(true)}
      aria-label={`Play ${title}`}
    >
      {poster && !posterFailed ? (
        <img
          src={poster}
          alt=""
          width={1280}
          height={720}
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          onError={() => setPosterFailed(true)}
        />
      ) : null}
      <span className="absolute inset-0 bg-ink/30 transition group-hover:bg-ink/45" />
      <span className="absolute inset-0 grid place-items-center">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-accent text-paper shadow-[0_16px_40px_rgb(196_92_26/0.5)] transition group-hover:scale-105 sm:h-[4.75rem] sm:w-[4.75rem]">
          <svg viewBox="0 0 24 24" className="h-8 w-8 translate-x-0.5" aria-hidden="true">
            <path d="m8 5 12 7-12 7V5Z" fill="currentColor" />
          </svg>
        </span>
      </span>
    </button>
  );
}

export function IntroVideo({
  embedUrl,
  fileUrl,
  title = "Introduction video",
  poster,
}: {
  embedUrl: string | null;
  fileUrl: string | null;
  title?: string;
  poster?: string | null;
}) {
  const embedSrc = embedUrl ? toEmbedUrl(embedUrl) : null;
  if (!embedSrc && !fileUrl) {
    return null;
  }

  return (
    <MediaFrame>
      {embedSrc ? (
        <EmbedPlayer src={embedSrc} title={title} />
      ) : (
        <VideoPlayer src={fileUrl!} title={title} poster={poster ?? undefined} />
      )}
    </MediaFrame>
  );
}

export function hasIntroVideo(embedUrl: string | null, fileUrl: string | null) {
  return Boolean((embedUrl && toEmbedUrl(embedUrl)) || fileUrl);
}
