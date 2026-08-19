import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet } from "@/lib/api";
import { CourseCertificatePage } from "@/features/courses/CourseCertificatePage";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    apiGet: vi.fn(),
  };
});

const get = vi.mocked(apiGet);

describe("CourseCertificatePage", () => {
  beforeEach(() => {
    get.mockReset();
    get.mockResolvedValue({
      certificate: {
        publicId: "RK-ABCDEF1234",
        courseTitle: "Production Docker",
        courseSlug: "production-docker",
        instructor: "Rezaul Karim",
        recipientName: "Test User",
        issuedAt: "2026-08-19T12:00:00.000Z",
        verifyPath: "/course-certificates/RK-ABCDEF1234",
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders a verifiable certificate of completion", async () => {
    render(
      <MemoryRouter initialEntries={["/course-certificates/RK-ABCDEF1234"]}>
        <Routes>
          <Route path="/course-certificates/:publicId" element={<CourseCertificatePage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Test User" })).toBeInTheDocument();
    expect(screen.getByText("Production Docker")).toBeInTheDocument();
    expect(screen.getByText("RK-ABCDEF1234")).toBeInTheDocument();
    expect(screen.getByText("19 August 2026")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open course" })).toHaveAttribute("href", "/courses/production-docker");
    expect(screen.getByRole("button", { name: "Print or save as PDF" })).toBeInTheDocument();
  });

  it("explains when the certificate id is unknown", async () => {
    get.mockRejectedValue(new Error("Not found"));

    render(
      <MemoryRouter initialEntries={["/course-certificates/RK-MISSING"]}>
        <Routes>
          <Route path="/course-certificates/:publicId" element={<CourseCertificatePage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Not found" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse courses" })).toHaveAttribute("href", "/courses");
  });
});
