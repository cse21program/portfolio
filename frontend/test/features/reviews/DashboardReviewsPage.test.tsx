import { MemoryRouter } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet, apiPost } from "@/lib/api";
import { DashboardReviewsPage } from "@/features/reviews/DashboardReviewsPage";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    apiGet: vi.fn(),
    apiPost: vi.fn(),
    apiDelete: vi.fn(),
  };
});

const get = vi.mocked(apiGet);
const post = vi.mocked(apiPost);

describe("DashboardReviewsPage", () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    get.mockImplementation(async (path: string) => {
      if (path === "/reviews/eligible") {
        return {
          products: [
            {
              kind: "course",
              slug: "spring-boot-masterclass",
              title: "Spring Boot masterclass",
              href: "/courses/spring-boot-masterclass",
            },
          ],
        };
      }
      return { reviews: [] };
    });
    post.mockResolvedValue({
      review: {
        id: "rev-1",
        status: "pending",
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("submits a review for a paid purchase", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <DashboardReviewsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Reviews" })).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Purchase"), "course:spring-boot-masterclass");
    await user.type(
      screen.getByLabelText("Comment"),
      "Clear modules and a production-shaped Spring Boot syllabus.",
    );
    await user.click(screen.getByRole("button", { name: "Submit review" }));

    await waitFor(() => {
      expect(post).toHaveBeenCalledWith("/reviews", {
        kind: "course",
        slug: "spring-boot-masterclass",
        rating: 5,
        comment: "Clear modules and a production-shaped Spring Boot syllabus.",
      });
    });
  });

  it("asks for a comment instead of showing Invalid request", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <DashboardReviewsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByLabelText("Purchase")).toHaveValue("course:spring-boot-masterclass");
    await user.click(screen.getByRole("button", { name: "Submit review" }));
    expect(await screen.findByText("Write a short comment")).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });
});
