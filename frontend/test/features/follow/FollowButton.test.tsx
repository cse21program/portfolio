import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "@/features/auth/AuthContext";
import { useSiteAccess } from "@/features/content/SiteAccessContext";
import { FollowButton } from "@/features/follow/FollowButton";
import type { AuthUser } from "@/types/auth";
import { defaultPublicCatalogs } from "@/types/siteAccess";

vi.mock("@/features/content/SiteAccessContext", async () => {
  const actual = await vi.importActual<typeof import("@/features/content/SiteAccessContext")>(
    "@/features/content/SiteAccessContext",
  );
  return {
    ...actual,
    useSiteAccess: vi.fn(),
  };
});

const siteAccess = vi.mocked(useSiteAccess);

const reader: AuthUser = {
  id: "user-1",
  email: "reader@example.com",
  name: "Student",
  role: "CUSTOMER",
  emailVerified: true,
  status: "ACTIVE",
  hasPassword: true,
  googleLinked: false,
};

function jsonResponse(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () =>
      JSON.stringify(
        status >= 200 && status < 300
          ? { success: true, data }
          : { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      ),
  };
}

function mockFetch(user: AuthUser | null, following = false, followerCount = 0) {
  let current = { following, followerCount };
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = (init?.method ?? "GET").toUpperCase();

    if (url.includes("/auth/me")) {
      return user ? jsonResponse({ user }) : jsonResponse(null, 401);
    }
    if (method === "POST" && url.includes("/follows/studio")) {
      if (!current.following) {
        current = { following: true, followerCount: current.followerCount + 1 };
      }
      return jsonResponse(current);
    }
    if (method === "DELETE" && url.includes("/follows/studio")) {
      if (current.following) {
        current = { following: false, followerCount: Math.max(0, current.followerCount - 1) };
      }
      return jsonResponse(current);
    }
    if (url.includes("/follows/studio")) {
      return jsonResponse(current);
    }
    return jsonResponse(null, 404);
  });
}

describe("FollowButton", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    siteAccess.mockReset();
  });

  function liveFollow() {
    siteAccess.mockReturnValue({
      catalogs: defaultPublicCatalogs,
      ready: true,
      reload: async () => undefined,
    });
  }

  it("hides when studio stops Follow", () => {
    siteAccess.mockReturnValue({
      catalogs: { ...defaultPublicCatalogs, follow: false },
      ready: true,
      reload: async () => undefined,
    });
    render(
      <MemoryRouter>
        <FollowButton />
      </MemoryRouter>,
    );
    expect(screen.queryByRole("link", { name: /Follow/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Follow/ })).not.toBeInTheDocument();
  });

  it("sends guests to sign in", async () => {
    liveFollow();
    vi.stubGlobal("fetch", mockFetch(null, false, 4));
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/about"]}>
          <FollowButton />
        </MemoryRouter>
      </AuthProvider>,
    );

    const link = await screen.findByRole("link", { name: /Follow/ });
    expect(link).toHaveAttribute("href", "/login");
    expect(await screen.findByRole("link", { name: "Follow · 4" })).toBeInTheDocument();
  });

  it("lets a signed-in reader follow and unfollow", async () => {
    liveFollow();
    vi.stubGlobal("fetch", mockFetch(reader, false, 2));
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <MemoryRouter>
          <FollowButton />
        </MemoryRouter>
      </AuthProvider>,
    );

    const button = await screen.findByRole("button", { name: "Follow · 2" });
    await user.click(button);
    expect(await screen.findByRole("button", { name: "Following · 3" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Following · 3" }));
    expect(await screen.findByRole("button", { name: "Follow · 2" })).toBeInTheDocument();
  });
});
