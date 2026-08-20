import { MemoryRouter } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet, apiPatch } from "@/lib/api";
import { AdminReviewsPage } from "@/features/reviews/AdminReviewsPage";
import type { Review } from "@/types/review";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    apiGet: vi.fn(),
    apiPatch: vi.fn(),
  };
});

const get = vi.mocked(apiGet);
const patch = vi.mocked(apiPatch);

const pendingReview: Review = {
  id: "rev-1",
  userId: "user-1",
  kind: "course",
  slug: "spring-boot-masterclass",
  title: "Spring Boot masterclass",
  href: "/courses/spring-boot-masterclass",
  rating: 5,
  comment: "Clear modules and a production-shaped Spring Boot syllabus.",
  status: "pending",
  verified: true,
  adminNote: "",
  createdAt: "2026-08-20T00:00:00.000Z",
  updatedAt: "2026-08-20T00:00:00.000Z",
  publishedAt: null,
  authorName: "Ada",
  user: { id: "user-1", email: "ada@example.com", name: "Ada" },
};

describe("AdminReviewsPage", () => {
  beforeEach(() => {
    get.mockReset();
    patch.mockReset();
    get.mockResolvedValue({ reviews: [pendingReview] });
    patch.mockResolvedValue({ review: { ...pendingReview, status: "approved" } });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("publishes a pending verified review", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AdminReviewsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Spring Boot masterclass" })).toBeInTheDocument();
    expect(screen.getByText("Clear modules and a production-shaped Spring Boot syllabus.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Publish" }));

    await waitFor(() => {
      expect(patch).toHaveBeenCalledWith("/reviews/admin/rev-1", {
        status: "approved",
        adminNote: undefined,
      });
    });
  });
});
