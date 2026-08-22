import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Container } from "@/components/ui/Container";
import { AboutJsonLd } from "@/features/about/AboutJsonLd";
import { GalleryViewer } from "@/features/about/GalleryViewer";
import { IntroVideo, hasIntroVideo } from "@/features/about/IntroVideo";
import { ProfileLinks } from "@/features/about/ProfileLinks";
import { useAboutProfile } from "@/features/about/AboutProfileContext";
import { FollowButton } from "@/features/follow/FollowButton";
import { publicGalleryUrls } from "@/types/about";

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  return {
    first: parts[0] ?? fullName,
    rest: parts.slice(1).join(" "),
  };
}

function FactIcon({ name }: { name: "location" | "experience" | "languages" | "availability" }) {
  const paths = {
    location: (
      <>
        <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" />
        <circle cx="12" cy="10" r="2.2" />
      </>
    ),
    experience: (
      <>
        <path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7" />
        <rect x="4" y="7" width="16" height="13" rx="2" />
        <path d="M4 12h16" />
      </>
    ),
    languages: (
      <>
        <path d="M4 6h10v8H8l-4 3V6Z" />
        <path d="M14 9h6v8l-3-2h-3" />
      </>
    ),
    availability: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="m8.5 12 2.5 2.5 4.5-5" />
      </>
    ),
  };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

function MediaSection({
  embedUrl,
  introVideoUrl,
  images,
}: {
  embedUrl: string | null;
  introVideoUrl: string | null;
  images: string[];
}) {
  const hasVideo = hasIntroVideo(embedUrl, introVideoUrl);
  const hasPhotos = images.length > 0;

  return (
    <section className="border-b border-line bg-paper-muted/35 py-16 lg:py-24">
      <Container>
        <p className="text-xs tracking-[0.18em] text-accent uppercase">Media</p>
        {hasVideo ? (
          <>
            <h2 className="mt-3 font-display text-3xl text-ink">Introduction</h2>
            <p className="mt-2 max-w-xl text-ink-soft">A short introduction. Press play when you want sound.</p>
            <div className="mt-8">
              <IntroVideo embedUrl={embedUrl} fileUrl={introVideoUrl} />
            </div>
          </>
        ) : null}

        {hasPhotos ? (
          <div className={hasVideo ? "mt-14" : "mt-3"}>
            <GalleryViewer
              images={images}
              title={hasVideo ? "Photos" : "Gallery"}
              titleClassName={`font-display text-ink ${hasVideo ? "text-2xl" : "text-3xl"}`}
            />
          </div>
        ) : null}
      </Container>
    </section>
  );
}

