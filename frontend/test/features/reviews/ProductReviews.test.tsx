import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet } from "@/lib/api";
import { ProductReviews } from "@/features/reviews/ProductReviews";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    apiGet: vi.fn(),
  };
});

const get = vi.mocked(apiGet);

describe("ProductReviews", () => {
  beforeEach(() => {
    get.mockReset();
    get.mockResolvedValue({
      summary: { count: 1, average: 5 },
      reviews: [
        {
          id: "rev-1",
          kind: "course",
          slug: "spring-boot-masterclass",
          title: "Spring Boot masterclass",
          rating: 5,
          comment: "Clear modules and a production-shaped Spring Boot syllabus.",
          verified: true,
          createdAt: "2026-08-20T00:00:00.000Z",
          authorName: "Ada",
        },
      ],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lists published verified reviews", async () => {
    render(
      <MemoryRouter>
        <ProductReviews kind="course" slug="spring-boot-masterclass" />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Ada")).toBeInTheDocument();
    expect(screen.getByText(/Verified purchase/)).toBeInTheDocument();
    expect(screen.getByText("Clear modules and a production-shaped Spring Boot syllabus.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Write a review →" })).toHaveAttribute("href", "/dashboard/reviews");
  });
});
