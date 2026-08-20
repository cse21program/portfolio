import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet, apiPut, apiUpload } from "@/lib/api";
import { AdminResumePage } from "@/features/resume/AdminResumePage";
import { suggestedResumeDraft } from "@/features/resume/suggested";
import { fallbackResume } from "@/types/resume";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    apiGet: vi.fn(),
    apiPut: vi.fn(),
    apiUpload: vi.fn(),
  };
});

const get = vi.mocked(apiGet);
const put = vi.mocked(apiPut);
const upload = vi.mocked(apiUpload);

async function editSection(user: ReturnType<typeof userEvent.setup>, name: string) {
  const section = screen.getByRole("heading", { name }).closest("section");
  expect(section).toBeTruthy();
  await user.click(within(section!).getByRole("button", { name: "Edit" }));
}

describe("AdminResumePage", () => {
  beforeEach(() => {
    get.mockReset();
    put.mockReset();
    upload.mockReset();
    get.mockResolvedValue({
      resume: {
        ...fallbackResume,
        version: 1,
        updatedAt: "2026-08-17T00:00:00.000Z",
      },
    });
    put.mockResolvedValue({
      resume: {
        ...fallbackResume,
        ...suggestedResumeDraft,
        version: 2,
        updatedAt: "2026-08-17T01:00:00.000Z",
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fills a blank resume with site content and publishes it", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AdminResumePage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Resume" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Starter CV content is filled from the site");
    await editSection(user, "Opening");
    expect(screen.getByLabelText("Headline")).toHaveValue(suggestedResumeDraft.headline);
    await editSection(user, "Awards");
    expect(screen.getByLabelText("Award title")).toHaveValue(suggestedResumeDraft.awards[0]?.title);
    await editSection(user, "Publications");
    expect(screen.getAllByLabelText("Publication title")[0]).toHaveValue(
      suggestedResumeDraft.publications[0]?.title,
    );

    await user.click(screen.getByRole("button", { name: "Publish resume" }));

    await waitFor(() => {
      expect(put).toHaveBeenCalled();
    });

    expect(put).toHaveBeenCalledWith(
      "/portfolio/resume",
      expect.objectContaining({
        headline: suggestedResumeDraft.headline,
        summary: suggestedResumeDraft.summary,
        awards: suggestedResumeDraft.awards,
        publications: suggestedResumeDraft.publications,
        pdfUrl: null,
      }),
      { headers: { "If-Match": '"1"' } },
    );
    expect(await screen.findByText("Resume published.")).toBeInTheDocument();
  });

  it("keeps published resume content instead of replacing it", async () => {
    const user = userEvent.setup();
    get.mockResolvedValue({
      resume: {
        ...fallbackResume,
        headline: "Staff engineer",
        summary: "Already published.",
        awards: [{ title: "Dean's list", detail: "University", year: "2024", href: null }],
        publications: [],
        version: 3,
        updatedAt: "2026-08-17T02:00:00.000Z",
      },
    });

    render(
      <MemoryRouter>
        <AdminResumePage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Resume" })).toBeInTheDocument();
    await editSection(user, "Opening");
    expect(screen.getByLabelText("Headline")).toHaveValue("Staff engineer");
    await editSection(user, "Awards");
    expect(screen.getByLabelText("Award title")).toHaveValue("Dean's list");
    expect(screen.queryByText(/Starter CV content/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Publication title")).not.toBeInTheDocument();
  });

  it("saves a PDF as soon as it uploads", async () => {
    const user = userEvent.setup();
    const pdfUrl = "/api/v1/media/files/7f3c1b2a-4d5e-4f6a-8b9c-0d1e2f3a4b5c.pdf";
    upload.mockResolvedValue({ url: pdfUrl, kind: "document" });
    put.mockResolvedValue({
      resume: {
        ...fallbackResume,
        ...suggestedResumeDraft,
        pdfUrl,
        pdfFileName: "cv.pdf",
        version: 2,
        updatedAt: "2026-08-17T01:00:00.000Z",
      },
    });

    render(
      <MemoryRouter>
        <AdminResumePage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Resume" })).toBeInTheDocument();
    await editSection(user, "File");
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, new File(["%PDF"], "cv.pdf", { type: "application/pdf" }));

    await waitFor(() => {
      expect(put).toHaveBeenCalled();
    });
    expect(put).toHaveBeenCalledWith(
      "/portfolio/resume",
      expect.objectContaining({
        pdfUrl,
        pdfFileName: "cv.pdf",
        headline: suggestedResumeDraft.headline,
      }),
      { headers: { "If-Match": '"1"' } },
    );
    expect(screen.getByRole("link", { name: "cv.pdf" })).toBeInTheDocument();
  });
});
