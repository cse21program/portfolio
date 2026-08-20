import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "@/features/auth/AuthContext";
import { CourseDetailPage } from "@/features/courses/CourseDetailPage";
import { CoursesPage } from "@/features/courses/CoursesPage";
import { flattenLessons, type CourseModule } from "@/types/course";
import type { AuthUser } from "@/types/auth";
import type { CourseAccess } from "@/types/enrollment";

vi.mock("@/features/auth/AuthContext", () => ({
  useAuth: vi.fn(() => ({
    user: null,
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
  })),
}));

const mockedAuth = vi.mocked(useAuth);

const guestAuth = {
  user: null,
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
};

const customerUser: AuthUser = {
  id: "user-1",
  email: "student@example.com",
  name: "Student",
  role: "CUSTOMER",
  emailVerified: true,
  status: "ACTIVE",
  hasPassword: true,
  googleLinked: false,
};

const apiCourses = [
  {
    id: "course-1",
    title: "Production-grade Spring Boot",
    slug: "spring-boot-masterclass",
    subtitle: "APIs, security, persistence, and deployment.",
    description: "A structured course for building Spring Boot services that survive real traffic.",
    difficulty: "Intermediate",
    duration: "18 hours",
    thumbnailUrl: null,
    skill: "Spring Boot",
    category: "Backend",
    relatedSkillSlugs: [],
    relatedTutorialSlugs: [],
    relatedCourseSlugs: ["production-docker"],
    price: "$149",
    salePrice: "$99",
    free: false,
    featured: true,
    certificateAvailable: true,
    outcomes: ["Design REST resources with consistent errors"],
    requirements: ["Java 21"],
    modules: [
      {
        title: "Fundamentals",
        summary: "Packages and configuration.",
        lessons: [
          {
            title: "Application structure",
            summary: "Packages that match how the service changes.",
            kind: "text",
            body: [
              "A Spring Boot service that will last more than a weekend needs a package layout.",
              "## What belongs where",
              "- Controllers stay thin\n- Services own use cases",
            ],
          },
          {
            title: "Configuration",
            summary: "Typed properties and profiles.",
            kind: "text",
            body: ["Configuration belongs in application.yml with a documented prefix."],
          },
          {
            title: "API error contract",
            summary: "Check that you can tell a bad payload from a missing row.",
            kind: "quiz",
            quiz: {
              passingScore: 70,
              questions: [
                {
                  prompt: "A client sends page=-1. What should the API return?",
                  choices: ["500 with a Hibernate message", "400 with a stable error code"],
                  answerIndex: 1,
                  explanation: "Shape errors are 400.",
                },
              ],
            },
          },
          {
            title: "Operations checklist",
            summary: "The PDF you actually print before a first deploy.",
            kind: "pdf",
            pdfs: [
              {
                label: "Spring Boot reference (PDF)",
                url: "https://docs.spring.io/spring-boot/docs/3.4.5/reference/pdf/spring-boot-reference.pdf",
                fileName: "spring-boot-reference.pdf",
              },
            ],
          },
          {
            title: "Lock one privileged action",
            summary: "Prove a customer cannot call an admin write.",
            kind: "assignment",
            assignment: {
              brief: ["Pick one mutating admin endpoint."],
              requirements: ["One allow test and one deny test"],
              submission: "link",
              dueNote: "After the Security module.",
            },
          },
        ],
      },
    ],
    publishedAt: "2026-04-12",
    status: "published",
    seoTitle: "Production-grade Spring Boot",
    seoDescription: "APIs, security, persistence, and deployment.",
    canonicalUrl: "",
  },
  {
    id: "course-2",
    title: "Production Docker",
    slug: "production-docker",
    subtitle: "From laptop Compose files to images you can promote.",
    description: "Learn the Docker habits that keep APIs, databases, and workers reproducible.",
    difficulty: "Beginner",
    duration: "8 hours",
    thumbnailUrl: null,
    skill: "Docker",
    category: "DevOps",
    relatedSkillSlugs: [],
    relatedTutorialSlugs: [],
    relatedCourseSlugs: [],
    price: "$79",
    free: false,
    featured: true,
    outcomes: ["Write Dockerfiles you are willing to ship"],
    modules: [
      {
        title: "Foundations",
        lessons: [{ title: "Images", summary: "Layers and tagging.", body: ["An image is a stack of layers."] }],
      },
    ],
    publishedAt: "2026-05-20",
    status: "published",
  },
  {
    id: "course-free",
    title: "HTTP from zero",
    slug: "http-from-zero",
    subtitle: "Requests and status codes.",
    description: "A short free course that covers how HTTP actually works.",
    difficulty: "Beginner",
    duration: "3 hours",
    thumbnailUrl: null,
    skill: "HTTP",
    category: "Backend",
    relatedSkillSlugs: [],
    relatedTutorialSlugs: [],
    relatedCourseSlugs: [],
    price: "Free",
    free: true,
    featured: false,
    outcomes: ["Name the parts of an HTTP request"],
    modules: [
      {
        title: "Foundations",
        lessons: [
          {
            title: "Status codes",
            summary: "4xx is the client.",
            kind: "text",
            body: ["A 404 means the resource is missing, not that the process crashed."],
          },
        ],
      },
    ],
    publishedAt: "2026-08-01",
    status: "published",
  },
  {
    id: "course-3",
    title: "Draft catalog item",
    slug: "draft-catalog-item",
    subtitle: "Not ready.",
    description: "Not ready for the public site yet.",
    difficulty: "Beginner",
    duration: "1 hour",
    thumbnailUrl: null,
    skill: "Docker",
    relatedSkillSlugs: [],
    relatedTutorialSlugs: [],
    relatedCourseSlugs: [],
    price: "$29",
    free: false,
    featured: false,
    outcomes: [],
    modules: [{ title: "Notes", lessons: [{ title: "Outline", summary: "Still writing." }] }],
    publishedAt: "2026-08-01",
    status: "draft",
  },
];

