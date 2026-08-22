import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardNotificationsPage } from "@/features/dashboard/DashboardNotificationsPage";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import type { AccountNotification } from "@/types/notification";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    apiGet: vi.fn(),
    apiPatch: vi.fn(),
    apiPost: vi.fn(),
  };
});

const get = vi.mocked(apiGet);
const patch = vi.mocked(apiPatch);
const post = vi.mocked(apiPost);

const unread: AccountNotification = {
  id: "notice-1",
  type: "COURSE_ENROLLMENT",
  title: "You are enrolled",
  body: "You are enrolled in HTTP from zero.",
  href: "/courses/http-from-zero",
  readAt: null,
  createdAt: "2026-08-21T12:00:00.000Z",
};

describe("DashboardNotificationsPage", () => {
  beforeEach(() => {
    get.mockReset();
    patch.mockReset();
    post.mockReset();
    get.mockResolvedValue({ notifications: [unread], unreadCount: 1 });
    patch.mockResolvedValue({
      notification: { ...unread, readAt: "2026-08-21T12:05:00.000Z" },
    });
    post.mockResolvedValue({ unreadCount: 0 });
  });

  it("lists notices and can mark them read", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <DashboardNotificationsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Notifications" })).toBeInTheDocument();
    expect(screen.getByText("You are enrolled")).toBeInTheDocument();
    expect(screen.getByText("Course")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Mark all as read" }));
    expect(post).toHaveBeenCalledWith("/notifications/read-all");
  });
});
