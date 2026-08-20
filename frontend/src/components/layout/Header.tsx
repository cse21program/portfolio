import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { SiteLogo } from "@/components/brand/SiteLogo";
import { publicNav } from "@/config/navigation";
import { homeForRole, useAuth } from "@/features/auth/AuthContext";
import { useOptionalCart } from "@/features/cart/CartContext";
import { useOptionalSearchModal } from "@/features/search/SearchContext";
import { SiteSearch } from "@/features/search/SiteSearch";

export function Header() {
  const [open, setOpen] = useState(false);
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const cartCount = useOptionalCart()?.cart.summary.itemCount ?? 0;
  const search = useOptionalSearchModal();

  async function handleLogout() {
    await logout();
    setOpen(false);
    navigate("/");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-surface/80 backdrop-blur-md print:hidden">
      <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <NavLink to="/" className="flex min-w-0 items-center" aria-label="Rezaul Karim home">
          <SiteLogo />
        </NavLink>
        <nav className="hidden items-center gap-7 text-sm text-ink-soft lg:flex">
          {publicNav.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                isActive ? "text-accent" : "hover:text-ink"
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-2 text-sm sm:gap-3">
          <div className="hidden sm:block">
            <SiteSearch compact />
          </div>
          <button
            type="button"
            className="grid h-9 w-9 cursor-pointer place-items-center rounded-full border border-line text-ink hover:border-accent sm:hidden"
            aria-label="Search the catalog"
            onClick={() => search?.openSearch()}
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4 text-accent" aria-hidden="true">
              <path
                d="M8.5 3.5a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm7 12-3.2-3.2"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <NavLink to="/cart" className="hidden text-ink-soft hover:text-ink sm:block">
            Cart{cartCount > 0 ? ` (${cartCount})` : ""}
          </NavLink>
          <NavLink to="/contact" className="hidden text-ink-soft hover:text-ink sm:block">
            Contact
          </NavLink>
          {loading ? null : user ? (
            <>
              <NavLink to={homeForRole(user.role)} className="hidden text-ink-soft hover:text-ink sm:block">
                {user.role === "ADMIN" ? "Studio" : "Account"}
              </NavLink>
              <button
                type="button"
                className="shrink-0 whitespace-nowrap rounded-full border border-line px-3 py-2 sm:px-4 hover:border-accent"
                onClick={() => void handleLogout()}
              >
                Sign out
              </button>
            </>
          ) : (
            <NavLink
              to="/login"
              className="shrink-0 whitespace-nowrap rounded-full bg-ink px-3 py-2 text-paper shadow-sm hover:bg-accent sm:px-4"
            >
              Sign in
            </NavLink>
          )}
          <button
            type="button"
            className="shrink-0 whitespace-nowrap rounded-full border border-line px-3 py-2 text-sm lg:hidden"
            aria-expanded={open}
            aria-label="Open menu"
            onClick={() => setOpen((value) => !value)}
          >
            Menu
          </button>
        </div>
      </div>
      {open ? (
        <nav className="border-t border-line bg-surface px-4 py-4 lg:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 text-sm">
            {publicNav.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={() => setOpen(false)}
                className={({ isActive }) => (isActive ? "text-accent" : "text-ink-soft")}
              >
                {item.label}
              </NavLink>
            ))}
            <button
              type="button"
              className="text-left text-ink-soft"
              onClick={() => {
                setOpen(false);
                search?.openSearch();
              }}
            >
              Search
            </button>
            <NavLink to="/cart" onClick={() => setOpen(false)} className="text-ink-soft">
              Cart{cartCount > 0 ? ` (${cartCount})` : ""}
            </NavLink>
            <NavLink to="/resume" onClick={() => setOpen(false)} className="text-ink-soft">
              Resume
            </NavLink>
            {user ? (
              <>
                <NavLink to={homeForRole(user.role)} onClick={() => setOpen(false)} className="text-ink-soft">
                  {user.role === "ADMIN" ? "Studio" : "Account"}
                </NavLink>
                <button type="button" className="text-left text-ink-soft" onClick={() => void handleLogout()}>
                  Sign out
                </button>
              </>
            ) : (
              <NavLink to="/login" onClick={() => setOpen(false)} className="text-ink-soft">
                Sign in
              </NavLink>
            )}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
