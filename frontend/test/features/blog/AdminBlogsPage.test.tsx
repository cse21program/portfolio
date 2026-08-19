import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet, apiPut } from "@/lib/api";
import { AdminBlogsPage } from "@/features/blog/AdminBlogsPage";

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
  id: "b2e2d9f1-0000-4000-8000-000000000051",
  title: "JWT authentication",
  slug: "jwt-authentication",
  excerpt: "Access tokens and refresh tokens on the server.",
  content: ["Keep authorization on the server."],
  featuredImageUrl: null,
  author: "Rezaul Karim",
  category: "Backend",
  tags: ["JWT", "Security"],
  skill: "Spring Boot",
  topic: "",
  readingTime: "8 min",
  publishedAt: "2026-07-12",
  status: "published",
  seoTitle: "",
  seoDescription: "",
  canonicalUrl: "",
  sortOrder: 0,
};

describe("AdminBlogsPage", () => {
  beforeEach(() => {
    get.mockReset();
    put.mockReset();
    get.mockResolvedValue({ blogs: [seeded] });
    put.mockResolvedValue({
      blogs: [{ ...seeded, title: "JWT access tokens" }],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads published records and publishes edits", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AdminBlogsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Blog" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Title")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View public page →" })).toHaveAttribute("href", "/blog");

    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByLabelText("Title")).toHaveValue("JWT authentication");
    expect(screen.getByLabelText("Slug")).toHaveValue("jwt-authentication");
    await user.click(screen.getByRole("button", { name: "Collapse" }));
    expect(screen.queryByLabelText("Title")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByLabelText("Title")).toHaveValue("JWT authentication");

    await user.clear(screen.getByLabelText("Title"));
    await user.type(screen.getByLabelText("Title"), "JWT access tokens");
    await user.click(screen.getByRole("button", { name: "Publish posts" }));

    await waitFor(() => {
      expect(put).toHaveBeenCalled();
    });

    expect(put).toHaveBeenCalledWith(
      "/blogs",
      expect.objectContaining({
        blogs: [
          expect.objectContaining({
            title: "JWT access tokens",
            slug: "jwt-authentication",
            status: "published",
            category: "Backend",
          }),
        ],
      }),
    );
    expect(await screen.findByText("Posts published.")).toBeInTheDocument();
  });

  it("blocks publish when a title is missing", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AdminBlogsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("button", { name: "Edit" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByLabelText("Title")).toBeInTheDocument();
    await user.clear(screen.getByLabelText("Title"));
    await user.click(screen.getByRole("button", { name: "Publish posts" }));

    expect(put).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("title must be at least 2 characters");
  });

  it("blocks publish when a new post is still empty", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AdminBlogsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("button", { name: "Add post" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add post" }));
    await user.click(screen.getByRole("button", { name: "Publish posts" }));

    expect(put).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("title must be at least 2 characters");
  });

  it("blocks publish when two posts share a slug", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AdminBlogsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("button", { name: "Add post" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add post" }));
    expect(screen.getByLabelText("Title")).toHaveValue("");
    await user.type(screen.getByLabelText("Title"), "JWT copy");
    await user.clear(screen.getByLabelText("Slug"));
    await user.type(screen.getByLabelText("Slug"), "jwt-authentication");
    await user.clear(screen.getByLabelText("Excerpt"));
    await user.type(screen.getByLabelText("Excerpt"), "A second take on tokens.");
    await user.click(screen.getByRole("button", { name: "Publish posts" }));

    expect(put).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("slug must be unique");
  });

  it("lets a search listing be edited", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AdminBlogsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("button", { name: "Edit" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.type(screen.getByLabelText("SEO title"), "JWT notes");
    await user.type(screen.getByLabelText("SEO description"), "Keep auth on the server.");
    await user.click(screen.getByRole("button", { name: "Publish posts" }));

    await waitFor(() => {
      expect(put).toHaveBeenCalled();
    });

    expect(put).toHaveBeenCalledWith(
      "/blogs",
      expect.objectContaining({
        blogs: [
          expect.objectContaining({
            seoTitle: "JWT notes",
            seoDescription: "Keep auth on the server.",
          }),
        ],
      }),
    );
  });

  it("filters the list by search", async () => {
    const user = userEvent.setup();
    get.mockResolvedValue({
      blogs: [
        seeded,
        {
          ...seeded,
          id: "b2e2d9f1-0000-4000-8000-000000000052",
          title: "Docker networking",
          slug: "docker-networking",
          excerpt: "Bridge networks and published ports.",
          category: "DevOps",
          skill: "Docker",
          tags: ["Docker"],
        },
      ],
    });

    render(
      <MemoryRouter>
        <AdminBlogsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "JWT authentication" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Docker networking" })).toBeInTheDocument();

    await user.type(screen.getByLabelText("Search posts"), "docker");

    expect(screen.queryByRole("heading", { name: "JWT authentication" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Docker networking" })).toBeInTheDocument();
    expect(screen.getByText("1 of 2 posts")).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Search posts"));
    await user.type(screen.getByLabelText("Search posts"), "xyz");
    expect(screen.getByText("No posts match these filters.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.getByRole("heading", { name: "JWT authentication" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Docker networking" })).toBeInTheDocument();
  });

  it("filters the list by skill and draft status", async () => {
    const user = userEvent.setup();
    get.mockResolvedValue({
      blogs: [
        seeded,
        {
          ...seeded,
          id: "b2e2d9f1-0000-4000-8000-000000000052",
          title: "Docker networking",
          slug: "docker-networking",
          excerpt: "Bridge networks and published ports.",
          category: "DevOps",
          skill: "Docker",
          tags: ["Docker"],
          status: "draft",
        },
      ],
    });

    render(
      <MemoryRouter>
        <AdminBlogsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "JWT authentication" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Docker networking" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Docker" }));
    expect(screen.queryByRole("heading", { name: "JWT authentication" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Docker networking" })).toBeInTheDocument();
    expect(screen.getByText("1 of 2 posts")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "All skills" }));
    await user.click(screen.getByRole("button", { name: "Draft" }));
    expect(screen.queryByRole("heading", { name: "JWT authentication" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Docker networking" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Published" }));
    expect(screen.getByRole("heading", { name: "JWT authentication" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Docker networking" })).not.toBeInTheDocument();
  });
});
