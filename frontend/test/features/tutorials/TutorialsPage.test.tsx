import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TutorialDetailPage } from "@/features/tutorials/TutorialDetailPage";
import { TutorialsPage } from "@/features/tutorials/TutorialsPage";

const apiTutorials = [
  {
    id: "tutorial-1",
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
      },
      {
        title: "Installation",
        summary: "Docker Desktop and the CLI on macOS.",
        body: ["Install Docker Desktop for Mac."],
      },
    ],
    publishedAt: "2026-06-02",
    status: "published",
    seoTitle: "Docker complete",
    seoDescription: "Images, containers, Compose.",
    canonicalUrl: "",
  },
  {
    id: "tutorial-2",
    title: "Express modules that stay maintainable",
    slug: "express-modules",
    description: "A practical layout for routes, controllers, and services.",
    difficulty: "Intermediate",
    duration: "2 hours",
    thumbnailUrl: null,
    skill: "Node.js",
    relatedSkillSlugs: [],
    relatedCourseSlugs: [],
    price: "Free",
    free: true,
    sections: [{ title: "Why modules", summary: "Boundaries before frameworks." }],
    publishedAt: "2026-05-18",
    status: "published",
  },
  {
    id: "tutorial-3",
    title: "JWT access control for Spring APIs",
    slug: "jwt-api-security",
    description: "Issue short-lived access tokens and authorize on the server.",
    difficulty: "Intermediate",
    duration: "3 hours",
    thumbnailUrl: null,
    skill: "Spring Boot",
    relatedSkillSlugs: [],
    relatedCourseSlugs: ["spring-boot-masterclass"],
    price: "$29",
    free: false,
    sections: [{ title: "Access tokens", summary: "Keep them short-lived and boring." }],
    publishedAt: "2026-08-01",
    status: "published",
  },
  {
    id: "tutorial-4",
    title: "Draft walkthrough",
    slug: "draft-walkthrough",
    description: "Not ready for the public site yet.",
    difficulty: "Beginner",
    duration: "1 hour",
    thumbnailUrl: null,
    skill: "Docker",
    relatedSkillSlugs: [],
    relatedCourseSlugs: [],
    price: "$29",
    free: false,
    sections: [{ title: "Notes", summary: "Still writing." }],
    publishedAt: "2026-08-01",
    status: "draft",
  },
];

function jsonResponse(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () =>
      JSON.stringify(
        status >= 200 && status < 300
          ? { success: true, data }
          : { success: false, error: { code: "NOT_FOUND", message: "Not found" } },
      ),
  };
}

function mockFetch() {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/skills")) {
      return jsonResponse({ skills: [] });
    }
    return jsonResponse({ tutorials: apiTutorials });
  });
}

describe("TutorialsPage", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("renders published tutorials and hides drafts", async () => {
    render(
      <MemoryRouter>
        <TutorialsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Structured walkthroughs" })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Docker complete tutorial" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Express modules that stay maintainable" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "JWT access control for Spring APIs" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Draft walkthrough" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Beginner" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Intermediate" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Free" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Premium" })).toBeInTheDocument();
  });

  it("filters by search, difficulty, and skill", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <TutorialsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Docker complete tutorial" })).toBeInTheDocument();

    await user.type(screen.getByLabelText("Search tutorials"), "express");
    expect(screen.queryByRole("heading", { name: "Docker complete tutorial" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Express modules that stay maintainable" })).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Search tutorials"));
    await user.click(screen.getByRole("button", { name: "Beginner" }));
    expect(screen.getByRole("heading", { name: "Docker complete tutorial" })).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Express modules that stay maintainable" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "All" }));
    await user.click(
      within(screen.getByRole("group", { name: "Filter by skill" })).getByRole("button", {
        name: "Docker",
      }),
    );
    expect(screen.getByRole("heading", { name: "Docker complete tutorial" })).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Express modules that stay maintainable" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.getByRole("heading", { name: "Docker complete tutorial" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Express modules that stay maintainable" })).toBeInTheDocument();
  });

  it("renders a tutorial, related walkthroughs, and copies the link", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    if (navigator.clipboard && "writeText" in navigator.clipboard) {
      vi.spyOn(navigator.clipboard, "writeText").mockImplementation(writeText);
    } else {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText },
      });
    }

    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/tutorials/docker-complete"]}>
        <Routes>
          <Route path="/tutorials/:slug" element={<TutorialDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Related courses" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Docker complete tutorial" })).toBeInTheDocument();
    expect(screen.getByText("Containers package an app with its runtime.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Related" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start tutorial" }).getAttribute("href")).toMatch(
      /#section-1-introduction$/,
    );
    expect(screen.getByRole("navigation", { name: "Tutorial contents" })).toBeInTheDocument();
    await waitFor(() => {
      expect(document.title).toBe("Docker complete");
    });

    await user.click(screen.getByRole("button", { name: "Copy link" }));
    expect(writeText).toHaveBeenCalled();
    expect(await screen.findByRole("button", { name: "Link copied" })).toBeInTheDocument();

    const contents = screen.getByRole("navigation", { name: "Tutorial contents" });
    await user.click(within(contents).getByRole("link", { name: /Installation/ }));
    expect(screen.queryByText("Containers package an app with its runtime.")).not.toBeInTheDocument();
    expect(screen.getByText("Install Docker Desktop for Mac.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Installation" })).toBeInTheDocument();
  });

  it("returns not found for a draft slug", async () => {
    render(
      <MemoryRouter initialEntries={["/tutorials/draft-walkthrough"]}>
        <Routes>
          <Route path="/tutorials/:slug" element={<TutorialDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Tutorial not found")).toBeInTheDocument();
  });
});
