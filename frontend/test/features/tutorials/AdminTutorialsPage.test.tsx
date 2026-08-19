import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet, apiPut } from "@/lib/api";
import { AdminTutorialsPage } from "@/features/tutorials/AdminTutorialsPage";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    apiGet: vi.fn(),
    apiPut: vi.fn(),
  };
});

const get = vi.mocked(apiGet);
const put = vi.mocked(apiPut);

const seeded = {
  id: "b2e2d9f1-0000-4000-8000-000000000061",
  title: "Docker complete tutorial",
  slug: "docker-complete",
  description: "From images and containers to a deployable API stack.",
  difficulty: "Beginner",
  prerequisites: ["Docker Desktop"],
  duration: "4 hours",
  thumbnailUrl: null,
  skill: "Docker",
  relatedSkillSlugs: [],
  relatedCourseSlugs: ["production-docker"],
  price: "Free",
  free: true,
  sections: [
    {
      title: "Introduction",
      summary: "Why containers, and what problem they actually solve.",
      body: ["Containers package an app with its runtime."],
      videoUrl: null,
      images: [],
      codeSnippets: [],
      resources: [],
      downloads: [],
    },
  ],
  publishedAt: "2026-06-02",
  status: "published",
  seoTitle: "",
  seoDescription: "",
  canonicalUrl: "",
  sortOrder: 0,
};

describe("AdminTutorialsPage", () => {
  beforeEach(() => {
    get.mockReset();
    put.mockReset();
    get.mockImplementation(async (path: string) => {
      if (path.startsWith("/skills")) {
        return { skills: [] };
      }
      return { tutorials: [seeded] };
    });
    put.mockResolvedValue({
      tutorials: [{ ...seeded, title: "Docker from scratch" }],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads published records and publishes edits", async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <MemoryRouter>
        <AdminTutorialsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Tutorials" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Title")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View public page →" })).toHaveAttribute("href", "/tutorials");

    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByLabelText("Title")).toHaveValue("Docker complete tutorial");
    expect(screen.getByLabelText("Slug")).toHaveValue("docker-complete");
    await user.click(screen.getByRole("button", { name: "Collapse" }));
    expect(screen.queryByLabelText("Title")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByLabelText("Title")).toHaveValue("Docker complete tutorial");

    await user.clear(screen.getByLabelText("Title"));
    await user.type(screen.getByLabelText("Title"), "Docker from scratch");
    await user.click(screen.getByRole("button", { name: "Publish tutorials" }));

    await waitFor(() => {
      expect(put).toHaveBeenCalled();
    });

    expect(put).toHaveBeenCalledWith(
      "/tutorials",
      expect.objectContaining({
        tutorials: [
          expect.objectContaining({
            title: "Docker from scratch",
            slug: "docker-complete",
            status: "published",
            difficulty: "Beginner",
          }),
        ],
      }),
    );
    expect(await screen.findByText("Tutorials published.")).toBeInTheDocument();
  });

  it("blocks publish when a title is missing", async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <MemoryRouter>
        <AdminTutorialsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("button", { name: "Edit" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByLabelText("Title")).toBeInTheDocument();
    await user.clear(screen.getByLabelText("Title"));
    await user.click(screen.getByRole("button", { name: "Publish tutorials" }));

    expect(put).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("title must be at least 2 characters");
  });

  it("blocks publish when a new tutorial is still empty", async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <MemoryRouter>
        <AdminTutorialsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("button", { name: "Add tutorial" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add tutorial" }));
    await user.click(screen.getByRole("button", { name: "Publish tutorials" }));

    expect(put).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("title must be at least 2 characters");
  });

  it("blocks publish when two tutorials share a slug", async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <MemoryRouter>
        <AdminTutorialsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("button", { name: "Add tutorial" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add tutorial" }));
    expect(screen.getByLabelText("Title")).toHaveValue("");
    await user.type(screen.getByLabelText("Title"), "Docker copy");
    await user.clear(screen.getByLabelText("Slug"));
    await user.type(screen.getByLabelText("Slug"), "docker-complete");
    await user.clear(screen.getByLabelText("Description"));
    await user.type(screen.getByLabelText("Description"), "A second take on containers.");
    await user.type(screen.getByLabelText("Section title"), "Introduction");
    await user.click(screen.getByRole("button", { name: "Publish tutorials" }));

    expect(put).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("slug must be unique");
  });
});
