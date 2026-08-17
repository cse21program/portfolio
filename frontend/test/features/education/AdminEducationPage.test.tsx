import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet, apiPut } from "@/lib/api";
import { AdminEducationPage } from "@/features/education/AdminEducationPage";

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
    id: "b2e2d9f1-0000-4000-8000-000000000001",
    institution: "Leading University",
    degree: "B.Sc.",
    field: "Computer Science & Engineering",
    startDate: "Ongoing",
    endDate: "Present",
    current: true,
    grade: "",
    location: "Sylhet, Bangladesh",
    description: "Core computer science.",
    achievements: ["Build software alongside academic work"],
    logoUrl: null,
    documentUrl: null,
    documentName: null,
    website: "https://www.lus.ac.bd/",
    sortOrder: 0,
  },
];

describe("AdminEducationPage", () => {
  beforeEach(() => {
    get.mockReset();
    put.mockReset();
    get.mockResolvedValue({ education: seeded });
    put.mockResolvedValue({
      education: [{ ...seeded[0]!, institution: "City College" }],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads published records and publishes edits", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AdminEducationPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Education" })).toBeInTheDocument();
    expect(screen.getByLabelText("Institution")).toHaveValue("Leading University");
    expect(screen.getByLabelText("Degree")).toHaveValue("B.Sc.");

    await user.clear(screen.getByLabelText("Institution"));
    await user.type(screen.getByLabelText("Institution"), "City College");
    await user.click(screen.getByRole("button", { name: "Publish education" }));

    await waitFor(() => {
      expect(put).toHaveBeenCalled();
    });

    expect(put).toHaveBeenCalledWith(
      "/education",
      expect.objectContaining({
        education: [
          expect.objectContaining({
            institution: "City College",
            degree: "B.Sc.",
            current: true,
          }),
        ],
      }),
    );
    expect(await screen.findByText("Education published.")).toBeInTheDocument();
  });

  it("blocks publish when an institution is missing", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AdminEducationPage />
      </MemoryRouter>,
    );

    expect(await screen.findByLabelText("Institution")).toBeInTheDocument();
    await user.clear(screen.getByLabelText("Institution"));
    await user.click(screen.getByRole("button", { name: "Publish education" }));

    expect(put).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("institution must be at least 2 characters");
  });
});
