import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet, apiPut } from "@/lib/api";
import { AdminExperiencePage } from "@/features/experience/AdminExperiencePage";

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

const seeded = [
  {
    id: "a1e1c8e0-0000-4000-8000-000000000001",
    company: "Independent",
    position: "Software Engineer",
    type: "Freelance / contract",
    location: "Remote · Bangladesh",
    startDate: "2024",
    endDate: "Present",
    current: true,
    description: "Backend APIs.",
    responsibilities: ["Design modular APIs"],
    achievements: ["Shipped the public site"],
    technologies: ["TypeScript"],
    logoUrl: null,
    website: null,
    sortOrder: 0,
  },
];

describe("AdminExperiencePage", () => {
  beforeEach(() => {
    get.mockReset();
    put.mockReset();
    get.mockResolvedValue({ experiences: seeded });
    put.mockResolvedValue({
      experiences: [{ ...seeded[0]!, company: "Studio", position: "Engineer" }],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads published roles and publishes edits", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AdminExperiencePage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Experience" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByLabelText("Company", { exact: true })).toHaveValue("Independent");
    expect(screen.getByLabelText("Position")).toHaveValue("Software Engineer");

    await user.clear(screen.getByLabelText("Company", { exact: true }));
    await user.type(screen.getByLabelText("Company", { exact: true }), "Studio");
    await user.click(screen.getByRole("button", { name: "Publish experience" }));

    await waitFor(() => {
      expect(put).toHaveBeenCalled();
    });

    expect(put).toHaveBeenCalledWith(
      "/experience",
      expect.objectContaining({
        experiences: [
          expect.objectContaining({
            company: "Studio",
            position: "Software Engineer",
            current: true,
          }),
        ],
      }),
    );
    expect(await screen.findByText("Experience published.")).toBeInTheDocument();
  });

  it("blocks publish when a role is missing a company", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AdminExperiencePage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Experience" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByLabelText("Company", { exact: true })).toBeInTheDocument();
    await user.clear(screen.getByLabelText("Company", { exact: true }));
    await user.click(screen.getByRole("button", { name: "Publish experience" }));

    expect(put).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("company must be at least 2 characters");
  });
});
