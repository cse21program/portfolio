import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet, apiPut } from "@/lib/api";
import { AdminCoursesPage } from "@/features/courses/AdminCoursesPage";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    apiGet: vi.fn(),
    apiPut: vi.fn(),
  };
});

const get = vi.mocked(apiGet);
const put = vi.mocked(apiPut);

const seeded = {
  id: "b2e2d9f1-0000-4000-8000-000000000080",
  title: "Production-grade Spring Boot",
  slug: "spring-boot-masterclass",
  subtitle: "APIs, security, persistence, and deployment.",
  description: "A structured course for building Spring Boot services that survive real traffic.",
  overview: ["Design resources and ship an image with health checks."],
  difficulty: "Intermediate",
  requirements: ["Java 21"],
  outcomes: ["Design REST resources with consistent errors"],
  audience: ["Backend engineers"],
  duration: "18 hours",
  thumbnailUrl: null,
  promoVideoUrl: null,
  instructor: "Rezaul Karim",
  category: "Backend",
  skill: "Spring Boot",
  language: "English",
  relatedSkillSlugs: [],
  relatedTutorialSlugs: [],
  relatedCourseSlugs: [],
  price: "$149",
  salePrice: "$99",
  currency: "USD",
  free: false,
  featured: true,
  certificateAvailable: true,
  modules: [
    {
      title: "Fundamentals",
      summary: "Packages and configuration.",
      lessons: [
        {
          title: "Application structure",
          summary: "Packages that match how the service changes.",
          body: ["A Spring Boot service that will last needs a package layout."],
          videoUrl: null,
          images: [],
          codeSnippets: [],
          resources: [],
          downloads: [],
        },
      ],
    },
  ],
  publishedAt: "2026-04-12",
  status: "published",
  seoTitle: "",
  seoDescription: "",
  canonicalUrl: "",
  sortOrder: 0,
};

describe("AdminCoursesPage", () => {
  beforeEach(() => {
    get.mockReset();
    put.mockReset();
    get.mockImplementation(async (path: string) => {
      if (path.startsWith("/skills")) {
        return { skills: [] };
      }
      return { courses: [seeded] };
    });
    put.mockResolvedValue({
      courses: [{ ...seeded, title: "Spring Boot from scratch" }],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads published records and publishes edits", async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <MemoryRouter>
        <AdminCoursesPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Courses" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Title")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View public page →" })).toHaveAttribute("href", "/courses");

    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByLabelText("Title", { exact: true })).toHaveValue("Production-grade Spring Boot");

    fireEvent.change(screen.getByLabelText("Title", { exact: true }), {
      target: { value: "Spring Boot from scratch" },
    });
    await user.click(screen.getByRole("button", { name: "Publish courses" }));

    await waitFor(() => {
      expect(put).toHaveBeenCalled();
    });

    expect(put).toHaveBeenCalledWith(
      "/courses",
      expect.objectContaining({
        courses: [
          expect.objectContaining({
            title: "Spring Boot from scratch",
            slug: "spring-boot-masterclass",
            status: "published",
            difficulty: "Intermediate",
          }),
        ],
      }),
    );
    expect(await screen.findByText("Courses published.")).toBeInTheDocument();
  }, 10000);

  it("blocks publish when a title is missing", async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <MemoryRouter>
        <AdminCoursesPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("button", { name: "Edit" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByLabelText("Title", { exact: true })).toBeInTheDocument();
    await user.clear(screen.getByLabelText("Title", { exact: true }));
    await user.click(screen.getByRole("button", { name: "Publish courses" }));

    expect(put).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("title must be at least 2 characters");
  });

  it("blocks publish when a new course is still empty", async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <MemoryRouter>
        <AdminCoursesPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("button", { name: "Add course" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add course" }));
    await user.click(screen.getByRole("button", { name: "Publish courses" }));

    expect(put).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("title must be at least 2 characters");
  });

  it("blocks publish when two courses share a slug", async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <MemoryRouter>
        <AdminCoursesPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("button", { name: "Add course" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add course" }));
    expect(screen.getByLabelText("Title", { exact: true })).toHaveValue("");
    await user.type(screen.getByLabelText("Title", { exact: true }), "Spring copy");
    await user.clear(screen.getByLabelText("Slug"));
    await user.type(screen.getByLabelText("Slug"), "spring-boot-masterclass");
    await user.clear(screen.getByLabelText("Short description"));
    await user.type(screen.getByLabelText("Short description"), "A second take on Spring Boot.");
    await user.type(screen.getByLabelText("Module title"), "Fundamentals");
    await user.type(screen.getByLabelText("Lesson title"), "Introduction");
    await user.click(screen.getByRole("button", { name: "Publish courses" }));

    expect(put).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("slug must be unique");
  });
});
