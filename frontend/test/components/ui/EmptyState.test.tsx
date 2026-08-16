import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { EmptyState } from "@/components/ui/EmptyState";

describe("EmptyState", () => {
  it("explains the next action", () => {
    render(
      <MemoryRouter>
        <EmptyState
          title="No courses yet"
          description="When you enroll, lessons will show up here."
          action={{ label: "Browse courses", to: "/courses" }}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "No courses yet" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse courses" })).toHaveAttribute("href", "/courses");
  });
});
