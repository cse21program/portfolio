import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ExperiencePage } from "@/features/experience/ExperiencePage";

function jsonResponse(data: unknown) {
  return {
    ok: true,
    status: 200,
    text: async () => JSON.stringify({ success: true, data }),
  };
}

describe("ExperiencePage", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          experiences: [
            {
              id: "role-1",
              company: "Acme",
              position: "Backend Engineer",
              type: "Full-time",
              location: "Remote",
              startDate: "2025",
              endDate: "",
              current: true,
              description: "APIs and delivery.",
              responsibilities: ["Ship services"],
              achievements: ["Cut deploy time"],
              technologies: ["TypeScript"],
              website: "https://example.com",
            },
          ],
        }),
      ),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders roles from the API in chronological order", async () => {
    render(
      <MemoryRouter>
        <ExperiencePage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Work and practice" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Backend Engineer" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Acme" })).toHaveAttribute("href", "https://example.com");
    expect(screen.getByText("Ship services")).toBeInTheDocument();
    expect(screen.getByText("Cut deploy time")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText(/Present/)).toBeInTheDocument();
  });
});
