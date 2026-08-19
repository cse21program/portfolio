import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NewsletterForm } from "@/features/blog/NewsletterForm";
import { apiPost } from "@/lib/api";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    apiPost: vi.fn(),
  };
});

const post = vi.mocked(apiPost);

describe("NewsletterForm", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("subscribes an email address", async () => {
    post.mockResolvedValue({ subscriber: { id: "1", email: "reader@example.com" } });
    const user = userEvent.setup();
    render(<NewsletterForm />);

    await user.type(screen.getByLabelText("Newsletter email"), "reader@example.com");
    await user.click(screen.getByRole("button", { name: "Subscribe" }));

    expect(post).toHaveBeenCalledWith("/newsletter", {
      email: "reader@example.com",
      name: "",
    });
    expect(await screen.findByText("You're on the list.")).toBeInTheDocument();
  });
});
