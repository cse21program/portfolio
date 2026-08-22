import { useEffect, useId, useState, type ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { SiteLogo } from "@/components/brand/SiteLogo";
import { SkipToContent } from "@/components/layout/SkipToContent";
import { useNavDisclosure } from "@/components/layout/useNavDisclosure";
import { asNavGroups, groupHasPath, type NavGroup, type NavItem } from "@/config/navigation";
import { useAuth } from "@/features/auth/AuthContext";
import { NotificationBell } from "@/features/notifications/NotificationBell";
import { mediaHref } from "@/lib/mediaUrl";
import { userInitials } from "@/types/auth";

type AppShellProps = {
  area: string;
  nav: NavItem[] | NavGroup[];
  homeHref: string;
  extras?: NavItem[];
  switchTo?: NavItem;
  children: ReactNode;
};

function storageKey(area: string) {
  return `portfolio:nav-collapsed:${area}`;
}

function readCollapsed(area: string) {
  if (typeof sessionStorage === "undefined") {
    return [] as string[];
  }
  try {
    const raw = sessionStorage.getItem(storageKey(area));
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

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
          isActive
            ? "bg-paper-muted text-ink shadow-[inset_2px_0_0_0_var(--color-accent)]"
            : "text-ink-soft hover:bg-surface hover:text-ink"
        }`
      }
    >
      {item.label}
    </NavLink>
  );
}

function ShellNav({
  area,
  groups,
  homeHref,
  onNavigate,
}: {
  area: string;
  groups: NavGroup[];
  homeHref: string;
  onNavigate?: () => void;
}) {
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(() => new Set(readCollapsed(area)));

  useEffect(() => {
    sessionStorage.setItem(storageKey(area), JSON.stringify([...collapsed]));
  }, [area, collapsed]);

  function toggle(label: string) {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  }

  return (
    <div>
      {groups.map((group, index) => {
        const label = group.label;
        const current = groupHasPath(group.items, pathname, homeHref);
        const open = !label || !collapsed.has(label);
        return (
          <div key={label ?? `group-${index}`} className={label ? "mt-4 first:mt-0" : ""}>
            {label ? (
              <button
                type="button"
                className={`flex w-full cursor-pointer items-center justify-between px-3 pb-1 text-left text-[11px] tracking-[0.16em] uppercase ${
                  current ? "text-accent" : "text-muted hover:text-ink"
                }`}
                aria-expanded={open}
                onClick={() => toggle(label)}
              >
                {label}
                <span aria-hidden="true">{open ? "–" : "+"}</span>
              </button>
            ) : null}
            {open ? (
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => (
                  <ShellLink key={item.href} item={item} homeHref={homeHref} onClick={onNavigate} />
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function AccountBlock({
  extras,
  onNavigate,
  onLogout,
}: {
  extras: NavItem[];
  onNavigate?: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="flex flex-col gap-0.5 border-t border-line pt-4 text-sm">
      {extras.map((item) => (
        <NavLink
          key={item.href}
          to={item.href}
          onClick={onNavigate}
          className="rounded-xl px-3 py-1.5 text-ink-soft hover:bg-surface hover:text-ink"
        >
          {item.label}
        </NavLink>
      ))}
      <NavLink
        to="/"
        onClick={onNavigate}
        className="rounded-xl px-3 py-2 text-ink-soft hover:bg-surface hover:text-ink"
      >
        Public site
      </NavLink>
      <button
        type="button"
        className="cursor-pointer rounded-xl px-3 py-1.5 text-left text-ink-soft hover:bg-surface hover:text-ink"
        onClick={onLogout}
      >
        Sign out
      </button>
    </div>
  );
}

export function AppShell({ area, nav, homeHref, extras = [], switchTo, children }: AppShellProps) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const displayName = user?.name?.trim() || user?.email || "Account";
  const groups = asNavGroups(nav);
  const photo = mediaHref(user?.imageUrl);
  const initials = userInitials(user);

  useNavDisclosure(open, () => setOpen(false), { lockScroll: true });

  async function handleLogout() {
    await logout();
    setOpen(false);
    navigate("/");
  }

  function identity(showBell: boolean) {
    return (
      <div className="flex items-center gap-3">
        {photo ? (
          <img src={photo} alt="" className="h-9 w-9 shrink-0 rounded-full border border-line object-cover" />
        ) : (
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-paper-muted font-display text-sm text-ink">
            {initials}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium tracking-[0.14em] text-muted uppercase">{area}</p>
          <p className="mt-0.5 truncate text-sm font-medium text-ink" title={displayName}>
            {displayName}
          </p>
          {switchTo ? (
            <NavLink
              to={switchTo.href}
              className="mt-0.5 block truncate text-xs text-accent hover:text-accent-dark"
            >
              {switchTo.label}
            </NavLink>
          ) : null}
        </div>
        {showBell ? <NotificationBell /> : null}
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <SkipToContent />
      <header className="sticky top-0 z-40 border-b border-line/80 bg-surface/80 backdrop-blur-md md:hidden print:hidden">
        <div className="flex h-[4.25rem] items-center justify-between gap-3 px-4">
          <NavLink
            to="/"
            className="flex min-w-0 items-center"
            aria-label="Rezaul Karim home"
            onClick={() => setOpen(false)}
          >
            <SiteLogo compact />
          </NavLink>
          <div className="flex shrink-0 items-center gap-3 text-sm">
            <NotificationBell />
            <button
              type="button"
              className="shrink-0 cursor-pointer whitespace-nowrap rounded-full border border-line px-3 py-2 hover:border-accent sm:px-4"
              onClick={() => void handleLogout()}
            >
              Sign out
            </button>
            <button
              type="button"
              className="shrink-0 cursor-pointer whitespace-nowrap rounded-full border border-line px-3 py-2"
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
          <nav
            id={menuId}
            className="scroll-pane max-h-[min(70dvh,36rem)] overflow-y-auto border-t border-line bg-surface px-4 py-4"
            aria-label={area}
          >
            {identity(false)}
            <div className="mt-5">
              <ShellNav area={area} groups={groups} homeHref={homeHref} onNavigate={() => setOpen(false)} />
            </div>
            <AccountBlock extras={extras} onNavigate={() => setOpen(false)} onLogout={() => void handleLogout()} />
          </nav>
        ) : null}
      </header>

      <div className="mx-auto flex max-w-6xl items-start gap-10 px-4 sm:px-6">
        <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 self-start border-r border-line/80 [overflow-anchor:none] md:flex md:flex-col print:static print:h-auto print:border-0">
          <div className="flex min-h-0 flex-1 flex-col py-8 pr-5 md:py-10">
            <NavLink to="/" className="flex items-center" aria-label="Rezaul Karim home">
              <SiteLogo compact />
            </NavLink>
            <div className="mt-6">{identity(true)}</div>
            <nav aria-label={area} className="scroll-quiet mt-6 min-h-0 flex-1 overflow-y-auto pr-1">
              <ShellNav area={area} groups={groups} homeHref={homeHref} />
            </nav>
            <AccountBlock extras={extras} onLogout={() => void handleLogout()} />
          </div>
        </aside>

        <main id="main-content" className="min-w-0 flex-1 [overflow-anchor:none] py-8 pb-10 md:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
