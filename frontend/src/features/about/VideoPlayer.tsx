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

export function VideoPlayFace() {
  return (
    <span className="relative grid h-16 w-16 place-items-center transition duration-150 group-hover:scale-105 sm:h-[4.5rem] sm:w-[4.5rem]">
      <span className="absolute inset-0 rounded-full bg-paper/20 ring-1 ring-paper/40" />
      <span className="relative grid h-14 w-14 place-items-center rounded-full bg-accent text-paper shadow-[0_10px_28px_rgb(196_92_26/0.45)] sm:h-16 sm:w-16">
        <svg viewBox="0 0 24 24" className="h-7 w-7 translate-x-0.5 sm:h-8 sm:w-8" aria-hidden="true">
          <path d="m8 5 12 7-12 7V5Z" fill="currentColor" />
        </svg>
      </span>
    </span>
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
      className={`grid h-9 w-9 cursor-pointer place-items-center rounded-full text-paper transition hover:bg-paper/15 ${className}`}
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

  const previewLeft = hoverRatio === null ? 0 : Math.min(92, Math.max(8, hoverRatio * 100));

  return (
    <div
      ref={trackRef}
      className="group/seek relative flex h-5 cursor-pointer touch-none items-center select-none"
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
      <div className="relative h-[3px] w-full rounded-full bg-paper/25 transition-[height] group-hover/seek:h-1.5">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-paper/40"
          style={{ width: `${percent(buffered, duration)}%` }}
        />
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-accent"
          style={{ width: `${percent(currentTime, duration)}%` }}
        />
        <div
          className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-paper opacity-0 shadow-sm transition group-hover/seek:opacity-100"
          style={{ left: `${percent(currentTime, duration)}%` }}
        />
      </div>
      {hoverRatio !== null && duration ? (
        <span
          className="pointer-events-none absolute -top-7 -translate-x-1/2 rounded-full bg-ink px-2 py-0.5 text-[11px] tabular-nums text-paper"
          style={{ left: `${previewLeft}%` }}
        >
          {formatTimecode(hoverRatio * duration)}
        </span>
      ) : null}
    </div>
  );
}

export function VideoPlayer({
  src,
  title = "Introduction video",
  poster,
  className = "",
}: {
  src: string;
  title?: string;
  poster?: string;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<number>(0);
  const cueTimer = useRef<number>(0);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [ended, setEnded] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [cue, setCue] = useState<"play" | "pause" | null>(null);
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
  const showPoster = Boolean(poster && !failed && !playing && (!started || ended));

  const sync = useCallback(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    setPlaying(!video.paused && !video.ended);
    setEnded(video.ended);
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
    hideTimer.current = window.setTimeout(() => setIdle(true), 2200);
  }

  function showChrome() {
    setIdle(false);
    if (videoRef.current && !videoRef.current.paused) {
      scheduleHide();
    }
  }

  function flashCue(next: "play" | "pause") {
    setCue(next);
    window.clearTimeout(cueTimer.current);
    cueTimer.current = window.setTimeout(() => setCue(null), 420);
  }

  useEffect(() => {
    setPlaying(false);
    setStarted(false);
    setEnded(false);
    setWaiting(false);
    setCue(null);
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
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreen);
      window.clearTimeout(cueTimer.current);
    };
  }, []);

  async function togglePlay() {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    shellRef.current?.focus();
    try {
      if (video.paused || video.ended) {
        if (video.ended || (video.duration && video.currentTime >= video.duration - 0.05)) {
          video.currentTime = 0;
        }
        if (started && !video.ended) {
          flashCue("play");
        }
        await video.play();
        setStarted(true);
        setEnded(false);
      } else {
        flashCue("pause");
        video.pause();
      }
    } catch {
      setFailed(true);
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
    setEnded(false);
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
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      changeVolume(Math.min(1, (muted ? 0 : volume) + 0.1));
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      changeVolume(Math.max(0, (muted ? 0 : volume) - 0.1));
    } else if (event.key === "m") {
      toggleMute();
    } else if (event.key === "f") {
      void toggleFullscreen();
    }
  }

  return (
    <div
      ref={shellRef}
      className={`group/player relative overflow-hidden bg-ink outline-none focus-visible:ring-2 focus-visible:ring-accent ${
        fullscreen ? "rounded-none" : "rounded-[1.25rem]"
      } ${playing && idle ? "cursor-none" : ""} ${className}`.trim()}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onMouseMove={showChrome}
      onPointerDown={showChrome}
    >
      <video
        ref={videoRef}
        className="aspect-video w-full cursor-pointer"
        src={src}
        poster={poster}
        title={title}
        playsInline
        preload="metadata"
        onClick={() => void togglePlay()}
        onDoubleClick={() => void toggleFullscreen()}
        onPlay={() => {
          setStarted(true);
          setWaiting(false);
          sync();
        }}
        onPause={sync}
        onEnded={() => {
          setEnded(true);
          setWaiting(false);
          sync();
        }}
        onTimeUpdate={sync}
        onProgress={sync}
        onLoadedMetadata={sync}
        onWaiting={() => setWaiting(true)}
        onPlaying={() => setWaiting(false)}
        onCanPlay={() => setWaiting(false)}
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

      {showPoster ? (
        <>
          <img
            src={poster}
            alt=""
            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          />
          <span className="pointer-events-none absolute inset-0 bg-ink/30" />
        </>
      ) : null}

      {waiting && !failed ? (
        <div className="absolute inset-0 z-[1] grid place-items-center" aria-live="polite">
          <span className="h-11 w-11 animate-spin rounded-full border-2 border-paper/25 border-t-paper" />
          <span className="sr-only">Loading video</span>
        </div>
      ) : null}

      {cue ? (
        <div className="pointer-events-none absolute inset-0 z-[2] grid place-items-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-ink/70 text-paper sm:h-16 sm:w-16">
            {cue === "pause" ? (
              <Icon className="h-7 w-7">
                <path d="M8 5v14M16 5v14" />
              </Icon>
            ) : (
              <svg viewBox="0 0 24 24" className="h-7 w-7 translate-x-0.5" aria-hidden="true">
                <path d="m8 5 12 7-12 7V5Z" fill="currentColor" />
              </svg>
            )}
          </span>
        </div>
      ) : null}

      {!playing && !failed && !waiting && !cue ? (
        <button
          type="button"
          className="absolute inset-x-0 top-0 bottom-14 z-[1] grid cursor-pointer place-items-center"
          aria-label={ended ? `Replay ${title}` : `Play ${title}`}
          onClick={() => void togglePlay()}
        >
          <VideoPlayFace />
        </button>
      ) : null}

      {playing && !chromeVisible && !failed ? (
        <div
          className="absolute inset-x-0 bottom-0 z-[3] h-[3px] bg-paper/25"
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
        className={`absolute inset-x-0 bottom-0 z-[2] bg-gradient-to-t from-ink via-ink/70 to-transparent px-3 pt-10 pb-2.5 transition ${
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
        <div className="flex items-center gap-0.5 text-[13px] text-paper">
          <ControlButton label={playing ? "Pause" : ended ? "Replay" : "Play"} onClick={() => void togglePlay()}>
            {playing ? (
              <Icon>
                <path d="M8 5v14M16 5v14" />
              </Icon>
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5 translate-x-px" aria-hidden="true">
                <path d="m8 5 12 7-12 7V5Z" fill="currentColor" />
              </svg>
            )}
          </ControlButton>
          <p className="min-w-0 px-1 tabular-nums text-paper">
            {formatTimecode(currentTime)}
            <span className="text-paper/55"> / {formatTimecode(duration)}</span>
          </p>
          <div className="ml-auto flex items-center">
            <div className="group/volume flex items-center">
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
                className="h-1 w-0 cursor-pointer appearance-none rounded-full bg-paper/30 accent-accent opacity-0 transition-all group-hover/volume:w-16 group-hover/volume:opacity-100 group-focus-within/volume:w-16 group-focus-within/volume:opacity-100"
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
              className="cursor-pointer rounded-full px-2.5 py-1.5 text-[12px] font-medium tracking-wide text-paper/90 transition hover:bg-paper/15"
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
    </div>
  );
}
