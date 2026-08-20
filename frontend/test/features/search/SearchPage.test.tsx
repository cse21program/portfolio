import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SearchPage } from "@/features/search/SearchPage";
import { SearchProvider } from "@/features/search/SearchContext";
import { SearchModal } from "@/features/search/SearchModal";
import { SiteSearch } from "@/features/search/SiteSearch";

const dockerResults = {
  query: "Docker",
  kind: null,
  sort: "relevance",
  total: 4,
  groups: [
    {
      kind: "skill",
      label: "Skills",
      items: [
        {
          kind: "skill",
          title: "Docker",
          href: "/skills/docker",
          summary: "Images, compose files, and repeatable environments.",
          meta: "DevOps",
        },
      ],
    },
    {
      kind: "blog",
      label: "Blogs",
      items: [
        {
          kind: "blog",
          title: "Docker networking explained for API developers",
          href: "/blog/docker-networking",
          summary: "Bridge networks and published ports.",
          meta: "DevOps",
        },
      ],
    },
    {
      kind: "tutorial",
      label: "Tutorials",
      items: [
        {
          kind: "tutorial",
          title: "Docker complete tutorial",
          href: "/tutorials/docker-complete",
          summary: "From images and containers to a deployable API stack.",
          meta: "Docker",
        },
      ],
    },
    {
      kind: "course",
      label: "Courses",
      items: [
        {
          kind: "course",
          title: "Production Docker",
          href: "/courses/production-docker",
          summary: "From laptop Compose files to images you can promote.",
          meta: "Docker",
        },
      ],
    },
  ],
  facets: {
    years: ["2026", "2025"],
    skills: ["Docker", "Spring Boot"],
    topics: ["Images", "Spring Security"],
    access: ["free", "paid"],
    prices: ["50-199"],
  },
};

function jsonResponse(data: unknown) {
  return {
    ok: true,
    status: 200,
    text: async () => JSON.stringify({ success: true, data }),
  };
}

function mockFetch() {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(String(input), "http://localhost");
    const query = url.searchParams.get("q") ?? "";
    const kind = url.searchParams.get("kind") ?? "";
    if (!query) {
      return jsonResponse({ query: "", kind: kind || null, total: 0, groups: [] });
    }
    const groups = kind
      ? dockerResults.groups.filter((group) => group.kind === kind)
      : dockerResults.groups;
    return jsonResponse({
      query,
      kind: kind || null,
      sort: url.searchParams.get("sort") || "relevance",
      total: groups.reduce((sum, group) => sum + group.items.length, 0),
      groups,
      facets: dockerResults.facets,
    });
  });
}

describe("SearchPage", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("asks for a query before searching", async () => {
    render(
      <MemoryRouter initialEntries={["/search"]}>
        <Routes>
          <Route path="/search" element={<SearchPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Find work and writing" })).toBeInTheDocument();
    expect(screen.getByText("Start with a word")).toBeInTheDocument();
  });

  it("groups results by content type", async () => {
    render(
      <MemoryRouter initialEntries={["/search?q=Docker"]}>
        <Routes>
          <Route path="/search" element={<SearchPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Skills" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Docker" }).closest("a")).toHaveAttribute("href", "/skills/docker");
    expect(screen.getByRole("heading", { name: "Tutorials" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Docker complete tutorial" }).closest("a")).toHaveAttribute(
      "href",
      "/tutorials/docker-complete",
    );
    expect(screen.getByRole("heading", { name: "Courses" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Production Docker" }).closest("a")).toHaveAttribute(
      "href",
      "/courses/production-docker",
    );
    expect(screen.getByRole("heading", { name: "Blogs" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Docker networking explained for API developers" }).closest("a")).toHaveAttribute(
      "href",
      "/blog/docker-networking",
    );
  });

  it("can filter results to one type", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/search?q=Docker"]}>
        <Routes>
          <Route path="/search" element={<SearchPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Skills" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Courses" }));
    expect(await screen.findByRole("heading", { name: "Production Docker" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Skills" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Tutorials" })).not.toBeInTheDocument();
  });

  it("shows sort and date chips once a query is present", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/search?q=Docker"]}>
        <Routes>
          <Route path="/search" element={<SearchPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Skills" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Newest" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Popular" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Newest" }));
    expect(screen.getByRole("button", { name: "Newest" })).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "More filters" }));
    await user.click(within(screen.getByRole("group", { name: "Filter by year" })).getByRole("button", { name: "2025" }));
    expect(within(screen.getByRole("group", { name: "Filter by year" })).getByRole("button", { name: "2025" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});

describe("Search modal", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("opens from the header control and lists grouped results", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/"]}>
        <SearchProvider>
          <SiteSearch compact />
          <SearchModal />
        </SearchProvider>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Search the catalog" }));
    expect(await screen.findByRole("dialog", { name: "Search the catalog" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Find work and writing" })).toBeInTheDocument();

    await user.type(screen.getByRole("searchbox", { name: "Search the catalog" }), "Docker");
    expect(await screen.findByRole("heading", { name: "Docker complete tutorial" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Production Docker" }).closest("a")).toHaveAttribute(
      "href",
      "/courses/production-docker",
    );

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Search the catalog" })).not.toBeInTheDocument();
  });
});
