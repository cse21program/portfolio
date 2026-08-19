import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet } from "@/lib/api";
import { DashboardCoursesPage } from "@/features/dashboard/DashboardPage";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    apiGet: vi.fn(),
    apiDelete: vi.fn(),
  };
});

const get = vi.mocked(apiGet);

describe("DashboardCoursesPage", () => {
  beforeEach(() => {
    get.mockReset();
    get.mockResolvedValue({
      enrollments: [
        {
          id: "enroll-1",
          courseSlug: "http-from-zero",
          courseTitle: "HTTP from zero",
          status: "active",
          source: "self",
          enrolledAt: "2026-08-19T10:00:00.000Z",
          canceledAt: null,
          lastActivityAt: "2026-08-19T10:00:00.000Z",
          course: {
            slug: "http-from-zero",
            title: "HTTP from zero",
            subtitle: "Requests and status codes.",
            thumbnailUrl: null,
            free: true,
            difficulty: "Beginner",
            duration: "3 hours",
            skill: "HTTP",
          },
          progress: {
            lessonsTotal: 2,
            lessonsCompleted: 1,
            lessonsRemaining: 1,
            percent: 50,
            currentLesson: {
              key: "foundations/headers",
              title: "Headers",
              moduleTitle: "Foundations",
              index: 1,
            },
            lastActivityAt: "2026-08-19T12:00:00.000Z",
            completedKeys: ["foundations/status-codes"],
            completed: false,
          },
        },
      ],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lists active enrollments", async () => {
    render(
      <MemoryRouter>
        <DashboardCoursesPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "HTTP from zero" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /HTTP from zero/ })).toHaveAttribute("href", "/courses/http-from-zero");
    expect(screen.getByText("Course progress")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText("Lessons completed").closest("div")).toHaveTextContent("1");
    expect(screen.getByText("Lessons remaining").closest("div")).toHaveTextContent("1");
    expect(screen.getByText("Headers")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Continue" })).toHaveAttribute(
      "href",
      "/courses/http-from-zero#lesson-2-headers",
    );
    expect(screen.getByRole("button", { name: "Leave course" })).toBeInTheDocument();
  });
});
