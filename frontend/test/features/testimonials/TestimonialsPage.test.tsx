import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TestimonialsPage } from "@/features/testimonials/TestimonialsPage";

vi.mock("@/features/testimonials/useTestimonials", () => ({
  useTestimonials: () => ({
    testimonials: [
      {
        id: "1",
        name: "Aisha Rahman",
        position: "Product engineer",
        company: "Early-stage SaaS",
        rating: 5,
        comment: "The error format and auth story were the difference.",
      },
    ],
    loading: false,
    error: "",
    reload: vi.fn(),
  }),
}));

describe("TestimonialsPage", () => {
  it("renders quotes from the hook", () => {
    render(
      <MemoryRouter>
        <TestimonialsPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "What people say" })).toBeInTheDocument();
    expect(screen.getByText("Aisha Rahman")).toBeInTheDocument();
    expect(screen.getByText("The error format and auth story were the difference.")).toBeInTheDocument();
    expect(screen.getByText("Product engineer, Early-stage SaaS")).toBeInTheDocument();
  });
});
