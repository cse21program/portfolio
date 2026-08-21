import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { SiteLogo } from "@/components/brand/SiteLogo";
import { Tag } from "@/components/ui/Tag";
import { site } from "@/config/site";
import { heroSkills } from "@/content/profile";
import { useAboutProfile } from "@/features/about/AboutProfileContext";

const DEFAULT_PHOTO = /\/images\/profile\.png(?:\?|$)/;
const AUTH_PORTRAIT = "/images/profile-portrait.webp";

function portraitSrc(url: string) {
  return DEFAULT_PHOTO.test(url) ? AUTH_PORTRAIT : url;
}

function AuthPortrait({ src, caption }: { src: string; caption: string }) {
  const [ready, setReady] = useState(false);

  return (
    <div className="relative mx-auto xl:mx-0">
      <div className="absolute -top-5 -right-5 h-24 w-24 rounded-full bg-accent/20" />
      <div className="absolute -bottom-7 -left-7 h-32 w-32 rounded-full bg-paper-muted" />
      <div className="relative h-80 w-64 overflow-hidden rounded-[2rem] bg-paper-muted shadow-[0_24px_60px_rgb(26_22_18/0.18)]">
        <img
          src={src}
          alt=""
          width={256}
          height={320}
          fetchPriority="high"
          decoding="async"
          ref={(node) => {
            if (node?.complete) {
              setReady(true);
            }
          }}
          onLoad={() => setReady(true)}
          className={`h-full w-full object-cover object-top transition-opacity duration-300 ${ready ? "opacity-100" : "opacity-0"}`}
        />
      </div>
      <p className="absolute -bottom-4 left-1/2 w-max -translate-x-1/2 rounded-full border border-line bg-surface px-4 py-2 text-xs text-ink shadow-sm">
        {caption}
      </p>
    </div>
  );
}

export function AuthScreen({
  eyebrow = "Account",
  title,
  description,
  footer,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  footer?: ReactNode;
  children: ReactNode;
}) {
  const { profile } = useAboutProfile();
  const [firstName, ...rest] = profile.fullName.split(" ");
  const lastName = rest.join(" ");

  return (
    <div className="grid h-full min-h-0 lg:grid-cols-[minmax(0,1fr)_28rem] xl:grid-cols-[minmax(0,1fr)_30rem]">
      <aside className="relative hidden h-full min-h-0 overflow-hidden border-r border-line bg-surface lg:flex lg:flex-col">
        <div className="pointer-events-none absolute -top-28 left-1/3 h-80 w-80 rounded-full bg-accent/15 blur-3xl" />
        <div className="pointer-events-none absolute right-8 bottom-16 h-56 w-56 rounded-full bg-paper-muted blur-3xl" />
        <div className="relative flex h-full min-h-0 flex-col px-10 py-10 xl:px-14 xl:py-12">
          <Link to="/" className="w-fit shrink-0" aria-label={`${site.name} home`}>
            <SiteLogo />
          </Link>

          <div className="mt-auto grid min-h-0 items-end gap-10 xl:grid-cols-[minmax(0,1fr)_auto] xl:gap-14">
            <div className="max-w-xl">
              <p className="flex items-center gap-2 text-xs tracking-[0.18em] text-accent uppercase">
                <span className="inline-block h-px w-6 bg-accent" />
                {profile.professionalTitle}
              </p>
              <h2 className="mt-5 font-display text-5xl leading-[1.05] tracking-tight text-ink xl:text-6xl">
                {firstName}{" "}
                <span className="italic text-accent">{lastName || firstName}</span>
              </h2>
              <p className="mt-5 max-w-md text-lg leading-8 text-ink-soft">{site.introduction}</p>
              <div className="mt-7 flex flex-wrap gap-2">
                {heroSkills.slice(0, 6).map((skill) => (
                  <Tag key={skill}>{skill}</Tag>
                ))}
              </div>
              <blockquote className="mt-10 max-w-md border-l-2 border-accent/70 pl-5">
                <p className="font-display text-xl leading-8 text-ink">{profile.philosophy}</p>
              </blockquote>
            </div>

            <AuthPortrait src={portraitSrc(profile.profilePhotoUrl)} caption={profile.availability} />
          </div>

          <p className="mt-12 shrink-0 text-sm text-muted">
            {profile.location}
            <span className="mx-2 text-line">·</span>
            {site.tagline}
          </p>
        </div>
      </aside>

      <div className="relative flex h-full min-h-0 flex-col overflow-y-auto overscroll-none bg-surface lg:border-l lg:border-line">
        <header className="sticky top-0 z-10 flex shrink-0 items-center justify-between gap-3 bg-surface px-5 py-4 sm:px-8">
          <Link to="/" className="min-w-0 lg:hidden" aria-label={`${site.name} home`}>
            <SiteLogo />
          </Link>
          <Link
            to="/"
            className="ml-auto inline-flex items-center gap-2 rounded-full border border-line px-3.5 py-1.5 text-sm text-ink-soft transition duration-200 hover:border-ink/30 hover:text-ink"
          >
            <span aria-hidden="true">←</span>
            Back to site
          </Link>
        </header>

        <div className="flex flex-1 items-start justify-center px-5 pt-2 pb-10 sm:px-8">
          <div className="w-full max-w-[22.5rem]">
            <p className="flex items-center gap-2 text-[11px] tracking-[0.2em] text-accent uppercase">
              <span className="inline-block h-px w-5 bg-accent" />
              {eyebrow}
            </p>
            <h1 className="mt-3 font-display text-[2rem] leading-[1.12] tracking-tight text-ink sm:text-[2.25rem]">
              {title}
            </h1>
            {description ? (
              <p className="mt-3 max-w-[19rem] text-[15px] leading-7 text-muted">{description}</p>
            ) : null}
            <div className="mt-8 space-y-4">{children}</div>
            {footer ? <div className="mt-6 border-t border-line pt-5 text-sm leading-6 text-muted">{footer}</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
