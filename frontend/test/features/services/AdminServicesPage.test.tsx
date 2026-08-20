import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
    expect(screen.getByText(/Published · Fixed price · \$400/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Title")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save services" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Add service" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
  });

  it("expands a service card to edit", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AdminServicesPage />
      </MemoryRouter>,
    );

    await user.click(await screen.findByRole("button", { name: "Edit" }));
    expect(screen.getByLabelText("Title")).toHaveValue("Architecture review");
    expect(screen.getByRole("button", { name: "Collapse" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Collapse" }));
    expect(screen.queryByLabelText("Title")).not.toBeInTheDocument();
  });
});
