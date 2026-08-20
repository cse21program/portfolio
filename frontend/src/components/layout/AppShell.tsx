import { useState, type ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { SiteLogo } from "@/components/brand/SiteLogo";
import { asNavGroups, type NavGroup, type NavItem } from "@/config/navigation";
import { useAuth } from "@/features/auth/AuthContext";
import { mediaHref } from "@/lib/mediaUrl";
import { userInitials } from "@/types/auth";

type AppShellProps = {
  area: string;
  nav: NavItem[] | NavGroup[];
  homeHref: string;
  extras?: NavItem[];
  children: ReactNode;
};

function ShellLink({
  item,
  homeHref,
  onClick,
}: {
  item: NavItem;
  homeHref: string;
  onClick?: () => void;
}) {
  return (
    <NavLink
      to={item.href}
      end={item.href === homeHref}
      onClick={onClick}
      className={({ isActive }) =>
        `rounded-xl px-3 py-1.5 text-sm ${
          isActive ? "bg-paper-muted text-ink" : "text-ink-soft hover:bg-surface hover:text-ink"
        }`
      }
    >
      {item.label}
    </NavLink>
  );
}

function ShellNav({
  groups,
  homeHref,
  onNavigate,
}: {
  groups: NavGroup[];
  homeHref: string;
  onNavigate?: () => void;
}) {
  return (
    <div>
      {groups.map((group, index) => (
        <div key={group.label ?? `group-${index}`} className={group.label ? "mt-4 first:mt-0" : ""}>
          {group.label ? (
            <p className="px-3 pb-1 text-[11px] tracking-[0.16em] text-muted uppercase">{group.label}</p>
          ) : null}
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => (
              <ShellLink key={item.href} item={item} homeHref={homeHref} onClick={onNavigate} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function AppShell({ area, nav, homeHref, extras = [], children }: AppShellProps) {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const displayName = user?.name?.trim() || user?.email || "Account";
  const groups = asNavGroups(nav);
  const photo = mediaHref(user?.imageUrl);
  const initials = userInitials(user);

  async function handleLogout() {
    await logout();
    setOpen(false);
    navigate("/");
  }

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-40 border-b border-line/80 bg-surface/80 backdrop-blur-md md:hidden print:hidden">
        <div className="flex h-[4.25rem] items-center justify-between gap-3 px-4">
          <NavLink
            to="/"
            className="flex min-w-0 items-center"
            aria-label="Rezaul Karim home"
            onClick={() => setOpen(false)}
          >
            <SiteLogo />
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
          <nav
            className="scroll-pane max-h-[min(70dvh,32rem)] overflow-y-auto border-t border-line bg-surface px-4 py-4"
            aria-label={area}
          >
            <ShellNav groups={groups} homeHref={homeHref} onNavigate={() => setOpen(false)} />
            <div className="mt-4 flex flex-col gap-0.5 border-t border-line pt-3 text-sm">
              {extras.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-1.5 text-ink-soft"
                >
                  {item.label}
                </NavLink>
              ))}
              <NavLink to="/" onClick={() => setOpen(false)} className="rounded-xl px-3 py-1.5 text-ink-soft">
                Public site
              </NavLink>
              <button
                type="button"
                className="rounded-xl px-3 py-1.5 text-left text-ink-soft"
                onClick={() => void handleLogout()}
              >
                Sign out
              </button>
            </div>
          </nav>
        ) : null}
      </header>

      <div className="mx-auto flex max-w-6xl items-start gap-10 px-4 py-8 sm:px-6 md:py-10">
        <aside className="sticky top-8 hidden w-56 shrink-0 self-start md:block">
          <div className="scroll-quiet max-h-[calc(100dvh-4rem)] space-y-6 overflow-y-auto pr-1">
            <NavLink to="/" className="flex items-center" aria-label="Rezaul Karim home">
              <SiteLogo />
            </NavLink>

            <div className="flex items-center gap-3">
              {photo ? (
                <img
                  src={photo}
                  alt=""
                  className="h-9 w-9 shrink-0 rounded-full border border-line object-cover"
                />
              ) : (
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-paper-muted font-display text-sm text-ink">
                  {initials}
                </span>
              )}
              <div className="min-w-0">
                <p className="text-xs tracking-[0.16em] text-muted uppercase">{area}</p>
                <p className="mt-1 truncate text-sm text-ink" title={displayName}>
                  {displayName}
                </p>
              </div>
            </div>

            <nav aria-label={area}>
              <ShellNav groups={groups} homeHref={homeHref} />
            </nav>

            <div className="flex flex-col gap-0.5 border-t border-line pt-4 text-sm">
              {extras.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className="rounded-xl px-3 py-1.5 text-ink-soft hover:bg-surface hover:text-ink"
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
                className="rounded-xl px-3 py-1.5 text-left text-ink-soft hover:bg-surface hover:text-ink"
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
