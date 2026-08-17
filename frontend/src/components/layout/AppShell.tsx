import { useState, type ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { site } from "@/config/site";
import type { NavItem } from "@/config/navigation";
import { useAuth } from "@/features/auth/AuthContext";

type AppShellProps = {
  area: string;
  nav: NavItem[];
  homeHref: string;
  extras?: NavItem[];
  children: ReactNode;
};

export function AppShell({ area, nav, homeHref, extras = [], children }: AppShellProps) {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const displayName = user?.name?.trim() || user?.email || "Account";

  async function handleLogout() {
    await logout();
    setOpen(false);
    navigate("/");
  }

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-40 border-b border-line/80 bg-surface/80 backdrop-blur-md md:hidden print:hidden">
        <div className="flex h-[4.25rem] items-center justify-between gap-3 px-4">
          <NavLink to="/" className="flex min-w-0 items-center gap-2.5" onClick={() => setOpen(false)}>
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink font-display text-sm text-paper">
              R
            </span>
            <span className="font-display text-lg tracking-tight text-ink">{site.shortName}</span>
          </NavLink>
          <div className="flex shrink-0 items-center gap-3 text-sm">
            <button
              type="button"
              className="rounded-full border border-line px-4 py-2 hover:border-accent"
              onClick={() => void handleLogout()}
            >
              Sign out
            </button>
            <button
              type="button"
              className="rounded-full border border-line px-3 py-2"
              aria-expanded={open}
              aria-label="Open menu"
              onClick={() => setOpen((value) => !value)}
            >
              Menu
            </button>
          </div>
        </div>
        {open ? (
          <nav className="border-t border-line bg-surface px-4 py-4" aria-label={area}>
            <div className="flex flex-col gap-3 text-sm">
              {nav.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  end={item.href === homeHref}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) => (isActive ? "text-accent" : "text-ink-soft")}
                >
                  {item.label}
                </NavLink>
              ))}
              {extras.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  onClick={() => setOpen(false)}
                  className="text-ink-soft"
                >
                  {item.label}
                </NavLink>
              ))}
              <NavLink to="/" onClick={() => setOpen(false)} className="text-ink-soft">
                Public site
              </NavLink>
              <button type="button" className="text-left text-ink-soft" onClick={() => void handleLogout()}>
                Sign out
              </button>
            </div>
          </nav>
        ) : null}
      </header>

      <div className="mx-auto flex max-w-6xl gap-10 px-4 py-8 sm:px-6 md:py-10">
        <aside className="hidden w-56 shrink-0 md:block">
          <div className="sticky top-8 space-y-6">
            <NavLink to="/" className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-ink font-display text-sm text-paper">
                R
              </span>
              <span className="font-display text-lg text-ink">{site.shortName}</span>
            </NavLink>

            <div>
              <p className="text-xs tracking-[0.16em] text-muted uppercase">{area}</p>
              <p className="mt-1 truncate text-sm text-ink" title={displayName}>
                {displayName}
              </p>
            </div>

            <nav className="flex flex-col gap-1" aria-label={area}>
              {nav.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  end={item.href === homeHref}
                  className={({ isActive }) =>
                    `rounded-xl px-3 py-2 text-sm ${
                      isActive ? "bg-paper-muted text-ink" : "text-ink-soft hover:bg-surface hover:text-ink"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="flex flex-col gap-1 border-t border-line pt-4 text-sm">
              {extras.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className="rounded-xl px-3 py-2 text-ink-soft hover:bg-surface hover:text-ink"
                >
                  {item.label}
                </NavLink>
              ))}
              <NavLink
                to="/"
                className="rounded-xl px-3 py-2 text-ink-soft hover:bg-surface hover:text-ink"
              >
                Public site
              </NavLink>
              <button
                type="button"
                className="rounded-xl px-3 py-2 text-left text-ink-soft hover:bg-surface hover:text-ink"
                onClick={() => void handleLogout()}
              >
                Sign out
              </button>
            </div>
          </div>
        </aside>

        <section className="min-w-0 flex-1 pb-10">{children}</section>
      </div>
    </div>
  );
}
