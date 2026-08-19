import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminAudiencePage } from "@/features/blog/AdminAudiencePage";
import { apiDelete, apiGet, apiPost } from "@/lib/api";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    apiGet: vi.fn(),
    apiDelete: vi.fn(),
    apiPost: vi.fn(),
  };
});

const get = vi.mocked(apiGet);
const remove = vi.mocked(apiDelete);
const post = vi.mocked(apiPost);

describe("AdminAudiencePage", () => {
  beforeEach(() => {
    get.mockImplementation(async (path: string) => {
      if (path.startsWith("/blogs/comments")) {
        return {
          comments: [
            {
              id: "c1",
              slug: "jwt-authentication",
              title: "JWT authentication",
              body: "This helped me ship auth.",
              author: "Student",
              userId: "user-1",
              createdAt: "2026-08-19T00:00:00.000Z",
            },
          ],
        };
      }
      if (path.startsWith("/newsletter")) {
        return {
          subscribers: [
            {
              id: "s1",
              email: "reader@example.com",
              name: "Reader",
              createdAt: "2026-08-19T00:00:00.000Z",
            },
          ],
        };
      }
      return {
        blogs: [
          {
            title: "JWT authentication",
            slug: "jwt-authentication",
            excerpt: "Access tokens.",
            content: ["Keep auth on the server."],
            status: "published",
            tags: [],
            category: "Backend",
            skill: "Spring Boot",
            author: "Rezaul Karim",
            publishedAt: "2026-07-12",
            readingTime: "8 min",
          },
        ],
      };
    });
    remove.mockResolvedValue(null);
    post.mockResolvedValue({ sent: 1, failed: 0 });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("lists comments and subscribers and removes them", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AdminAudiencePage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Audience" })).toBeInTheDocument();
    expect(screen.getByText("This helped me ship auth.")).toBeInTheDocument();
    expect(screen.getByText("reader@example.com")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remove comment" }));
    expect(remove).toHaveBeenCalledWith("/blogs/comments/c1");
    expect(screen.queryByText("This helped me ship auth.")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remove subscriber" }));
    expect(remove).toHaveBeenCalledWith("/newsletter/s1");
    expect(screen.queryByText("reader@example.com")).not.toBeInTheDocument();
  });

  it("sends a newsletter issue", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AdminAudiencePage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Send an issue" })).toBeInTheDocument();
    await user.type(screen.getByLabelText("Subject"), "New note on JWT");
    await user.type(screen.getByLabelText("Message"), "A short note about tokens on the server.");
    await user.selectOptions(screen.getByLabelText("Link a post (optional)"), "jwt-authentication");
    await user.click(screen.getByRole("button", { name: "Send issue" }));

    expect(post).toHaveBeenCalledWith("/newsletter/send", {
      subject: "New note on JWT",
      body: "A short note about tokens on the server.",
      slug: "jwt-authentication",
    });
    expect(await screen.findByText("Sent to 1.")).toBeInTheDocument();
  });
});
