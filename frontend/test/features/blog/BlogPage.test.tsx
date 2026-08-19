import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "@/features/auth/AuthContext";
import { BlogDetailPage } from "@/features/blog/BlogDetailPage";
import { BlogPage } from "@/features/blog/BlogPage";
import type { AuthUser } from "@/types/auth";

const apiBlogs = [
  {
    id: "blog-1",
    title: "JWT authentication",
    slug: "jwt-authentication",
    excerpt: "Access tokens and refresh tokens on the server.",
    content: ["Keep authorization on the server.", "Rotate refresh tokens."],
    featuredImageUrl: null,
    author: "Rezaul Karim",
    category: "Backend",
    tags: ["JWT", "Security"],
    skill: "Spring Boot",
    topic: "",
    readingTime: "8 min",
    publishedAt: "2026-07-12",
    status: "published",
    seoTitle: "JWT notes",
    seoDescription: "Keep auth on the server.",
    canonicalUrl: "",
  },
  {
    id: "blog-2",
    title: "Docker networking",
    slug: "docker-networking",
    excerpt: "Bridge networks and published ports.",
    content: ["Containers do not share localhost."],
    featuredImageUrl: null,
    author: "Rezaul Karim",
    category: "DevOps",
    tags: ["Docker"],
    skill: "Docker",
    topic: "",
    readingTime: "6 min",
    publishedAt: "2026-06-02",
    status: "published",
  },
  {
    id: "blog-3",
    title: "Draft notes",
    slug: "draft-notes",
    excerpt: "Not ready for the public site yet.",
    content: ["Still writing."],
    featuredImageUrl: null,
    author: "Rezaul Karim",
    category: "Backend",
    tags: ["Draft"],
    skill: "Spring Boot",
    topic: "",
    readingTime: "2 min",
    publishedAt: "2026-08-01",
    status: "draft",
  },
];

const reader: AuthUser = {
  id: "user-1",
  email: "reader@example.com",
  name: "Student",
  role: "CUSTOMER",
  emailVerified: true,
  status: "ACTIVE",
  hasPassword: true,
  googleLinked: false,
};

function jsonResponse(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () =>
      JSON.stringify(
        status >= 200 && status < 300
          ? { success: true, data }
          : { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      ),
  };
}

function mockFetch(user: AuthUser | null = null) {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = (init?.method ?? "GET").toUpperCase();

    if (url.includes("/auth/me")) {
      return user ? jsonResponse({ user }) : jsonResponse(null, 401);
    }
    if (url.includes("/engagement")) {
      return jsonResponse({ comments: [], likeCount: 0, liked: false, bookmarked: false });
    }
    if (method === "POST" && url.includes("/like")) {
      return jsonResponse({ liked: true, likeCount: 1 });
    }
    if (method === "POST" && url.includes("/bookmark")) {
      return jsonResponse({ bookmarked: true });
    }
    if (method === "POST" && url.includes("/comments")) {
      return jsonResponse({
        comment: {
          id: "comment-1",
          slug: "jwt-authentication",
          body: "This helped me ship auth.",
          author: "Student",
          userId: "user-1",
          createdAt: "2026-08-19T00:00:00.000Z",
        },
      });
    }
    if (method === "POST" && url.includes("/newsletter")) {
      return jsonResponse({ subscriber: { id: "sub-1", email: "reader@example.com", name: "" } });
    }
    return jsonResponse({ blogs: apiBlogs });
  });
}

function renderDetail() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={["/blog/jwt-authentication"]}>
        <Routes>
          <Route path="/blog/:slug" element={<BlogDetailPage />} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe("BlogPage", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("renders published posts and hides drafts", async () => {
    render(
      <MemoryRouter>
        <BlogPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Writing" })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "JWT authentication" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Docker networking" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Draft notes" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Backend" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "DevOps" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Get new posts" })).toBeInTheDocument();
  });

  it("filters by search, category, skill, and tag", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <BlogPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "JWT authentication" })).toBeInTheDocument();

    await user.type(screen.getByLabelText("Search posts"), "docker");
    expect(screen.queryByRole("heading", { name: "JWT authentication" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Docker networking" })).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Search posts"));
    await user.click(screen.getByRole("button", { name: "Backend" }));
    expect(screen.getByRole("heading", { name: "JWT authentication" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Docker networking" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "All" }));
    await user.click(
      within(screen.getByRole("group", { name: "Filter by skill" })).getByRole("button", {
        name: "Docker",
      }),
    );
    expect(screen.queryByRole("heading", { name: "JWT authentication" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Docker networking" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "All skills" }));
    await user.click(screen.getByRole("button", { name: "JWT" }));
    expect(screen.getByRole("heading", { name: "JWT authentication" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Docker networking" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.getByRole("heading", { name: "JWT authentication" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Docker networking" })).toBeInTheDocument();
  });

  it("renders a post, related writing, and copies the link", async () => {
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
    renderDetail();

    expect(await screen.findByRole("heading", { name: "JWT authentication" })).toBeInTheDocument();
    expect(screen.getByText("Keep authorization on the server.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Related" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Comments" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Docker networking/ })).toHaveAttribute(
      "href",
      "/blog/docker-networking",
    );
    expect(document.title).toBe("JWT notes");

    await user.click(screen.getByRole("button", { name: "Copy link" }));
    expect(writeText).toHaveBeenCalled();
    expect(await screen.findByRole("button", { name: "Link copied" })).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
  });

  it("lets a signed-in reader like, save, and comment", async () => {
    vi.stubGlobal("fetch", mockFetch(reader));
    const user = userEvent.setup();
    renderDetail();

    expect(await screen.findByRole("heading", { name: "JWT authentication" })).toBeInTheDocument();
    expect(await screen.findByLabelText("Comment")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Like" }));
    expect(await screen.findByRole("button", { name: /Liked/ })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByRole("button", { name: "Saved" })).toBeInTheDocument();

    await user.type(screen.getByLabelText("Comment"), "This helped me ship auth.");
    await user.click(screen.getByRole("button", { name: "Post comment" }));
    expect(await screen.findByText("This helped me ship auth.")).toBeInTheDocument();
    expect(screen.getByText("Student")).toBeInTheDocument();
  });

  it("returns not found for a draft slug", async () => {
    render(
      <MemoryRouter initialEntries={["/blog/draft-notes"]}>
        <Routes>
          <Route path="/blog/:slug" element={<BlogDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Article not found")).toBeInTheDocument();
  });
});
