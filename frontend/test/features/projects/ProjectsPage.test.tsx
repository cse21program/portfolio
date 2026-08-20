import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectDetailPage } from "@/features/projects/ProjectDetailPage";
import { ProjectsPage } from "@/features/projects/ProjectsPage";
import { expandFilters } from "../../helpers/expandFilters";

const apiProjects = [
  {
    id: "project-1",
    title: "Talk Now",
    slug: "talk-now",
    category: "Realtime product",
    status: "Shipped",
    featured: true,
    shortDescription: "A TypeScript conversation product.",
    fullDescription: "Typed conversations from the start.",
    thumbnailUrl: null,
    images: [],
    demoVideoUrl: null,
    problem: "Messaging UIs treat state as an afterthought.",
    requirements: "Keep the domain typed.",
    solution: "Model conversations as first-class entities.",
    architecture: "Typed client models.",
    features: ["Conversation threads"],
    technologies: ["TypeScript", "React"],
    challenges: ["Realtime UX without overbuilding."],
    solutions: ["Type the domain first."],
    lessons: ["Type the domain before the components."],
    githubUrl: "https://github.com/swe-rezaul-karim/talk-now",
    liveUrl: null,
    docsUrl: null,
    startDate: "2025",
    endDate: "2025",
    seoTitle: "Talk Now case study",
    seoDescription: "A typed conversation product.",
  },
  {
    id: "project-2",
    title: "Post App",
    slug: "postapp",
    category: "Content product",
    status: "Shipped",
    featured: false,
    shortDescription: "A writing workspace with a small publishing surface.",
    fullDescription: "Keep drafting close to publishing.",
    thumbnailUrl: null,
    images: [],
    demoVideoUrl: null,
    problem: "Drafts and posts drift apart.",
    requirements: "One workspace.",
    solution: "Treat posts as the product.",
    architecture: "A focused content model.",
    features: ["Drafts"],
    technologies: ["React"],
    challenges: ["Scope"],
    solutions: ["Ship a thin surface."],
    lessons: ["Keep the model small."],
    githubUrl: null,
    liveUrl: null,
    docsUrl: null,
    startDate: "2024",
    endDate: "2025",
  },
];

function jsonResponse(data: unknown) {
  return {
    ok: true,
    status: 200,
    text: async () => JSON.stringify({ success: true, data }),
  };
}

describe("ProjectsPage", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ projects: apiProjects })));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders case studies from the API", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ProjectsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Case studies" })).toBeInTheDocument();
    expect(await screen.findByText("A TypeScript conversation product.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Talk Now" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Post App" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Filters" })).toBeInTheDocument();
    await expandFilters(user);
    expect(screen.getByRole("button", { name: "Realtime product" })).toBeInTheDocument();
  });

  it("filters case studies by search and technology", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ProjectsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("A TypeScript conversation product.")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Search projects"), "Post");
    expect(screen.queryByRole("heading", { name: "Talk Now" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Post App" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear" }));
    await expandFilters(user);
    await user.click(screen.getByRole("button", { name: "TypeScript" }));
    expect(screen.getByRole("heading", { name: "Talk Now" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Post App" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear" }));
    await user.click(
      within(screen.getByRole("group", { name: "Filter by year" })).getByRole("button", { name: "2024" }),
    );
    expect(screen.getByRole("heading", { name: "Post App" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Talk Now" })).not.toBeInTheDocument();
  });

  it("renders a case study and related projects", async () => {
    render(
      <MemoryRouter initialEntries={["/projects/talk-now"]}>
        <Routes>
          <Route path="/projects/:slug" element={<ProjectDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Talk Now" })).toBeInTheDocument();
    expect(await screen.findByText("Messaging UIs treat state as an afterthought.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "GitHub" })).toHaveAttribute(
      "href",
      "https://github.com/swe-rezaul-karim/talk-now",
    );
    expect(screen.getByRole("heading", { name: "Related projects" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Post App" })).toHaveAttribute("href", "/projects/postapp");
  });

  it("opens the photo viewer from a screenshot", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          projects: [
            {
              ...apiProjects[0],
              images: ["/media/talk-now-1.jpg", "/media/talk-now-2.jpg"],
            },
          ],
        }),
      ),
    );

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/projects/talk-now"]}>
        <Routes>
          <Route path="/projects/:slug" element={<ProjectDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(await screen.findByRole("button", { name: "View photo 1 of 2" }));
    expect(screen.getByRole("dialog", { name: /Photo 1 of 2/ })).toBeInTheDocument();
  });
});
