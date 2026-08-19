import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet, apiPost } from "@/lib/api";
import { ContactPage } from "@/features/contact/ContactPage";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    apiGet: vi.fn(),
    apiPost: vi.fn(),
  };
});

const get = vi.mocked(apiGet);
const post = vi.mocked(apiPost);

describe("ContactPage", () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    get.mockResolvedValue({
      services: [{ slug: "architecture-review", title: "Architecture review", status: "published" }],
    });
    post.mockResolvedValue({ inquiry: { id: "1", status: "new" } });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends a hire-me inquiry to the API", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ContactPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText("Name"), "Ada");
    await user.type(screen.getByLabelText("Email"), "ada@example.com");
    await user.type(screen.getByLabelText("Subject"), "Need a production API review");
    await user.type(
      screen.getByLabelText("Message"),
      "We have a Spring Boot service that fails closed on deploy and I want a written review.",
    );
    await user.click(screen.getByRole("button", { name: "Send message" }));

    expect(post).toHaveBeenCalledWith(
      "/contact",
      expect.objectContaining({
        name: "Ada",
        email: "ada@example.com",
        subject: "Need a production API review",
      }),
    );
    expect(await screen.findByText(/I have the message/)).toBeInTheDocument();
  });
});
