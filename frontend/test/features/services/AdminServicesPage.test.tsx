import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet } from "@/lib/api";
import { AdminServicesPage } from "@/features/services/AdminServicesPage";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    apiGet: vi.fn(),
    apiPut: vi.fn(),
  };
});

const get = vi.mocked(apiGet);

describe("AdminServicesPage", () => {
  beforeEach(() => {
    get.mockReset();
    get.mockResolvedValue({
      services: [
        {
          slug: "architecture-review",
          title: "Architecture review",
          shortDescription: "A structured look at an existing backend.",
          description: "I read the code, the deploy path, and the failure modes for a written review.",
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
        },
      ],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads the catalog for editing", async () => {
    render(
      <MemoryRouter>
        <AdminServicesPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Architecture review" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save services" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Add service" })).toBeInTheDocument();
  });
});
