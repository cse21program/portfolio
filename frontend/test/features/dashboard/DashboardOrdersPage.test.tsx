import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet } from "@/lib/api";
import { DashboardOrdersPage } from "@/features/dashboard/DashboardPage";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    apiGet: vi.fn(),
    apiDelete: vi.fn(),
  };
});

const get = vi.mocked(apiGet);

describe("DashboardOrdersPage", () => {
  beforeEach(() => {
    get.mockReset();
    get.mockResolvedValue({
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
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lists service requests", async () => {
    render(
      <MemoryRouter>
        <DashboardOrdersPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Architecture review" })).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel request" })).toBeInTheDocument();
  });
});