function jsonResponse(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () =>
      JSON.stringify(
        status >= 200 && status < 300
          ? { success: true, data }
          : { success: false, error: { code: "NOT_FOUND", message: "Not found" } },
      ),
  };
}

const openAccess: CourseAccess = { enrolled: true, canReadLessons: true, status: "active" };
const closedAccess: CourseAccess = { enrolled: false, canReadLessons: false, status: null };

function courseFromUrl(url: string) {
  const match = url.match(/\/courses\/([^/?]+)$/);
  const slug = match?.[1];
  if (!slug || slug === "v1") {
    return undefined;
  }
  return apiCourses.find((item) => item.slug === slug);
}

function mockFetch(accessBySlug: Record<string, CourseAccess> = {}) {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = (init?.method ?? "GET").toUpperCase();
    if (url.includes("/skills") || url.includes("/tutorials")) {
      return jsonResponse({ skills: [], tutorials: [] });
    }
    if (url.includes("/enrollments") && method === "PUT") {
      return jsonResponse({ enrollment: { id: "enroll-1", status: "active" } });
    }
    if (url.includes("/enrollments") && method === "POST") {
      return jsonResponse({ enrollment: { id: "enroll-1", status: "active", courseSlug: "http-from-zero" } }, 201);
    }
    if (url.includes("/courses/") && !url.endsWith("/courses") && !url.endsWith("/courses/")) {
      const course = courseFromUrl(url);
      if (!course || course.status === "draft") {
        return jsonResponse(null, 404);
      }
      const access = accessBySlug[course.slug] ?? closedAccess;
      const lessons = flattenLessons(course.modules as CourseModule[]);
      const progress = access.enrolled
        ? {
            lessonsTotal: lessons.length,
            lessonsCompleted: 0,
            lessonsRemaining: lessons.length,
            percent: 0,
            currentLesson: lessons[0]
              ? {
                  key: lessons[0].key,
                  title: lessons[0].lesson.title,
                  moduleTitle: lessons[0].moduleTitle,
                  index: 0,
                }
              : null,
            lastActivityAt: "2026-08-19T10:00:00.000Z",
            completedKeys: [],
            completed: false,
          }
        : null;
      return jsonResponse({
        course,
        related: apiCourses.filter((item) => item.slug !== course.slug && item.status !== "draft"),
        access,
        progress,
      });
    }
    if (url.includes("/courses")) {
      return jsonResponse({ courses: apiCourses });
    }
    return jsonResponse({});
  });
}

