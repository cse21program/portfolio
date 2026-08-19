import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet, apiPatch } from "@/lib/api";
import { AdminLeadsPage } from "@/features/contact/AdminLeadsPage";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    apiGet: vi.fn(),
    apiPatch: vi.fn(),
  };
});

const get = vi.mocked(apiGet);
const patch = vi.mocked(apiPatch);

describe("AdminLeadsPage", () => {
  beforeEach(() => {
    get.mockReset();
    patch.mockReset();
    get.mockResolvedValue({
      inquiries: [
        {
          id: "lead-1",
          name: "Ada",
          email: "ada@example.com",
          phone: "",
          company: "Northwind",
          subject: "Need a production API review",
          serviceSlug: "architecture-review",
          serviceTitle: "Architecture review",
          budget: "$400",
          message: "Please look at the error contract.",
          attachmentUrl: null,
          status: "new",
          adminNote: "",
          userId: null,
          createdAt: "2026-08-20T00:00:00.000Z",
          updatedAt: "2026-08-20T00:00:00.000Z",
          readAt: null,
        },
      ],
    });
    patch.mockResolvedValue({
      inquiry: {
        id: "lead-1",
        status: "contacted",
        adminNote: "",
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lists inquiries and updates status", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AdminLeadsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Need a production API review" })).toBeInTheDocument();
    expect(screen.getByText(/ada@example.com/)).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Status"), "contacted");
    expect(patch).toHaveBeenCalledWith("/contact/lead-1", { status: "contacted" });
  });
});
