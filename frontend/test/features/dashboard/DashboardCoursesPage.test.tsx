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
    expect(screen.getByText(/3 hours · 2 lessons/)).toBeInTheDocument();
  });

  it("shows a certificate link when the course is complete", async () => {
    get.mockResolvedValue({
      enrollments: [
        {
          id: "enroll-1",
          courseSlug: "spring-boot-masterclass",
          courseTitle: "Production-grade Spring Boot",
          status: "active",
          source: "self",
          enrolledAt: "2026-08-19T10:00:00.000Z",
          canceledAt: null,
          lastActivityAt: "2026-08-19T12:00:00.000Z",
          course: {
            slug: "spring-boot-masterclass",
            title: "Production-grade Spring Boot",
            subtitle: "APIs and deployment.",
            thumbnailUrl: null,
            free: false,
            difficulty: "Intermediate",
            duration: "18 hours",
            skill: "Spring Boot",
            certificateAvailable: true,
          },
          progress: {
            lessonsTotal: 2,
            lessonsCompleted: 2,
            lessonsRemaining: 0,
            percent: 100,
            currentLesson: {
              key: "fundamentals/application-structure",
              title: "Application structure",
              moduleTitle: "Fundamentals",
              index: 0,
            },
            lastActivityAt: "2026-08-19T12:00:00.000Z",
            completedKeys: ["fundamentals/application-structure", "fundamentals/notes"],
            completed: true,
          },
          certificate: {
            publicId: "RK-ABCDEF1234",
            issuedAt: "2026-08-19T12:00:00.000Z",
            verifyPath: "/course-certificates/RK-ABCDEF1234",
          },
        },
      ],
    });

    render(
      <MemoryRouter>
        <DashboardCoursesPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("link", { name: "View certificate" })).toHaveAttribute(
      "href",
      "/course-certificates/RK-ABCDEF1234",
    );
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("Certificate RK-ABCDEF1234")).toBeInTheDocument();
  });

  it("lets a completed course claim a certificate when none exists yet", async () => {
    get.mockResolvedValue({
      enrollments: [
        {
          id: "enroll-1",
          courseSlug: "production-docker",
          courseTitle: "Production Docker",
          status: "active",
          source: "admin",
          enrolledAt: "2026-08-19T10:00:00.000Z",
          canceledAt: null,
          lastActivityAt: "2026-08-19T12:00:00.000Z",
          course: {
            slug: "production-docker",
            title: "Production Docker",
            subtitle: "From laptop Compose files to images you can promote.",
            thumbnailUrl: null,
            free: false,
            difficulty: "Beginner",
            duration: "8 hours",
            skill: "Docker",
            certificateAvailable: false,
          },
          progress: {
            lessonsTotal: 9,
            lessonsCompleted: 9,
            lessonsRemaining: 0,
            percent: 100,
            currentLesson: null,
            lastActivityAt: "2026-08-19T12:00:00.000Z",
            completedKeys: [],
            completed: true,
          },
        },
      ],
    });

    render(
      <MemoryRouter>
        <DashboardCoursesPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("button", { name: "Get certificate" })).toBeInTheDocument();
  });
});
