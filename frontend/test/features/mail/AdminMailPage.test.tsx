import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet, apiPatch, apiPost, apiPut } from "@/lib/api";
import { AdminMailPage } from "@/features/mail/AdminMailPage";
import type { AdminMailProvider, AdminMailSettings } from "@/types/mail";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    apiGet: vi.fn(),
    apiPatch: vi.fn(),
    apiPost: vi.fn(),
    apiPut: vi.fn(),
  };
});

const get = vi.mocked(apiGet);
const patch = vi.mocked(apiPatch);
const post = vi.mocked(apiPost);
const put = vi.mocked(apiPut);

const ses: AdminMailProvider = {
  id: "ses",
  name: "Amazon SES",
  hint: "Sends through SES SMTP with Nodemailer.",
  ready: false,
  active: false,
  fields: [
    {
      key: "fromEmail",
      label: "From email",
      hint: "Must be a verified identity in SES.",
      type: "text",
      required: true,
      configured: false,
      value: "",
    },
    {
      key: "user",
      label: "SMTP username",
      hint: "From SES SMTP settings.",
      type: "text",
      required: true,
      configured: false,
      value: "",
    },
  ],
};

const smtp: AdminMailProvider = {
  id: "smtp",
  name: "SMTP",
  hint: "Sends through Nodemailer over SMTP.",
  ready: false,
  active: false,
  fields: [
    {
      key: "host",
      label: "SMTP host",
      hint: "For example smtp.gmail.com.",
      type: "text",
      required: true,
      configured: false,
      value: "",
    },
    {
      key: "password",
      label: "Password",
      hint: "SMTP password or app password.",
      type: "password",
      required: true,
      configured: false,
    },
  ],
};

const settings: AdminMailSettings = {
  transport: "log",
  active: "",
  fromEmail: "hello@rezaul.dev",
  fromName: "Rezaul Karim",
  providers: [ses, smtp],
};

describe("AdminMailPage", () => {
  beforeEach(() => {
    get.mockReset();
    patch.mockReset();
    post.mockReset();
    put.mockReset();
    get.mockResolvedValue(settings);
    patch.mockResolvedValue({
      provider: {
        ...ses,
        ready: true,
        active: true,
        fields: ses.fields.map((field) =>
          field.key === "fromEmail" ? { ...field, configured: true, value: "hello@rezaul.dev" } : field,
        ),
      },
    });
    post.mockResolvedValue({ to: "admin@example.com", provider: "ses" });
  });

  afterEach(() => {
    get.mockReset();
    patch.mockReset();
    post.mockReset();
    put.mockReset();
  });

  it("saves SES from Studio and can send a test", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AdminMailPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Email" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Amazon SES" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "SMTP" })).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "Configure" })[0]!);
    await user.type(screen.getByLabelText("From email"), "hello@rezaul.dev");
    await user.click(screen.getByRole("button", { name: "Use Amazon SES for sending" }));

    expect(patch).toHaveBeenCalledTimes(1);
    expect(patch).toHaveBeenCalledWith("/mail/admin/providers/ses", {
      credentials: { fromEmail: "hello@rezaul.dev" },
      activate: true,
    });
    expect(await screen.findByText(/Outbound mail now uses Amazon SES/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Send test" }));
    expect(post).toHaveBeenCalledWith("/mail/admin/test", { provider: "ses" });
    expect(await screen.findByText(/Test sent to admin@example.com/)).toBeInTheDocument();
  });

  it("pauses sending from the outbound card", async () => {
    const user = userEvent.setup();
    get.mockResolvedValue({ ...settings, transport: "ses" });
    put.mockResolvedValue({ ...settings, transport: "log" });
    render(
      <MemoryRouter>
        <AdminMailPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("button", { name: "Pause sending" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Pause sending" }));
    expect(put).toHaveBeenCalledWith("/mail/admin/transport", { transport: "log" });
  });
});
