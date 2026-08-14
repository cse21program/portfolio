import { NavLink } from "react-router-dom";
import { publicNav } from "@/config/navigation";
import { site } from "@/config/site";

export function Header() {
  return (
    <header className="border-b border-line bg-surface/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <NavLink to="/" className="font-display text-lg tracking-tight text-ink">
          {site.name}
        </NavLink>
        <nav className="hidden items-center gap-6 text-sm text-ink-soft md:flex">
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
            className="rounded-full bg-ink px-4 py-2 text-paper hover:bg-ink-soft"
          >
            Sign in
          </NavLink>
        </div>
      </div>
    </header>
  );
}
