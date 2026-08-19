import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "@/features/auth/AuthContext";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { apiGet } from "@/lib/api";
import type { AuthUser } from "@/types/auth";

vi.mock("@/features/auth/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    apiGet: vi.fn(),
  };
});

const mockedAuth = vi.mocked(useAuth);
const get = vi.mocked(apiGet);

const customer: AuthUser = {
  id: "user-1",
  email: "ada@example.com",
  name: "Ada Lovelace",
  imageUrl: null,
  phone: "",
  country: "",
  notifyProduct: true,
  notifyMarketing: false,
  role: "CUSTOMER",
  emailVerified: true,
  status: "ACTIVE",
  hasPassword: true,
  googleLinked: false,
};

describe("DashboardPage", () => {
  beforeEach(() => {
    mockedAuth.mockReturnValue({
      user: customer,
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      resendVerification: vi.fn(),
      changePassword: vi.fn(),
      updateProfile: vi.fn(),
      uploadAvatar: vi.fn(),
      removeAvatar: vi.fn(),
    });
    get.mockImplementation(async (path: string) => {
      if (path.startsWith("/enrollments")) {
        return {
          enrollments: [
            {
              id: "enroll-1",
              courseSlug: "http-from-zero",
              courseTitle: "HTTP from zero",
              status: "active",
              source: "self",
              enrolledAt: "2026-08-19T10:00:00.000Z",
              canceledAt: null,
              lastActivityAt: "2026-08-19T12:00:00.000Z",
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
        };
      }
      if (path.startsWith("/service-orders")) {
        return {
          orders: [
            {
              id: "order-1",
              userId: "user-1",
              serviceSlug: "architecture-review",
              serviceTitle: "Architecture review",
              packageName: "",
              requirements: "Please review the API error contract.",
              budget: "$400",
              timeline: "",
              status: "pending",
              adminNote: "",
              source: "self",
              createdAt: "2026-08-20T00:00:00.000Z",
              updatedAt: "2026-08-20T00:00:00.000Z",
              canceledAt: null,
            },
          ],
        };
      }
      if (path.startsWith("/blogs/bookmarks")) {
        return { blogs: [{ slug: "jwt-authentication" }] };
      }
      return {};
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows greeting, stats, continue learning, and a profile prompt", async () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Hello, Ada" })).toBeInTheDocument();
    expect(
      screen.getByText("Add a photo, a phone number, and your country to finish your profile."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Complete profile →" })).toHaveAttribute(
      "href",
      "/dashboard/profile",
    );

    expect(await screen.findByText("HTTP from zero")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Continue →" })).toHaveAttribute(
      "href",
      "/courses/http-from-zero#lesson-2-headers",
    );
    expect(screen.getByText("Architecture review")).toBeInTheDocument();
    expect(await screen.findByText("Courses")).toBeInTheDocument();
    expect(screen.getByText("Courses").closest("div")).toHaveTextContent("1");
    expect(screen.getByText("Open orders").closest("div")).toHaveTextContent("1");
    expect(screen.getByText("Saved posts").closest("div")).toHaveTextContent("1");
  });
});
