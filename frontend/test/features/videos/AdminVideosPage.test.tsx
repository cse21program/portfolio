import { MemoryRouter } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import { AdminVideosPage } from "@/features/videos/AdminVideosPage";
import type { ManagedVideo } from "@/types/video";
import { expandFilters } from "../../helpers/expandFilters";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    apiGet: vi.fn(),
    apiPost: vi.fn(),
    apiPatch: vi.fn(),
    apiDelete: vi.fn(),
    apiUpload: vi.fn(),
  };
});

const get = vi.mocked(apiGet);
const post = vi.mocked(apiPost);
const patch = vi.mocked(apiPatch);
const del = vi.mocked(apiDelete);

const intro: ManagedVideo = {
  id: "video-1",
  origin: "hosted",
  provider: "youtube",
  title: "Intro",
  url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  playUrl: null,
  embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  posterUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
  caption: "",
  sizeBytes: 0,
  usedIn: [{ label: "About", href: "/admin/portfolio" }],
  createdAt: "2026-08-21T00:00:00.000Z",
  updatedAt: "2026-08-21T00:00:00.000Z",
};

const clip: ManagedVideo = {
  ...intro,
  id: "video-2",
  origin: "upload",
  provider: "file",
  title: "demo.mp4",
  url: "/api/v1/media/files/7f3c1b2a-4d5e-4f6a-8b9c-0d1e2f3a4b5c.mp4",
  playUrl: "/api/v1/media/files/7f3c1b2a-4d5e-4f6a-8b9c-0d1e2f3a4b5c.mp4",
  embedUrl: null,
  posterUrl: null,
  usedIn: [],
};

describe("AdminVideosPage", () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    patch.mockReset();
    del.mockReset();
    get.mockResolvedValue({ videos: [intro, clip] });
    post.mockResolvedValue({ video: { ...intro, id: "video-3", title: "New clip" } });
    patch.mockResolvedValue({ video: { ...intro, title: "Studio intro" } });
    del.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lists videos, adds a URL, saves a title, and removes a video", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <AdminVideosPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("button", { name: "Intro" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "demo.mp4" })).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("YouTube, Vimeo, or https://…/video.mp4"), "https://youtu.be/dQw4w9WgXcQ");
    await user.click(screen.getByRole("button", { name: "Add URL" }));
    await waitFor(() => {
      expect(post).toHaveBeenCalledWith("/videos", { url: "https://youtu.be/dQw4w9WgXcQ", title: undefined });
    });

    await user.click(screen.getByRole("button", { name: "Intro" }));
    expect(await screen.findByRole("link", { name: "About" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Rename" }));
    const title = screen.getByLabelText("Title");
    await user.clear(title);
    await user.type(title, "Studio intro");
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(patch).toHaveBeenCalledWith("/videos/video-1", { title: "Studio intro", caption: "" });
    });

    await user.click(screen.getByRole("button", { name: "Copy URL" }));
    expect(await screen.findByRole("button", { name: "Copied" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(screen.getByRole("heading", { name: "Can't remove Studio intro" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove video" })).not.toBeInTheDocument();
    expect(del).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Keep video" }));

    await user.click(screen.getByRole("button", { name: "demo.mp4" }));
    await user.click(screen.getByRole("button", { name: "Remove" }));
    await user.click(screen.getByRole("button", { name: "Remove video" }));
    await waitFor(() => {
      expect(del).toHaveBeenCalledWith("/videos/video-2");
    });
  });

  it("filters by source", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AdminVideosPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("button", { name: "Intro" })).toBeInTheDocument();
    await expandFilters(user);
    await user.click(screen.getByRole("button", { name: "Uploaded" }));
    expect(screen.queryByRole("button", { name: "Intro" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "demo.mp4" })).toBeInTheDocument();
  });
});
