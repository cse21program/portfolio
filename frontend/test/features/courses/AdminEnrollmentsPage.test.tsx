import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiDelete, apiGet, apiPost } from "@/lib/api";
import { AdminEnrollmentsPage } from "@/features/courses/AdminEnrollmentsPage";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    apiGet: vi.fn(),
    apiPost: vi.fn(),
    apiDelete: vi.fn(),
  };
});

const get = vi.mocked(apiGet);
const post = vi.mocked(apiPost);
const remove = vi.mocked(apiDelete);

const enrollment = {
  id: "enroll-1",
  courseSlug: "spring-boot-masterclass",
  courseTitle: "Production-grade Spring Boot",
  status: "active",
  source: "admin",
  enrolledAt: "2026-08-19T10:00:00.000Z",
  canceledAt: null,
  course: {
    slug: "spring-boot-masterclass",
    title: "Production-grade Spring Boot",
    subtitle: "APIs and deployment.",
    thumbnailUrl: null,
    free: false,
    difficulty: "Intermediate",
    duration: "18 hours",
    skill: "Spring Boot",
  },
  user: { id: "user-1", email: "student@example.com", name: "Student" },
};

describe("AdminEnrollmentsPage", () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    remove.mockReset();
    get.mockImplementation(async (path: string) => {
      if (path.startsWith("/courses")) {
        return {
          courses: [
            {
              slug: "spring-boot-masterclass",
              title: "Production-grade Spring Boot",
              subtitle: "",
              description: "Spring services.",
              skill: "Spring Boot",
              difficulty: "Intermediate",
              duration: "18 hours",
              outcomes: [],
              modules: [],
              price: "$149",
              free: false,
              featured: true,
              status: "published",
            },
          ],
        };
      }
      return { enrollments: [enrollment] };
    });
    post.mockResolvedValue({ enrollment });
    remove.mockResolvedValue({ enrollment: { ...enrollment, status: "canceled" } });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lists enrollments and grants a seat", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AdminEnrollmentsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("student@example.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Revoke seat for student@example.com in Production-grade Spring Boot" })).toBeInTheDocument();

    await user.type(screen.getByLabelText("Student email"), "student@example.com");
    fireEvent.change(screen.getByLabelText("Course"), { target: { value: "spring-boot-masterclass" } });
    await user.click(screen.getByRole("button", { name: "Grant seat" }));

    await waitFor(() => {
      expect(post).toHaveBeenCalledWith("/enrollments/admin", {
        email: "student@example.com",
        courseSlug: "spring-boot-masterclass",
      });
    });
    expect(await screen.findByText("Seat granted.")).toBeInTheDocument();
  });
});
