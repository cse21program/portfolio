import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiUpload } from "@/lib/api";
import { PdfPicker } from "@/features/resume/PdfPicker";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    apiUpload: vi.fn(),
  };
});

const upload = vi.mocked(apiUpload);

describe("PdfPicker", () => {
  beforeEach(() => {
    upload.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uploads a PDF and reports the file", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    upload.mockResolvedValue({
      url: "/api/v1/media/files/7f3c1b2a-4d5e-4f6a-8b9c-0d1e2f3a4b5c.pdf",
      kind: "document",
    });

    render(<PdfPicker url={null} fileName={null} onChange={onChange} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, new File(["%PDF"], "cv.pdf", { type: "application/pdf" }));

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith({
        url: "/api/v1/media/files/7f3c1b2a-4d5e-4f6a-8b9c-0d1e2f3a4b5c.pdf",
        fileName: "cv.pdf",
      });
    });
    expect(upload).toHaveBeenCalledWith("/media?kind=document", expect.any(File));
  });

  it("can remove an uploaded file", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <PdfPicker
        url="/api/v1/media/files/file.pdf"
        fileName="cv.pdf"
        onChange={onChange}
      />,
    );

    expect(screen.getByRole("link", { name: "cv.pdf" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(onChange).toHaveBeenCalledWith({ url: null, fileName: null });
  });
});
