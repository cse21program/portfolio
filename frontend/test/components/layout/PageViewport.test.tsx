import { MemoryRouter, Route, Routes, Link } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PageViewport } from "@/components/layout/PageViewport";

describe("PageViewport", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("opens the next page from the top without scrolling the window", async () => {
    const user = userEvent.setup();
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);

    render(
      <MemoryRouter initialEntries={["/one"]}>
        <PageViewport>
          <Routes>
            <Route path="/one" element={<Link to="/two">Open next page</Link>} />
            <Route path="/two" element={<p>Next page</p>} />
          </Routes>
        </PageViewport>
      </MemoryRouter>,
    );

    scrollTo.mockClear();
    await user.click(screen.getByRole("link", { name: "Open next page" }));
    expect(screen.getByText("Next page")).toBeInTheDocument();
    expect(scrollTo).not.toHaveBeenCalled();
  });
});
