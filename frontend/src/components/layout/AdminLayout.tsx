import { NavLink, Outlet } from "react-router-dom";
import { adminNav } from "@/config/navigation";

export function AdminLayout() {
  return (
    <div className="mx-auto flex min-h-svh max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 md:flex-row">
      <aside className="w-full shrink-0 md:w-52">
        <p className="text-xs font-semibold tracking-wide text-muted uppercase">
          Admin
        </p>
        <nav className="mt-4 flex flex-col gap-2 text-sm">
          {adminNav.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === "/admin"}
              className={({ isActive }) =>
                isActive ? "text-accent" : "text-ink-soft hover:text-ink"
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <section className="flex-1">
        <Outlet />
      </section>
    </div>
  );
}
