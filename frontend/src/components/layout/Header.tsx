import { useId, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { SiteLogo } from "@/components/brand/SiteLogo";
import { NavMoreMenu } from "@/components/layout/NavMoreMenu";
import { useNavDisclosure } from "@/components/layout/useNavDisclosure";
import { moreNav, morePages, publicNav } from "@/config/navigation";
import { visibleNavItems } from "@/types/siteAccess";
import { useSiteAccess } from "@/features/content/SiteAccessContext";
import { homeForRole, useAuth } from "@/features/auth/AuthContext";
import { useOptionalCart } from "@/features/cart/CartContext";
import { useOptionalSearchModal } from "@/features/search/SearchContext";
import { NotificationBell } from "@/features/notifications/NotificationBell";
import { SiteSearch } from "@/features/search/SiteSearch";

function linkClass(isActive: boolean) {
  return isActive ? "text-accent" : "text-ink-soft hover:text-ink";
}

export function Header() {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const cartCount = useOptionalCart()?.cart.summary.itemCount ?? 0;
  const search = useOptionalSearchModal();
  const { catalogs } = useSiteAccess();
  const nav = visibleNavItems(publicNav, catalogs);
  const extra = morePages(visibleNavItems(moreNav, catalogs));

  useNavDisclosure(open, () => setOpen(false), { lockScroll: true });

  async function handleLogout() {
    await logout();
    setOpen(false);
    navigate("/");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-surface/80 backdrop-blur-md print:hidden">
      <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <NavLink to="/" className="flex min-w-0 items-center" aria-label="Rezaul Karim home">
          <SiteLogo compact />
        </NavLink>
        <nav className="hidden items-center gap-7 text-sm lg:flex" aria-label="Primary">
          {nav.map((item) => (
            <NavLink key={item.href} to={item.href} className={({ isActive }) => linkClass(isActive)}>
              {item.label}
            </NavLink>
          ))}
          <NavMoreMenu items={extra} />
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
          <NavLink to="/cart" className={({ isActive }) => `hidden sm:block ${linkClass(isActive)}`}>
            Cart{cartCount > 0 ? ` (${cartCount})` : ""}
          </NavLink>
          <NavLink to="/contact" className={({ isActive }) => `hidden sm:block ${linkClass(isActive)}`}>
            Contact
          </NavLink>
          {loading ? null : user ? (
            <>
              <NotificationBell />
              <NavLink
                to={homeForRole(user.role)}
                className={({ isActive }) => `hidden sm:block ${linkClass(isActive)}`}
              >
                {user.role === "ADMIN" ? "Studio" : "Account"}
              </NavLink>
              <button
                type="button"
                className="shrink-0 cursor-pointer whitespace-nowrap rounded-full border border-line px-3 py-2 hover:border-accent sm:px-4"
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
            className="shrink-0 cursor-pointer whitespace-nowrap rounded-full border border-line px-3 py-2 text-sm lg:hidden"
            aria-expanded={open}
            aria-controls={menuId}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </div>
      {open ? (
        <nav id={menuId} className="border-t border-line bg-surface px-4 py-5 lg:hidden" aria-label="Site">
          <div className="mx-auto flex max-w-6xl flex-col gap-5 text-sm">
            <div>
              <p className="text-[11px] tracking-[0.16em] text-muted uppercase">Explore</p>
              <div className="mt-2 flex flex-col gap-2">
                {nav.map((item) => (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) => linkClass(isActive)}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
            {extra.length > 0 ? (
              <div>
                <p className="text-[11px] tracking-[0.16em] text-muted uppercase">More</p>
                <div className="mt-2 flex flex-col gap-2">
                  {extra.map((item) => (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      onClick={() => setOpen(false)}
                      className={({ isActive }) => linkClass(isActive)}
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            ) : null}
            <div>
              <p className="text-[11px] tracking-[0.16em] text-muted uppercase">Account</p>
              <div className="mt-2 flex flex-col gap-2">
                <button
                  type="button"
                  className="cursor-pointer text-left text-ink-soft hover:text-ink"
                  onClick={() => {
                    setOpen(false);
                    search?.openSearch();
                  }}
                >
                  Search
                </button>
                <NavLink to="/cart" onClick={() => setOpen(false)} className={({ isActive }) => linkClass(isActive)}>
                  Cart{cartCount > 0 ? ` (${cartCount})` : ""}
                </NavLink>
                <NavLink to="/contact" onClick={() => setOpen(false)} className={({ isActive }) => linkClass(isActive)}>
                  Contact
                </NavLink>
                {user ? (
                  <>
                    <NavLink
                      to={homeForRole(user.role)}
                      onClick={() => setOpen(false)}
                      className={({ isActive }) => linkClass(isActive)}
                    >
                      {user.role === "ADMIN" ? "Studio" : "Account"}
                    </NavLink>
                    <button
                      type="button"
                      className="cursor-pointer text-left text-ink-soft hover:text-ink"
                      onClick={() => void handleLogout()}
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <NavLink to="/login" onClick={() => setOpen(false)} className={({ isActive }) => linkClass(isActive)}>
                    Sign in
                  </NavLink>
                )}
              </div>
            </div>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
