import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { UnsubscribePage } from "@/features/blog/UnsubscribePage";
import { apiPost } from "@/lib/api";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    apiPost: vi.fn(),
  };
});

const post = vi.mocked(apiPost);

describe("UnsubscribePage", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("unsubscribes after confirmation", async () => {
    post.mockResolvedValue(null);
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/unsubscribe?token=abc123abc123abc123"]}>
        <Routes>
          <Route path="/unsubscribe" element={<UnsubscribePage />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Unsubscribe" }));
    expect(post).toHaveBeenCalledWith("/newsletter/unsubscribe", { token: "abc123abc123abc123" });
    expect(await screen.findByText("You are unsubscribed.")).toBeInTheDocument();
  });
});
