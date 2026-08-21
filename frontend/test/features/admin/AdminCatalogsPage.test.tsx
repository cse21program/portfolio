import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet, apiPut } from "@/lib/api";
import { AdminCatalogsPage } from "@/features/admin/AdminCatalogsPage";
import { defaultPublicCatalogs } from "@/types/siteAccess";

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

describe("AdminCatalogsPage", () => {
  beforeEach(() => {
    get.mockReset();
    put.mockReset();
    get.mockResolvedValue({ catalogs: defaultPublicCatalogs });
    put.mockResolvedValue({ catalogs: { ...defaultPublicCatalogs, blogs: false } });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("stops a catalog and saves the public site", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AdminCatalogsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Public catalogs" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Learn" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Blog" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save public site" })).toBeDisabled();

    const blogRow = screen.getByRole("heading", { name: "Blog" }).closest("li");
    expect(blogRow).not.toBeNull();
    await user.click(within(blogRow!).getByRole("button", { name: "Stop" }));
    expect(screen.getByText("Unsaved changes")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Save public site" }));

    await waitFor(() => {
      expect(put).toHaveBeenCalledWith("/site-access", {
        catalogs: { ...defaultPublicCatalogs, blogs: false },
      });
    });
  });
});
