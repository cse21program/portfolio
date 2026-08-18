import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VideoPlayer, formatTimecode } from "@/features/about/VideoPlayer";

describe("formatTimecode", () => {
  it("formats minutes and hours", () => {
    expect(formatTimecode(0)).toBe("0:00");
    expect(formatTimecode(65)).toBe("1:05");
    expect(formatTimecode(3661)).toBe("1:01:01");
    expect(formatTimecode(Number.NaN)).toBe("0:00");
  });
});

describe("VideoPlayer", () => {
  beforeEach(() => {
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("exposes play, seek, mute, speed, and fullscreen controls", async () => {
    const user = userEvent.setup();
    render(<VideoPlayer src="/api/v1/media/files/intro.mp4" />);

    await user.click(screen.getByRole("button", { name: "Play Introduction video" }));
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();

    expect(screen.getByRole("slider", { name: "Seek" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mute" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Playback speed 1x" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enter fullscreen" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Playback speed 1x" }));
    expect(screen.getByRole("button", { name: "Playback speed 1.25x" })).toBeInTheDocument();
  });
});
