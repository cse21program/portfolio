import { useId, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useNavDisclosure } from "@/components/layout/useNavDisclosure";
import { groupHasPath, type NavItem } from "@/config/navigation";

export function NavMoreMenu({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const { pathname } = useLocation();
  const current = groupHasPath(items, pathname);

  useNavDisclosure(open, () => setOpen(false), { rootRef });

  if (items.length === 0) {
    return null;
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className={`cursor-pointer ${current || open ? "text-accent" : "text-ink-soft hover:text-ink"}`}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        More
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute top-full left-0 z-50 mt-3 min-w-52 rounded-2xl border border-line bg-surface p-2 shadow-[0_16px_40px_rgb(26_22_18/0.08)]"
        >
          {items.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block rounded-xl px-3 py-2 text-sm ${isActive ? "bg-paper-muted text-ink" : "text-ink-soft hover:bg-paper hover:text-ink"}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      ) : null}
    </div>
  );
}
