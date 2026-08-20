import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ServiceDetailPage } from "@/features/services/ServiceDetailPage";
import { ServicesPage } from "@/features/services/ServicesPage";
import { expandFilters } from "../../helpers/expandFilters";

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

const apiServices = [
  {
    slug: "backend-development",
    title: "Backend API development",
    shortDescription: "Production APIs in Spring Boot or Node.js.",
    description: "From domain model to deployed API with a handover another engineer can extend.",
    startingPrice: "$1,200",
    pricingType: "Starting from",
    deliveryTime: "2–6 weeks",
    featured: true,
    available: true,
    category: "Backend",
    features: ["Auth and role-based access"],
    technologies: ["Spring Boot"],
    faq: [{ question: "Which stack?", answer: "Spring Boot or Express + TypeScript." }],
    packages: [{ name: "API slice", price: "$1,200", deliveryTime: "2 weeks", features: ["One bounded context"] }],
    status: "published",
    publishedAt: "2026-08-01",
  },
  {
    slug: "architecture-review",
    title: "Architecture review",
    shortDescription: "A structured look at an existing backend.",
    description: "I read the code, the deploy path, and the failure modes.",
    startingPrice: "$400",
    pricingType: "Fixed price",
    deliveryTime: "5–10 days",
    featured: false,
    available: true,
    category: "Review",
    features: ["Written review"],
    technologies: ["Backend"],
    faq: [],
    packages: [],
    status: "published",
    publishedAt: "2025-11-01",
  },
];

function jsonResponse(data: unknown) {
  return {
    ok: true,
    status: 200,
    text: async () => JSON.stringify({ success: true, data }),
  };
}

describe("ServicesPage", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ services: apiServices })));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("lists published services from the API", async () => {
    render(
      <MemoryRouter>
        <ServicesPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Backend API development" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Backend API development/ })).toHaveAttribute(
      "href",
      "/services/backend-development",
    );
    expect(screen.getByText("Architecture review")).toBeInTheDocument();
  });

  it("filters services by search and category", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ServicesPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Backend API development" })).toBeInTheDocument();
    await user.type(screen.getByLabelText("Search services"), "Architecture");
    expect(screen.queryByRole("heading", { name: "Backend API development" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Architecture review" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear" }));
    await expandFilters(user);
    await user.click(
      within(screen.getByRole("group", { name: "Filter by category" })).getByRole("button", { name: "Backend" }),
    );
    expect(screen.getByRole("heading", { name: "Backend API development" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Architecture review" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear" }));
    await user.click(
      within(screen.getByRole("group", { name: "Filter by year" })).getByRole("button", { name: "2025" }),
    );
    expect(screen.getByRole("heading", { name: "Architecture review" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Backend API development" })).not.toBeInTheDocument();
  });
});

describe("ServiceDetailPage", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((input: RequestInfo) => {
        const url = String(input);
        if (url.includes("/services/backend-development")) {
          return Promise.resolve(
            jsonResponse({ service: apiServices[0], related: [apiServices[1]] }),
          );
        }
        return Promise.resolve(jsonResponse({ services: apiServices }));
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("shows a request path for guests", async () => {
    render(
      <MemoryRouter initialEntries={["/services/backend-development"]}>
        <Routes>
          <Route path="/services/:slug" element={<ServiceDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Backend API development" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in to request" })).toHaveAttribute("href", "/login");
    expect(screen.getByText("API slice")).toBeInTheDocument();
  });
});
