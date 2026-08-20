import { MemoryRouter } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiDelete, apiGet, apiPatch } from "@/lib/api";
import { AdminMediaPage } from "@/features/media/AdminMediaPage";
import type { MediaAsset } from "@/types/media";
import { expandFilters } from "../../helpers/expandFilters";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    apiGet: vi.fn(),
    apiPatch: vi.fn(),
    apiDelete: vi.fn(),
    apiUpload: vi.fn(),
  };
});

const get = vi.mocked(apiGet);
const patch = vi.mocked(apiPatch);
const del = vi.mocked(apiDelete);

const photo: MediaAsset = {
  id: "media-1",
  filename: "7f3c1b2a-4d5e-4f6a-8b9c-0d1e2f3a4b5c.png",
  originalName: "headshot.png",
  kind: "image",
  contentType: "image/png",
  sizeBytes: 1200,
  url: "/api/v1/media/files/7f3c1b2a-4d5e-4f6a-8b9c-0d1e2f3a4b5c.png",
  alt: "",
  caption: "",
  createdAt: "2026-08-20T00:00:00.000Z",
  updatedAt: "2026-08-20T00:00:00.000Z",
  usedIn: [{ label: "About", href: "/admin/portfolio" }],
};

const resume: MediaAsset = {
  ...photo,
  id: "media-2",
  filename: "8f3c1b2a-4d5e-4f6a-8b9c-0d1e2f3a4b5c.pdf",
  originalName: "cv.pdf",
  kind: "document",
  contentType: "application/pdf",
  url: "/api/v1/media/files/8f3c1b2a-4d5e-4f6a-8b9c-0d1e2f3a4b5c.pdf",
  usedIn: [],
};

describe("AdminMediaPage", () => {
  beforeEach(() => {
    get.mockReset();
    patch.mockReset();
    del.mockReset();
    get.mockResolvedValue({
      assets: [photo, resume],
      summary: { totalBytes: 2400, image: 1, video: 0, document: 1 },
    });
    patch.mockResolvedValue({ asset: { ...photo, alt: "Portrait" } });
    del.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lists the library, saves metadata, copies a URL, and removes a file", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <AdminMediaPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("button", { name: "headshot.png" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "cv.pdf" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "headshot.png" }));
    expect(await screen.findByRole("link", { name: "About" })).toBeInTheDocument();

    await user.type(screen.getByLabelText("Alt text"), "Portrait");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(patch).toHaveBeenCalledWith("/media/media-1", {
        originalName: "headshot.png",
        alt: "Portrait",
        caption: "",
      });
    });

    await user.click(screen.getByRole("button", { name: "Copy URL" }));
    expect(await screen.findByRole("button", { name: "Copied" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(screen.getByRole("heading", { name: "Can't remove headshot.png" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove file" })).not.toBeInTheDocument();
    expect(del).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Keep file" }));

    await user.click(screen.getByRole("button", { name: "cv.pdf" }));
    await user.click(screen.getByRole("button", { name: "Remove" }));
    await user.click(screen.getByRole("button", { name: "Remove file" }));
    await waitFor(() => {
      expect(del).toHaveBeenCalledWith("/media/media-2");
    });
  });

  it("filters the library by type", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AdminMediaPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("button", { name: "headshot.png" })).toBeInTheDocument();
    await expandFilters(user);
    await user.click(screen.getByRole("button", { name: "Document" }));
    expect(screen.queryByRole("button", { name: "headshot.png" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "cv.pdf" })).toBeInTheDocument();
  });

  it("renames a file without changing its URL", async () => {
    patch.mockResolvedValue({ asset: { ...photo, originalName: "portrait.png" } });
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AdminMediaPage />
      </MemoryRouter>,
    );

    await user.click(await screen.findByRole("button", { name: "headshot.png" }));
    await user.click(screen.getByRole("button", { name: "Rename" }));
    const nameField = screen.getByLabelText("Name");
    await user.clear(nameField);
    await user.type(nameField, "portrait");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(patch).toHaveBeenCalledWith("/media/media-1", {
        originalName: "portrait.png",
        alt: "",
        caption: "",
      });
    });
  });
});
