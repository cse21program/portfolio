import { useState, type ReactNode } from "react";
import { VideoPlayFace, VideoPlayer } from "@/features/about/VideoPlayer";
import {
  EMBED_IFRAME_ALLOW,
  toEmbedUrl,
  withAutoplay,
  youtubePosterUrl,
} from "@/features/about/videoEmbed";

function MediaFrame({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-line bg-paper p-1.5 shadow-[0_1px_0_rgb(26_22_18/0.04)] sm:p-2">
      {children}
    </div>
  );
}

export function EmbedPlayer({
  src,
  title,
  poster: customPoster,
  className = "rounded-[1.25rem]",
}: {
  src: string;
  title: string;
  poster?: string | null;
  className?: string;
}) {
  const [active, setActive] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);
  const poster = customPoster?.trim() || youtubePosterUrl(src);

  if (active) {
    return (
      <iframe
        title={title}
        src={withAutoplay(src)}
        className={`aspect-video w-full bg-ink ${className}`}
        allow={EMBED_IFRAME_ALLOW}
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    );
  }

  return (
    <button
      type="button"
      className={`group relative block aspect-video w-full cursor-pointer overflow-hidden bg-ink ${className}`}
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
      <span className="absolute inset-0 bg-ink/30 transition group-hover:bg-ink/40" />
      <span className="absolute inset-0 grid place-items-center">
        <VideoPlayFace />
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
        <EmbedPlayer src={embedSrc} title={title} poster={poster} />
      ) : (
        <VideoPlayer src={fileUrl!} title={title} poster={poster ?? undefined} />
      )}
    </MediaFrame>
  );
}

export function hasIntroVideo(embedUrl: string | null, fileUrl: string | null) {
  return Boolean((embedUrl && toEmbedUrl(embedUrl)) || fileUrl);
}
