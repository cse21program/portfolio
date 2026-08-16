import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";

export function formatTimecode(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = total % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
  }
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

const RATES = [0.75, 1, 1.25, 1.5, 2];
const SKIP_SECONDS = 10;

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

function ControlButton({
  label,
  onClick,
  children,
  className = "",
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`grid h-10 w-10 cursor-pointer place-items-center rounded-full text-paper hover:bg-paper/15 ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function percent(part: number, whole: number) {
  if (!whole) {
    return 0;
  }
  return Math.min(100, Math.max(0, (part / whole) * 100));
}

function SeekBar({
  currentTime,
  duration,
  buffered,
  disabled,
  onSeek,
}: {
  currentTime: number;
  duration: number;
  buffered: number;
  disabled?: boolean;
  onSeek: (time: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const [hoverRatio, setHoverRatio] = useState<number | null>(null);

  function ratioFromClientX(clientX: number) {
    const track = trackRef.current;
    if (!track || !duration) {
      return 0;
    }
    const rect = track.getBoundingClientRect();
    return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  }

  function seekFromPointer(event: PointerEvent<HTMLDivElement>) {
    onSeek(ratioFromClientX(event.clientX) * duration);
  }

  return (
    <div
      ref={trackRef}
      className="group/seek relative flex h-7 cursor-pointer items-end"
      role="slider"
      aria-label="Seek"
      aria-valuemin={0}
      aria-valuemax={duration || 0}
      aria-valuenow={Math.min(currentTime, duration || 0)}
      aria-valuetext={formatTimecode(currentTime)}
      aria-disabled={disabled || !duration}
      tabIndex={disabled || !duration ? -1 : 0}
      onPointerDown={(event) => {
        if (disabled || !duration) {
          return;
        }
        dragging.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
        seekFromPointer(event);
      }}
      onPointerMove={(event) => {
        if (disabled || !duration) {
          return;
        }
        const ratio = ratioFromClientX(event.clientX);
        setHoverRatio(ratio);
        if (dragging.current) {
          onSeek(ratio * duration);
        }
      }}
      onPointerUp={(event) => {
        dragging.current = false;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      }}
      onPointerLeave={() => {
        if (!dragging.current) {
          setHoverRatio(null);
        }
      }}
      onKeyDown={(event) => {
        if (disabled || !duration) {
          return;
        }
        if (event.key === "ArrowRight") {
          event.preventDefault();
          onSeek(Math.min(duration, currentTime + SKIP_SECONDS));
        } else if (event.key === "ArrowLeft") {
          event.preventDefault();
          onSeek(Math.max(0, currentTime - SKIP_SECONDS));
        } else if (event.key === "Home") {
          event.preventDefault();
          onSeek(0);
        } else if (event.key === "End") {
          event.preventDefault();
          onSeek(duration);
        }
      }}
    >
      <div className="relative h-1.5 w-full rounded-full bg-paper/20 transition-[height] group-hover/seek:h-2.5">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-paper/35"
          style={{ width: `${percent(buffered, duration)}%` }}
        />
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-accent"
          style={{ width: `${percent(currentTime, duration)}%` }}
        />
        <div
          className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-paper opacity-0 shadow-sm transition group-hover/seek:opacity-100"
          style={{ left: `${percent(currentTime, duration)}%` }}
        />
      </div>
      {hoverRatio !== null && duration ? (
        <span
          className="pointer-events-none absolute -top-7 -translate-x-1/2 rounded-full bg-ink px-2 py-0.5 text-[11px] tabular-nums text-paper shadow-sm"
          style={{ left: `${hoverRatio * 100}%` }}
        >
          {formatTimecode(hoverRatio * duration)}
        </span>
      ) : null}
    </div>
  );
}

export function VideoPlayer({ src, title = "Introduction video" }: { src: string; title?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<number>(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [rate, setRate] = useState(1);
  const [failed, setFailed] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [idle, setIdle] = useState(false);

  const chromeVisible = !playing || !idle;

  const sync = useCallback(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    setPlaying(!video.paused && !video.ended);
    setCurrentTime(video.currentTime);
    setDuration(Number.isFinite(video.duration) ? video.duration : 0);
    setMuted(video.muted);
    setVolume(video.volume);
    try {
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1));
      }
    } catch {
      /* buffered range can be unavailable while loading */
    }
  }, []);

  function scheduleHide() {
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setIdle(true), 2400);
  }

  function showChrome() {
    setIdle(false);
    if (videoRef.current && !videoRef.current.paused) {
      scheduleHide();
    }
  }

  useEffect(() => {
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setBuffered(0);
    setFailed(false);
    setIdle(false);
  }, [src]);

  useEffect(() => {
    if (playing) {
      scheduleHide();
    } else {
      window.clearTimeout(hideTimer.current);
      setIdle(false);
    }
    return () => window.clearTimeout(hideTimer.current);
  }, [playing]);

  useEffect(() => {
    function onFullscreen() {
      setFullscreen(document.fullscreenElement === shellRef.current);
    }
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => document.removeEventListener("fullscreenchange", onFullscreen);
  }, []);

  async function togglePlay() {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    shellRef.current?.focus();
    if (video.paused || video.ended) {
      await video.play();
    } else {
      video.pause();
    }
    sync();
  }

  function seekTo(value: number) {
    const video = videoRef.current;
    if (!video || !Number.isFinite(value)) {
      return;
    }
    video.currentTime = value;
    setCurrentTime(value);
    showChrome();
  }

  function skip(delta: number) {
    const video = videoRef.current;
    seekTo(Math.min(video?.duration || 0, Math.max(0, (video?.currentTime ?? 0) + delta)));
  }

  function toggleMute() {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    video.muted = !video.muted;
    setMuted(video.muted);
  }

  function changeVolume(value: number) {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    video.volume = value;
    video.muted = value === 0;
    setVolume(value);
    setMuted(video.muted);
  }

  function cycleRate() {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    const index = RATES.indexOf(rate);
    const next = RATES[(index + 1) % RATES.length] ?? 1;
    video.playbackRate = next;
    setRate(next);
  }

  async function toggleFullscreen() {
    const shell = shellRef.current;
    const video = videoRef.current;
    if (!shell) {
      return;
    }
    const nativeVideo = video as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
    if (!document.fullscreenElement) {
      if (shell.requestFullscreen) {
        await shell.requestFullscreen();
      } else if (nativeVideo?.webkitEnterFullscreen) {
        nativeVideo.webkitEnterFullscreen();
      }
    } else {
      await document.exitFullscreen();
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    if (event.key === " " || event.key === "k") {
      event.preventDefault();
      void togglePlay();
    } else if (event.key === "ArrowRight" || event.key === "l") {
      event.preventDefault();
      skip(SKIP_SECONDS);
    } else if (event.key === "ArrowLeft" || event.key === "j") {
      event.preventDefault();
      skip(-SKIP_SECONDS);
    } else if (event.key === "m") {
      toggleMute();
    } else if (event.key === "f") {
      void toggleFullscreen();
    }
  }

  const remaining = Math.max(0, duration - currentTime);

  return (
    <div
      ref={shellRef}
      className={`group/player relative overflow-hidden rounded-[1.25rem] bg-ink outline-none focus-visible:ring-2 focus-visible:ring-accent ${
        playing && idle ? "cursor-none" : ""
      }`}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onMouseMove={showChrome}
      onPointerDown={showChrome}
    >
      <video
        ref={videoRef}
        className="aspect-video w-full cursor-pointer"
        src={src}
        title={title}
        playsInline
        preload="metadata"
        onClick={() => void togglePlay()}
        onPlay={sync}
        onPause={sync}
        onEnded={sync}
        onTimeUpdate={sync}
        onProgress={sync}
        onLoadedMetadata={sync}
        onVolumeChange={sync}
        onError={() => setFailed(true)}
      >
        Your browser cannot play this video.
      </video>

      {failed ? (
        <p className="absolute inset-0 grid place-items-center bg-ink/80 px-6 text-center text-sm text-paper">
          This video cannot be played.
        </p>
      ) : null}

      {!playing && !failed ? (
        <button
          type="button"
          className="absolute inset-x-0 top-0 bottom-20 z-[1] grid cursor-pointer place-items-center"
          aria-label={`Play ${title}`}
          onClick={() => void togglePlay()}
        >
          <span className="grid h-14 w-14 place-items-center rounded-full bg-accent text-paper shadow-[0_12px_32px_rgb(196_92_26/0.45)] transition group-hover/player:scale-105 sm:h-[4.5rem] sm:w-[4.5rem]">
            <Icon className="h-7 w-7 translate-x-0.5 sm:h-8 sm:w-8">
              <path d="m8 5 12 7-12 7V5Z" fill="currentColor" stroke="none" />
            </Icon>
          </span>
        </button>
      ) : null}

      {playing && !chromeVisible && !failed ? (
        <div
          className="absolute inset-x-0 bottom-0 z-[3] h-1 bg-paper/20"
          role="progressbar"
          aria-label="Playback progress"
          aria-valuemin={0}
          aria-valuemax={duration || 0}
          aria-valuenow={currentTime}
        >
          <div className="h-full bg-accent" style={{ width: `${percent(currentTime, duration)}%` }} />
        </div>
      ) : null}

      <div
        className={`absolute inset-x-0 bottom-0 z-[2] bg-gradient-to-t from-ink via-ink/85 to-transparent px-4 pt-16 pb-3 transition ${
          chromeVisible ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <SeekBar
          currentTime={currentTime}
          duration={duration}
          buffered={buffered}
          disabled={!duration}
          onSeek={seekTo}
        />
        <div className="mt-1 flex items-center gap-0.5 text-xs text-paper">
          <ControlButton label={playing ? "Pause" : "Play"} onClick={() => void togglePlay()}>
            {playing ? (
              <Icon>
                <path d="M8 5v14M16 5v14" />
              </Icon>
            ) : (
              <Icon>
                <path d="m8 5 12 7-12 7V5Z" fill="currentColor" stroke="none" />
              </Icon>
            )}
          </ControlButton>
          <ControlButton
            className="hidden sm:grid"
            label={`Back ${SKIP_SECONDS} seconds`}
            onClick={() => skip(-SKIP_SECONDS)}
          >
            <Icon>
              <path d="M11 7 6 12l5 5" />
              <path d="M18 7l-5 5 5 5" />
            </Icon>
          </ControlButton>
          <ControlButton
            className="hidden sm:grid"
            label={`Forward ${SKIP_SECONDS} seconds`}
            onClick={() => skip(SKIP_SECONDS)}
          >
            <Icon>
              <path d="m13 7 5 5-5 5" />
              <path d="m6 7 5 5-5 5" />
            </Icon>
          </ControlButton>
          <p className="px-2 tabular-nums text-paper/90">
            {formatTimecode(currentTime)}
            <span className="text-paper/50"> / {formatTimecode(duration)}</span>
            {duration ? (
              <span className="ml-2 hidden text-paper/55 sm:inline">{formatTimecode(remaining)} left</span>
            ) : null}
          </p>
          <div className="group/volume ml-1 flex items-center">
            <ControlButton label={muted || volume === 0 ? "Unmute" : "Mute"} onClick={toggleMute}>
              {muted || volume === 0 ? (
                <Icon>
                  <path d="M11 5 6 9H3v6h3l5 4V5Z" />
                  <path d="m16 10 5 5M21 10l-5 5" />
                </Icon>
              ) : (
                <Icon>
                  <path d="M11 5 6 9H3v6h3l5 4V5Z" />
                  <path d="M16 9.5a4 4 0 0 1 0 5" />
                </Icon>
              )}
            </ControlButton>
            <input
              className="h-1 w-0 cursor-pointer appearance-none rounded-full bg-paper/25 accent-accent opacity-0 transition-all group-hover/volume:w-20 group-hover/volume:opacity-100 group-focus-within/volume:w-20 group-focus-within/volume:opacity-100"
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              aria-label="Volume"
              onChange={(event) => changeVolume(Number(event.target.value))}
            />
          </div>
          <button
            type="button"
            className="ml-auto cursor-pointer rounded-full px-2.5 py-1.5 text-[11px] tracking-wide text-paper/90 hover:bg-paper/15"
            aria-label={`Playback speed ${rate}x`}
            onClick={cycleRate}
          >
            {rate === 1 ? "1×" : `${rate}×`}
          </button>
          <ControlButton
            label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            onClick={() => void toggleFullscreen()}
          >
            {fullscreen ? (
              <Icon>
                <path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5" />
              </Icon>
            ) : (
              <Icon>
                <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
              </Icon>
            )}
          </ControlButton>
        </div>
      </div>
    </div>
  );
}
