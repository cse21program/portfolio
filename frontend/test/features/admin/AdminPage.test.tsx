import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "@/features/auth/AuthContext";
import { AdminPage } from "@/features/admin/AdminPage";
import { apiGet } from "@/lib/api";
import type { AuthUser } from "@/types/auth";
import type { AdminDashboard } from "@/types/dashboard";

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

const admin: AuthUser = {
  id: "admin-1",
  email: "hello@rezaul.dev",
  name: "Rezaul Karim",
  imageUrl: null,
  phone: "",
  country: "",
  notifyProduct: true,
  notifyMarketing: false,
  role: "ADMIN",
  emailVerified: true,
  status: "ACTIVE",
  hasPassword: true,
  googleLinked: false,
};

const dashboard: AdminDashboard = {
  generatedAt: "2026-08-21T08:20:00.000Z",
  metrics: {
    visitors: 1284,
    pageviews: 3120,
    users: 42,
    courses: 2,
    students: 18,
    orders: 11,
    revenueCents: 132800,
    revenueLabel: "$1,328",
    courseRevenueCents: 12800,
    courseRevenueLabel: "$128",
    serviceRevenueCents: 120000,
    serviceRevenueLabel: "$1,200",
  },
  attention: [
    { label: "Awaiting payment", count: 2, href: "/admin/orders" },
    { label: "Pending service requests", count: 1, href: "/admin/service-orders" },
  ],
  recentOrders: [
    {
      title: "RK-20260821-AAAA",
      meta: "Paid · $99 · Ada Lovelace",
      href: "/admin/orders",
    },
  ],
  pendingServiceOrders: [
    {
      title: "Architecture review",
      meta: "Ada · $400",
      href: "/admin/service-orders",
    },
  ],
  popularCourses: [
    {
      title: "Production-grade Spring Boot",
      meta: "12 students",
      href: "/admin/courses#spring-boot-masterclass",
    },
  ],
  popularTutorials: [],
  popularBlogs: [],
};

describe("AdminPage", () => {
  beforeEach(() => {
    mockedAuth.mockReturnValue({
      user: admin,
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
    get.mockResolvedValue({ dashboard });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders Studio metrics, queues, and shortcuts", async () => {
    render(
      <MemoryRouter>
        <AdminPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Rezaul, here is the business" })).toBeInTheDocument();
    expect(await screen.findByText("1,284")).toBeInTheDocument();
    expect(screen.getByText("3,120 views")).toBeInTheDocument();
    expect(screen.getByLabelText("Visitors, 1,284, 3,120 views")).toBeInTheDocument();
    expect(screen.getByText("Registered users").closest("div")).toHaveTextContent("42");
    expect(screen.getByRole("link", { name: "Courses, 2" })).toHaveAttribute("href", "/admin/courses");
    expect(screen.getByRole("link", { name: "Students, 18" })).toHaveAttribute("href", "/admin/enrollments");
    expect(screen.getByRole("link", { name: "Orders, 11" })).toHaveAttribute("href", "/admin/orders");
    expect(screen.getByRole("link", { name: "Revenue, $1,328" })).toHaveAttribute("href", "/admin/orders");
    expect(screen.getByRole("link", { name: "Course revenue, $128" })).toHaveAttribute("href", "/admin/courses");
    expect(screen.getByRole("link", { name: "Service revenue, $1,200" })).toHaveAttribute("href", "/admin/services");

    expect(screen.getByRole("heading", { name: "Needs attention" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Awaiting payment/ })).toHaveAttribute("href", "/admin/orders");
    expect(screen.getByRole("link", { name: /Pending service requests/ })).toHaveAttribute(
      "href",
      "/admin/service-orders",
    );

    expect(screen.getByText("RK-20260821-AAAA")).toBeInTheDocument();
    expect(screen.getByText("Architecture review")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Production-grade Spring Boot/ })).toHaveAttribute(
      "href",
      "/admin/courses#spring-boot-masterclass",
    );
    expect(screen.getByText("No paid tutorial sales yet.")).toBeInTheDocument();
    expect(screen.getByText("No blog engagement yet.")).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: "Jump to" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Media" })).toHaveAttribute("href", "/admin/media");
    expect(screen.getByRole("link", { name: "Videos" })).toHaveAttribute("href", "/admin/videos");
    expect(screen.getByRole("link", { name: "Leads" })).toHaveAttribute("href", "/admin/leads");
  });
});
