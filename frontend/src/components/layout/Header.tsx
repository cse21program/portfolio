import { useState } from "react";
import { NavLink } from "react-router-dom";
import { publicNav } from "@/config/navigation";
import { site } from "@/config/site";

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between px-4 sm:px-6">
        <NavLink to="/" className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-ink font-display text-sm text-paper">
            R
          </span>
          <span className="font-display text-lg tracking-tight text-ink">{site.shortName}</span>
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
        <div className="flex items-center gap-3 text-sm">
          <NavLink to="/contact" className="hidden text-ink-soft hover:text-ink sm:block">
            Contact
          </NavLink>
          <NavLink
            to="/login"
            className="rounded-full bg-ink px-4 py-2 text-paper shadow-sm hover:bg-accent"
          >
            Sign in
          </NavLink>
          <button
            type="button"
            className="rounded-full border border-line px-3 py-2 text-sm lg:hidden"
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
            <NavLink to="/resume" onClick={() => setOpen(false)} className="text-ink-soft">
              Resume
            </NavLink>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
