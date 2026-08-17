import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet, apiPut } from "@/lib/api";
import { AdminProjectsPage } from "@/features/projects/AdminProjectsPage";

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

const seeded = [
  {
    id: "b2e2d9f1-0000-4000-8000-000000000011",
    title: "Talk Now",
    slug: "talk-now",
    shortDescription: "A TypeScript conversation product.",
    fullDescription: "Typed conversations from the start.",
    thumbnailUrl: null,
    images: [],
    demoVideoUrl: null,
    category: "Realtime product",
    technologies: ["TypeScript", "React"],
    features: ["Conversation threads"],
    architecture: "Typed client models.",
    problem: "Messaging UIs treat state as an afterthought.",
    requirements: "Keep the domain typed.",
    solution: "Model conversations as first-class entities.",
    challenges: ["Realtime UX without overbuilding."],
    solutions: ["Type the domain first."],
    lessons: ["Type the domain before the components."],
    status: "Shipped",
    startDate: "2025",
    endDate: "2025",
    githubUrl: "https://github.com/swe-rezaul-karim/talk-now",
    liveUrl: null,
    docsUrl: null,
    featured: true,
    seoTitle: "Talk Now",
    seoDescription: "A typed conversation product.",
    sortOrder: 0,
  },
];

describe("AdminProjectsPage", () => {
  beforeEach(() => {
    get.mockReset();
    put.mockReset();
    get.mockResolvedValue({ projects: seeded });
    put.mockResolvedValue({
      projects: [{ ...seeded[0]!, title: "Talk Now Live" }],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads published records and publishes edits", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AdminProjectsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Projects" })).toBeInTheDocument();
    expect(screen.getByLabelText("Title")).toHaveValue("Talk Now");
    expect(screen.getByLabelText("Slug")).toHaveValue("talk-now");
    expect(screen.getByRole("link", { name: "View public page →" })).toHaveAttribute("href", "/projects");

    await user.clear(screen.getByLabelText("Title"));
    await user.type(screen.getByLabelText("Title"), "Talk Now Live");
    await user.click(screen.getByRole("button", { name: "Publish projects" }));

    await waitFor(() => {
      expect(put).toHaveBeenCalled();
    });

    expect(put).toHaveBeenCalledWith(
      "/projects",
      expect.objectContaining({
        projects: [
          expect.objectContaining({
            title: "Talk Now Live",
            slug: "talk-now",
            featured: true,
          }),
        ],
      }),
    );
    expect(await screen.findByText("Projects published.")).toBeInTheDocument();
  });

  it("blocks publish when a title is missing", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AdminProjectsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByLabelText("Title")).toBeInTheDocument();
    await user.clear(screen.getByLabelText("Title"));
    await user.click(screen.getByRole("button", { name: "Publish projects" }));

    expect(put).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("title must be at least 2 characters");
  });
});