describe("CoursesPage", () => {
  beforeEach(() => {
    mockedAuth.mockReturnValue(guestAuth);
    vi.stubGlobal("fetch", mockFetch());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("renders published courses and hides drafts", async () => {
    render(
      <MemoryRouter>
        <CoursesPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Learn in sequence" })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Production-grade Spring Boot" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Production Docker" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Draft catalog item" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Beginner" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Intermediate" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Featured" })).toBeInTheDocument();
  });

  it("filters by search, difficulty, and skill", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <CoursesPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Production-grade Spring Boot" })).toBeInTheDocument();

    await user.type(screen.getByLabelText("Search courses"), "docker");
    expect(screen.queryByRole("heading", { name: "Production-grade Spring Boot" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Production Docker" })).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Search courses"));
    await user.click(screen.getByRole("button", { name: "Beginner" }));
    expect(screen.getByRole("heading", { name: "Production Docker" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Production-grade Spring Boot" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "All" }));
    await user.click(
      within(screen.getByRole("group", { name: "Filter by skill" })).getByRole("button", {
        name: "Docker",
      }),
    );
    expect(screen.getByRole("heading", { name: "Production Docker" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Production-grade Spring Boot" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.getByRole("heading", { name: "Production-grade Spring Boot" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Production Docker" })).toBeInTheDocument();
  });

  it("renders a premium course outline and inquire link without lesson bodies", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    if (navigator.clipboard && "writeText" in navigator.clipboard) {
      vi.spyOn(navigator.clipboard, "writeText").mockImplementation(writeText);
    } else {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText },
      });
    }

    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/courses/spring-boot-masterclass"]}>
        <Routes>
          <Route path="/courses/:slug" element={<CourseDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Production-grade Spring Boot" })).toBeInTheDocument();
    expect(
      screen.queryByText("A Spring Boot service that will last more than a weekend needs a package layout."),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Lesson content is for enrolled students")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Related courses" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Inquire to enroll" })).toHaveAttribute(
      "href",
      "/contact?subject=Course%20enrollment%3A%20Production-grade%20Spring%20Boot",
    );
    expect(screen.getByRole("link", { name: "Sign in to add to cart" })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("button", { name: "View outline" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Course contents" })).toBeInTheDocument();
    await waitFor(() => {
      expect(document.title).toBe("Production-grade Spring Boot");
    });

    await user.click(screen.getByRole("button", { name: "Copy link" }));
    expect(writeText).toHaveBeenCalled();
    expect(await screen.findByRole("button", { name: "Link copied" })).toBeInTheDocument();

    const contents = screen.getByRole("navigation", { name: "Course contents" });
    await user.click(within(contents).getByRole("link", { name: /Configuration/ }));
    expect(screen.getByRole("heading", { level: 2, name: "Configuration" })).toBeInTheDocument();
    expect(screen.getByText("Lesson content is for enrolled students")).toBeInTheDocument();
  });

  it("renders quiz, PDF, assignment, and rich text when the student can read lessons", async () => {
    vi.stubGlobal("fetch", mockFetch({ "spring-boot-masterclass": openAccess }));
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/courses/spring-boot-masterclass"]}>
        <Routes>
          <Route path="/courses/:slug" element={<CourseDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "What belongs where" })).toBeInTheDocument();
    expect(screen.getByText("Controllers stay thin")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument();

    const contents = screen.getByRole("navigation", { name: "Course contents" });
    await user.click(within(contents).getByRole("link", { name: /API error contract/ }));
    await user.click(screen.getByRole("radio", { name: "400 with a stable error code" }));
    await user.click(screen.getByRole("button", { name: "Check answers" }));
    expect(screen.getByRole("status")).toHaveTextContent("Passed");

    await user.click(within(contents).getByRole("link", { name: /Operations checklist/ }));
    expect(screen.getByRole("link", { name: /Spring Boot reference/ })).toHaveAttribute(
      "href",
      "https://docs.spring.io/spring-boot/docs/3.4.5/reference/pdf/spring-boot-reference.pdf",
    );

    await user.click(within(contents).getByRole("link", { name: /Lock one privileged action/ }));
    expect(screen.getByText("One allow test and one deny test")).toBeInTheDocument();
    expect(screen.getByText(/File drop-off is not live yet/)).toBeInTheDocument();
  });

  it("lets a signed-in student enroll in a free course", async () => {
    mockedAuth.mockReturnValue({ ...guestAuth, user: customerUser });
    vi.stubGlobal("fetch", mockFetch());
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/courses/http-from-zero"]}>
        <Routes>
          <Route path="/courses/:slug" element={<CourseDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("button", { name: "Enroll" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Inquire to enroll" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Enroll" }));
    await waitFor(() => {
      expect(vi.mocked(fetch).mock.calls.some((entry) => String(entry[0]).includes("/enrollments"))).toBe(true);
    });
  });

  it("lets an enrolled student mark a lesson complete", async () => {
    mockedAuth.mockReturnValue({ ...guestAuth, user: customerUser });
    vi.stubGlobal("fetch", mockFetch({ "http-from-zero": openAccess }));
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/courses/http-from-zero"]}>
        <Routes>
          <Route path="/courses/:slug" element={<CourseDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("button", { name: "Mark complete" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Mark complete" }));
    await waitFor(() => {
      expect(
        vi.mocked(fetch).mock.calls.some(
          (entry) => String(entry[0]).includes("/enrollments/http-from-zero/progress") && entry[1]?.method === "PUT",
        ),
      ).toBe(true);
    });
  });

  it("returns not found for a draft slug", async () => {
    render(
      <MemoryRouter initialEntries={["/courses/draft-catalog-item"]}>
        <Routes>
          <Route path="/courses/:slug" element={<CourseDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Course not found")).toBeInTheDocument();
  });
});
