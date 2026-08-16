import { NavLink, useNavigate } from "react-router-dom";
import { site } from "@/config/site";
import type { NavItem } from "@/config/navigation";
import { useAuth } from "@/features/auth/AuthContext";
import type { ReactNode } from "react";

type AppShellProps = {
  area: string;
  nav: NavItem[];
  homeHref: string;
  extras?: NavItem[];
  children: ReactNode;
};

export function AppShell({ area, nav, homeHref, extras = [], children }: AppShellProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const displayName = user?.name?.trim() || user?.email || "Account";

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-30 border-b border-line/80 bg-surface/90 backdrop-blur-md md:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <NavLink to="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-ink font-display text-sm text-paper">
              R
            </span>
            <span className="font-display text-ink">{site.shortName}</span>
          </NavLink>
          <button
            type="button"
            className="rounded-full border border-line px-3 py-1.5 text-sm text-ink-soft"
            onClick={() => void handleLogout()}
          >
            Sign out
          </button>
        </div>
        <nav className="flex gap-2 overflow-x-auto px-4 pb-3" aria-label={area}>
          {nav.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === homeHref}
              className={({ isActive }) =>
                `shrink-0 rounded-full px-3 py-1.5 text-sm ${
                  isActive ? "bg-ink text-paper" : "border border-line text-ink-soft"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
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
