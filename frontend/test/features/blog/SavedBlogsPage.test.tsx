import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SavedBlogsPage } from "@/features/blog/SavedBlogsPage";
import { apiGet } from "@/lib/api";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    apiGet: vi.fn(),
  };
});

const get = vi.mocked(apiGet);

describe("SavedBlogsPage", () => {
  beforeEach(() => {
    get.mockResolvedValue({
      blogs: [
        {
          id: "blog-1",
          title: "JWT authentication",
          slug: "jwt-authentication",
          excerpt: "Access tokens and refresh tokens on the server.",
          content: ["Keep authorization on the server."],
          featuredImageUrl: null,
          author: "Rezaul Karim",
          category: "Backend",
          tags: ["JWT"],
          skill: "Spring Boot",
          topic: "",
          readingTime: "8 min",
          publishedAt: "2026-07-12",
          status: "published",
        },
      ],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders bookmarked posts", async () => {
    render(
      <MemoryRouter>
        <SavedBlogsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Saved posts" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /JWT authentication/ })).toHaveAttribute(
      "href",
      "/blog/jwt-authentication",
    );
  });

  it("shows an empty state when nothing is saved", async () => {
    get.mockResolvedValue({ blogs: [] });
    render(
      <MemoryRouter>
        <SavedBlogsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Nothing saved yet")).toBeInTheDocument();
  });
});
