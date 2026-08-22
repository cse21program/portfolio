import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "@/features/auth/AuthContext";
import { NotificationBell } from "@/features/notifications/NotificationBell";
import { apiGet } from "@/lib/api";
import type { AuthUser } from "@/types/auth";

vi.mock("@/features/auth/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    apiGet: vi.fn(),
  };
});

const auth = vi.mocked(useAuth);
const get = vi.mocked(apiGet);

const reader: AuthUser = {
  id: "user-1",
  email: "reader@example.com",
  name: "Ada",
  role: "CUSTOMER",
  emailVerified: true,
  status: "ACTIVE",
  hasPassword: true,
  googleLinked: false,
};

describe("NotificationBell", () => {
  beforeEach(() => {
    get.mockReset();
    auth.mockReset();
  });

  it("is hidden for guests", () => {
    auth.mockReturnValue({
      user: null,
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      resendVerification: vi.fn(),
      changePassword: vi.fn(),
      updateProfile: vi.fn(),
      uploadAvatar: vi.fn(),
      removeAvatar: vi.fn(),
    });
    render(
      <MemoryRouter>
        <NotificationBell />
      </MemoryRouter>,
    );
    expect(screen.queryByRole("link", { name: /notification/i })).not.toBeInTheDocument();
  });

  it("shows an unread count for a signed-in reader", async () => {
    auth.mockReturnValue({
      user: reader,
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
      resendVerification: vi.fn(),
      changePassword: vi.fn(),
      updateProfile: vi.fn(),
      uploadAvatar: vi.fn(),
      removeAvatar: vi.fn(),
    });
    get.mockResolvedValue({ unreadCount: 3 });
    render(
      <MemoryRouter>
        <NotificationBell />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("link", { name: "3 unread notifications" })).toHaveAttribute(
      "href",
      "/dashboard/notifications",
    );
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});
