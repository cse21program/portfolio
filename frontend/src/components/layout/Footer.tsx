import { Link } from "react-router-dom";
import { moreNav, publicNav } from "@/config/navigation";
import { site } from "@/config/site";

export function Footer() {
  return (
    <footer className="border-t border-line bg-paper-muted">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <p className="font-display text-xl text-ink">{site.name}</p>
          <p className="mt-2 max-w-xs text-sm text-muted">{site.tagline}</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">Explore</p>
          <ul className="mt-3 space-y-2 text-sm text-ink-soft">
            {publicNav.map((item) => (
              <li key={item.href}>
                <Link to={item.href} className="hover:text-ink">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">More</p>
          <ul className="mt-3 space-y-2 text-sm text-ink-soft">
            {moreNav.map((item) => (
              <li key={item.href}>
                <Link to={item.href} className="hover:text-ink">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