export function AboutPage() {
  const { profile } = useAboutProfile();
  const name = splitName(profile.fullName);
  const hasVideo = hasIntroVideo(profile.embedVideoUrl, profile.introVideoUrl);
  const [lead, ...restBiography] = profile.detailedBiography;
  const facts = [
    { id: "location" as const, label: "Location", value: profile.location },
    { id: "experience" as const, label: "Experience", value: profile.yearsOfExperience },
    { id: "languages" as const, label: "Languages", value: profile.languages.join(" · ") },
    { id: "availability" as const, label: "Availability", value: profile.availability },
  ];

  useEffect(() => {
    const previous = document.title;
    document.title = `${profile.fullName} · About`;
    return () => {
      document.title = previous;
    };
  }, [profile.fullName]);

  return (
    <>
      <AboutJsonLd profile={profile} />

      <section className="relative overflow-hidden border-b border-line bg-surface">
        {profile.coverImageUrl ? (
          <img
            src={profile.coverImageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-[0.18]"
          />
        ) : (
          <>
            <div className="pointer-events-none absolute -top-28 left-1/3 h-80 w-80 rounded-full bg-accent/15 blur-3xl" />
            <div className="pointer-events-none absolute right-0 bottom-0 h-56 w-56 rounded-full bg-paper-muted blur-3xl" />
          </>
        )}
        <Container className="relative grid items-center gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/90 px-3 py-1 text-xs tracking-[0.16em] text-accent uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              {profile.availability}
            </p>
            <h1
              className="mt-5 font-display text-5xl leading-[1.02] tracking-tight text-ink sm:text-6xl lg:text-7xl"
              aria-label={profile.fullName}
            >
              {name.first}
              {name.rest ? (
                <span className="mt-1 block italic text-accent">{name.rest}</span>
              ) : null}
            </h1>
            <p className="mt-4 text-xl text-ink-soft">{profile.professionalTitle}</p>
            <p className="mt-8 max-w-xl font-display text-2xl leading-snug text-ink sm:text-[1.7rem]">
              {profile.shortBiography}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink to="/contact">Contact me</ButtonLink>
              <FollowButton compact />
              <ButtonLink to="/resume" variant="secondary">
                View resume
              </ButtonLink>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <div className="relative">
              <div className="absolute -top-5 -left-5 h-24 w-24 rounded-full bg-accent/20" />
              <div className="absolute -right-6 -bottom-8 h-32 w-32 rounded-full bg-paper-muted" />
              <img
                src={profile.profilePhotoUrl}
                alt={profile.fullName}
                width={360}
                height={460}
                className="relative h-[22rem] w-72 rounded-[2rem] object-cover object-top shadow-[0_28px_70px_rgb(26_22_18/0.18)] sm:h-[26rem] sm:w-80"
              />
            </div>
          </div>
        </Container>
      </section>

      <section className="border-b border-line bg-paper-muted/35 py-8 sm:py-10">
        <Container>
          <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {facts.map((fact) => (
              <li
                key={fact.id}
                className={`rounded-3xl border bg-surface p-4 shadow-[0_1px_0_rgb(26_22_18/0.04)] sm:p-5 ${
                  fact.id === "availability" ? "border-accent/35" : "border-line"
                }`}
              >
                <span
                  className={`grid h-10 w-10 place-items-center rounded-2xl ${
                    fact.id === "availability" ? "bg-accent/15 text-accent" : "bg-paper-muted text-ink"
                  }`}
                >
                  <FactIcon name={fact.id} />
                </span>
                <p className="mt-4 text-xs tracking-[0.16em] text-muted uppercase">{fact.label}</p>
                <p className="mt-1.5 font-display text-lg leading-snug text-ink sm:text-xl">{fact.value}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="border-b border-line py-16 lg:py-24">
        <Container>
          <div className="max-w-3xl">
            <p className="text-xs tracking-[0.18em] text-accent uppercase">Biography</p>
            {lead ? (
              <p className="mt-5 font-display text-3xl leading-snug text-ink">{lead}</p>
            ) : null}
            {restBiography.length > 0 ? (
              <div className="mt-8 space-y-5 text-lg leading-8 text-ink-soft">
                {restBiography.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            ) : null}
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-2">
            <blockquote className="rounded-[1.75rem] border border-line bg-surface p-8">
              <p className="font-display text-5xl leading-none text-accent/25">“</p>
              <h2 className="mt-2 font-display text-2xl text-ink">Career objective</h2>
              <p className="mt-4 text-base leading-8 text-ink-soft">{profile.careerObjectives}</p>
            </blockquote>
            <blockquote className="rounded-[1.75rem] border border-line bg-surface p-8">
              <p className="font-display text-5xl leading-none text-accent/25">“</p>
              <h2 className="mt-2 font-display text-2xl text-ink">How I work</h2>
              <p className="mt-4 text-base leading-8 text-ink-soft">{profile.philosophy}</p>
            </blockquote>
          </div>

          {profile.interests.length > 0 ? (
            <div className="mt-6 rounded-[1.75rem] border border-line bg-surface p-8">
              <p className="text-xs tracking-[0.18em] text-accent uppercase">Now</p>
              <h2 className="mt-2 font-display text-2xl text-ink">Current interests</h2>
              <ul className="mt-6 flex flex-wrap gap-2">
                {profile.interests.map((interest) => (
                  <li key={interest}>
                    <span className="inline-flex items-center gap-2 rounded-full border border-line bg-paper-muted/60 px-4 py-2 text-sm text-ink">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
                      {interest}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Container>
      </section>

      {hasVideo || publicGalleryUrls(profile.gallery).length > 0 ? (
        <MediaSection
          embedUrl={profile.embedVideoUrl}
          introVideoUrl={profile.introVideoUrl}
          images={publicGalleryUrls(profile.gallery)}
        />
      ) : null}

      {profile.links.length > 0 ? (
        <section className="py-16 lg:py-24">
          <Container>
            <p className="text-xs tracking-[0.18em] text-accent uppercase">Connect</p>
            <h2 className="mt-3 font-display text-3xl text-ink">Professional links</h2>
            <p className="mt-2 max-w-xl text-ink-soft">
              Named links, so you can see where they go. For new work, the contact form is fastest.
            </p>
            <ProfileLinks className="mt-8" layout="pills" links={profile.links} />
            <Link
              to="/contact"
              className="mt-10 inline-flex text-sm text-accent hover:text-accent-dark"
            >
              Prefer to write a message? Contact me →
            </Link>
          </Container>
        </section>
      ) : null}
    </>
  );
}
