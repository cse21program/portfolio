import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AppShell } from "@/components/layout/AppShell";
import { adminNav } from "@/config/navigation";

vi.mock("@/features/auth/AuthContext", () => ({
  useAuth: () => ({
    user: {
      id: "1",
      email: "hello@rezaul.dev",
      name: "Rezaul",
      role: "ADMIN",
      emailVerified: true,
      status: "ACTIVE",
      hasPassword: true,
      googleLinked: false,
    },
    logout: vi.fn(async () => undefined),
  }),
}));

describe("AppShell", () => {
  it("uses a public-style menu on small screens", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AppShell area="Studio" nav={adminNav} homeHref="/admin">
          <p>Studio home</p>
        </AppShell>
      </MemoryRouter>,
    );

    expect(screen.getByRole("button", { name: "Open menu" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Sign out" })[0]).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Open menu" }));

    expect(screen.getAllByRole("link", { name: "Dashboard" })[0]).toHaveAttribute("href", "/admin");
    expect(screen.getAllByRole("link", { name: "Media" })[0]).toHaveAttribute("href", "/admin/media");
    expect(screen.getAllByRole("link", { name: "Videos" })[0]).toHaveAttribute("href", "/admin/videos");
    expect(screen.getAllByRole("link", { name: "Experience" })[0]).toHaveAttribute(
      "href",
      "/admin/experience",
    );
    expect(screen.getAllByRole("link", { name: "Education" })[0]).toHaveAttribute(
      "href",
      "/admin/education",
    );
    expect(screen.getAllByRole("link", { name: "Projects" })[0]).toHaveAttribute(
      "href",
      "/admin/projects",
    );
    expect(screen.getAllByRole("link", { name: "Skills" })[0]).toHaveAttribute(
      "href",
      "/admin/skills",
    );
    expect(screen.getAllByRole("link", { name: "Fields" })[0]).toHaveAttribute(
      "href",
      "/admin/fields",
    );
    expect(screen.getAllByRole("link", { name: "Public site" })[0]).toHaveAttribute("href", "/");
    expect(screen.getAllByRole("link", { name: "Leads" })[0]).toHaveAttribute("href", "/admin/leads");
    expect(screen.getAllByText("Portfolio")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Knowledge")[0]).toBeInTheDocument();
    expect(screen.getByText("Studio home")).toBeInTheDocument();
  });
});
