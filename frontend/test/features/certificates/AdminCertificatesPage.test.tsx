import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet, apiPut } from "@/lib/api";
import { AdminCertificatesPage } from "@/features/certificates/AdminCertificatesPage";

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

const seeded = {
  id: "b2e2d9f1-0000-4000-8000-000000000081",
  title: "AWS Cloud Practitioner path",
  slug: "aws-foundations",
  organization: "Amazon Web Services",
  issueDate: "In progress",
  expiryDate: "",
  credentialId: "",
  skill: "AWS",
  featured: true,
  description: "Foundations across IAM and VPC.",
  imageUrl: null,
  documentUrl: null,
  documentName: null,
  verificationUrl: null,
  status: "published",
  publishedAt: "2026-01-01",
  seoTitle: "",
  seoDescription: "",
  sortOrder: 0,
};

describe("AdminCertificatesPage", () => {
  beforeEach(() => {
    get.mockReset();
    put.mockReset();
    get.mockResolvedValue({ certificates: [seeded] });
    put.mockResolvedValue({
      certificates: [{ ...seeded, title: "AWS Cloud Practitioner" }],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads published records and publishes edits", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AdminCertificatesPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Certificates" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByLabelText("Title")).toHaveValue("AWS Cloud Practitioner path");
    expect(screen.getByLabelText("Slug")).toHaveValue("aws-foundations");
    expect(screen.getByRole("link", { name: "Preview" })).toHaveAttribute(
      "href",
      "/certificates/aws-foundations?preview=1",
    );

    await user.clear(screen.getByLabelText("Title"));
    await user.type(screen.getByLabelText("Title"), "AWS Cloud Practitioner");
    await user.click(screen.getByRole("button", { name: "Publish certificates" }));

    await waitFor(() => {
      expect(put).toHaveBeenCalled();
    });

    expect(put).toHaveBeenCalledWith(
      "/certificates",
      expect.objectContaining({
        certificates: [
          expect.objectContaining({
            title: "AWS Cloud Practitioner",
            slug: "aws-foundations",
            status: "published",
          }),
        ],
      }),
    );
    expect(await screen.findByText("Certificates published.")).toBeInTheDocument();
  });
});
