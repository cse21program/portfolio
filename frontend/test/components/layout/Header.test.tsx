import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Header } from "@/components/layout/Header";
import { defaultPublicCatalogs } from "@/types/siteAccess";

vi.mock("@/features/auth/AuthContext", () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    logout: vi.fn(async () => undefined),
  }),
  homeForRole: () => "/dashboard",
}));

vi.mock("@/features/content/SiteAccessContext", () => ({
  useSiteAccess: () => ({ catalogs: defaultPublicCatalogs }),
}));

vi.mock("@/features/cart/CartContext", () => ({
  useOptionalCart: () => ({ cart: { summary: { itemCount: 2 } } }),
}));

vi.mock("@/features/search/SearchContext", () => ({
  useOptionalSearchModal: () => ({ openSearch: vi.fn() }),
}));

vi.mock("@/features/notifications/NotificationBell", () => ({
  NotificationBell: () => null,
}));

describe("Header", () => {
  it("exposes secondary pages from More and the mobile menu", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    expect(screen.getByRole("navigation", { name: "Primary" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "More" }));
    expect(screen.getByRole("menuitem", { name: "Testimonials" })).toHaveAttribute("href", "/testimonials");
    expect(screen.getByRole("menuitem", { name: "Resume" })).toHaveAttribute("href", "/resume");
    expect(screen.queryByRole("menuitem", { name: "Search" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    expect(screen.getByRole("navigation", { name: "Site" })).toBeInTheDocument();
    expect(screen.getByText("Explore")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Contact" })[0]).toHaveAttribute("href", "/contact");
    expect(screen.getAllByRole("link", { name: "Cart (2)" })[0]).toHaveAttribute("href", "/cart");
    expect(screen.getByRole("button", { name: "Close menu" })).toBeInTheDocument();
  });
});
