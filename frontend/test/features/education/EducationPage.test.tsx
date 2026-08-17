import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EducationPage } from "@/features/education/EducationPage";

function jsonResponse(data: unknown) {
  return {
    ok: true,
    status: 200,
    text: async () => JSON.stringify({ success: true, data }),
  };
}

describe("EducationPage", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          education: [
            {
              id: "school-1",
              institution: "Acme University",
              degree: "B.Sc.",
              field: "Computer Science",
              startDate: "2021",
              endDate: "",
              current: true,
              grade: "3.8 CGPA",
              location: "Sylhet",
              description: "Software construction.",
              achievements: ["Ship real projects"],
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

  it("renders education from the API", async () => {
    render(
      <MemoryRouter>
        <EducationPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Study and supporting work" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "B.Sc. Computer Science" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Acme University" })).toHaveAttribute("href", "https://example.com");
    expect(screen.getByText("Ship real projects")).toBeInTheDocument();
    expect(screen.getByText("3.8 CGPA")).toBeInTheDocument();
    expect(screen.getByText(/Present/)).toBeInTheDocument();
  });
});
