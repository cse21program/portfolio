import { Link } from "react-router-dom";
import { SiteLogo } from "@/components/brand/SiteLogo";
import { moreNav, publicNav } from "@/config/navigation";
import { site } from "@/config/site";
import { ProfileLinks } from "@/features/about/ProfileLinks";
import { NewsletterForm } from "@/features/blog/NewsletterForm";
import { useAboutProfile } from "@/features/about/AboutProfileContext";

export function Footer() {
  const { profile } = useAboutProfile();
  return (
    <footer className="border-t border-line bg-paper-muted/70 print:hidden">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <SiteLogo markClassName="h-11 w-11" />
          <p className="mt-4 max-w-sm text-sm leading-7 text-muted">{site.tagline}</p>
          <ProfileLinks className="mt-6" links={profile.links} />
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
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-display text-2xl text-ink">New posts, occasionally</p>
            <p className="mt-2 max-w-md text-sm leading-6 text-ink-soft">
              Notes when something is worth sending. Unsubscribe from any issue.
            </p>
          </div>
          <NewsletterForm compact />
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
