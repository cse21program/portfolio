import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { adminNav } from "@/config/navigation";
import { useAuth } from "@/features/auth/AuthContext";

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="mx-auto flex min-h-svh max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 md:flex-row">
      <aside className="w-full shrink-0 md:w-52">
        <p className="text-xs font-semibold tracking-wide text-muted uppercase">
          Admin
        </p>
        <p className="mt-2 text-sm text-ink">{user?.name ?? user?.email}</p>
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
          <NavLink to="/dashboard" className="text-ink-soft hover:text-ink">
            Customer view
          </NavLink>
          <NavLink to="/" className="text-ink-soft hover:text-ink">
            Public site
          </NavLink>
          <button
            type="button"
            className="text-left text-ink-soft hover:text-ink"
            onClick={() => void logout().then(() => navigate("/"))}
          >
            Sign out
          </button>
        </nav>
      </aside>
      <section className="flex-1">
        <Outlet />
      </section>
    </div>
  );
}
