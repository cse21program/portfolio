import { Link } from "react-router-dom";
import { moreNav, publicNav } from "@/config/navigation";
import { site } from "@/config/site";
import { socialLinks } from "@/content/profile";

export function Footer() {
  return (
    <footer className="border-t border-line bg-paper-muted/70">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="font-display text-2xl text-ink">{site.name}</p>
          <p className="mt-3 max-w-sm text-sm leading-7 text-muted">{site.tagline}</p>
          <div className="mt-6 flex flex-wrap gap-4 text-sm">
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="rounded-full border border-line bg-surface px-3 py-1.5 text-ink-soft hover:border-accent/40 hover:text-ink"
                target={link.href.startsWith("http") ? "_blank" : undefined}
                rel={link.href.startsWith("http") ? "noreferrer" : undefined}
              >
                {link.label}
              </a>
            ))}
          </div>
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
      <div className="border-t border-line">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-muted sm:px-6">
          Sylhet, Bangladesh · Built as a static first edition
        </p>
      </div>
    </footer>
  );
}
