import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet, apiPut } from "@/lib/api";
import { AdminFieldsPage } from "@/features/skills/AdminFieldsPage";

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
    id: "b2e2d9f1-0000-4000-8000-000000000031",
    name: "Backend Development",
    slug: "backend-development",
    summary: "APIs, domain models, and services that stay stable as systems grow.",
    overview: "Clear boundaries and APIs that stay readable.",
    iconUrl: null,
    thumbnailUrl: null,
    bannerUrl: null,
    videoUrl: null,
    embedVideoUrl: null,
    featured: true,
    published: true,
    seoTitle: "",
    seoDescription: "",
    sortOrder: 0,
  },
];

describe("AdminFieldsPage", () => {
  beforeEach(() => {
    get.mockReset();
    put.mockReset();
    get.mockResolvedValue({ fields: seeded });
    put.mockResolvedValue({
      fields: [{ ...seeded[0]!, name: "Backend Systems" }],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads published records and publishes edits", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AdminFieldsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Fields" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Name")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View public page →" })).toHaveAttribute("href", "/skills");

    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByLabelText("Name")).toHaveValue("Backend Development");
    expect(screen.getByLabelText("Slug")).toHaveValue("backend-development");

    await user.clear(screen.getByLabelText("Name"));
    await user.type(screen.getByLabelText("Name"), "Backend Systems");
    await user.click(screen.getByRole("button", { name: "Publish fields" }));

    await waitFor(() => {
      expect(put).toHaveBeenCalled();
    });

    expect(put).toHaveBeenCalledWith(
      "/fields",
      expect.objectContaining({
        fields: [
          expect.objectContaining({
            name: "Backend Systems",
            slug: "backend-development",
            featured: true,
          }),
        ],
      }),
    );
    expect(await screen.findByText("Fields published.")).toBeInTheDocument();
  });

  it("blocks publish when a name is missing", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AdminFieldsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("button", { name: "Edit" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    await user.clear(screen.getByLabelText("Name"));
    await user.click(screen.getByRole("button", { name: "Publish fields" }));

    expect(put).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("name must be at least 2 characters");
  });

  it("blocks publish when the summary is too short", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AdminFieldsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("button", { name: "Edit" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByLabelText("Summary")).toBeInTheDocument();
    await user.clear(screen.getByLabelText("Summary"));
    await user.type(screen.getByLabelText("Summary"), "Short");
    await user.click(screen.getByRole("button", { name: "Publish fields" }));

    expect(put).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("summary must be at least 8 characters");
  });

  it("blocks publish when the embed URL is not YouTube or Vimeo", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AdminFieldsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("button", { name: "Edit" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByLabelText("YouTube or Vimeo URL")).toBeInTheDocument();
    await user.type(screen.getByLabelText("YouTube or Vimeo URL"), "https://example.com/watch");
    await user.click(screen.getByRole("button", { name: "Publish fields" }));

    expect(put).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "embed must be a YouTube or Vimeo https URL",
    );
  });

  it("blocks publish when a new field is still empty", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AdminFieldsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("button", { name: "Add field" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add field" }));
    await user.click(screen.getByRole("button", { name: "Publish fields" }));

    expect(put).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("name must be at least 2 characters");
  });

  it("blocks publish when two fields share a slug", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AdminFieldsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("button", { name: "Add field" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add field" }));
    expect(screen.getByLabelText("Name")).toHaveValue("");
    await user.type(screen.getByLabelText("Name"), "Backend Copy");
    await user.clear(screen.getByLabelText("Slug"));
    await user.type(screen.getByLabelText("Slug"), "backend-development");
    await user.type(screen.getByLabelText("Summary"), "Same slug as the first field.");
    await user.click(screen.getByRole("button", { name: "Publish fields" }));

    expect(put).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("slug must be unique");
  });
});
