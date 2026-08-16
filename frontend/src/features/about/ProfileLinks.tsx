import type { ProfileLink } from "@/types/about";
import { PlatformIcon } from "@/features/about/PlatformIcon";
import { isUsableHref, matchPlatform } from "@/features/about/linkPlatforms";

type ProfileLinksProps = {
  links: ProfileLink[];
  className?: string;
  size?: "sm" | "lg";
  layout?: "stack" | "pills";
};

export function ProfileLinks({
  links,
  className = "",
  size = "sm",
  layout = "stack",
}: ProfileLinksProps) {
  const visible = links.filter((link) => link.label.trim() && isUsableHref(link.href));
  if (visible.length === 0) {
    return null;
  }

  if (layout === "pills") {
    return (
      <ul className={`flex flex-wrap gap-2 ${className}`.trim()}>
        {visible.map((link) => {
          const platform = matchPlatform(link);
          const external = link.href.startsWith("http");
          return (
            <li key={`${link.label}-${link.href}`}>
              <a
                href={link.href}
                className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2 text-sm text-ink hover:border-accent/50 hover:bg-paper-muted"
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
                aria-label={external ? `${link.label} (opens in a new tab)` : link.label}
              >
                <PlatformIcon id={platform.id} className="h-4 w-4" />
                {link.label}
              </a>
            </li>
          );
        })}
      </ul>
    );
  }

  const iconBox = size === "lg" ? "h-14 w-14 rounded-2xl" : "h-10 w-10 rounded-full";
  const icon = size === "lg" ? "h-6 w-6" : "h-4 w-4";

  return (
    <ul className={`flex flex-wrap gap-4 ${className}`.trim()}>
      {visible.map((link) => {
        const platform = matchPlatform(link);
        const external = link.href.startsWith("http");
        return (
          <li key={`${link.label}-${link.href}`}>
            <a
              href={link.href}
              className="group flex flex-col items-center gap-2 text-ink-soft hover:text-ink"
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
              aria-label={external ? `${link.label} (opens in a new tab)` : link.label}
            >
              <span
                className={`grid place-items-center border border-line bg-surface text-ink transition group-hover:border-accent/50 group-hover:bg-paper-muted ${iconBox}`}
              >
                <PlatformIcon id={platform.id} className={icon} />
              </span>
              <span className="text-xs tracking-wide">{link.label}</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
