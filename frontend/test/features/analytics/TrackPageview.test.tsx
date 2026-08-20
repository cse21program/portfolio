import { MemoryRouter } from "react-router-dom";
import { render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TrackPageview } from "@/features/analytics/TrackPageview";

describe("TrackPageview", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    sessionStorage.clear();
  });

  it("posts public paths once and skips Studio routes", async () => {
    const fetchMock = vi.mocked(fetch);

    const first = render(
      <MemoryRouter initialEntries={["/courses/spring-boot-masterclass"]}>
        <TrackPageview />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/v1/analytics/pageview", {
      method: "POST",
      credentials: "include",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: "/courses/spring-boot-masterclass" }),
    });

    first.unmount();
    render(
      <MemoryRouter initialEntries={["/courses/spring-boot-masterclass"]}>
        <TrackPageview />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    render(
      <MemoryRouter initialEntries={["/admin/orders"]}>
        <TrackPageview />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });
});
