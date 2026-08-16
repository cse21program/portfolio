import { profile, socialLinks } from "@/content/profile";
import { PageHeader } from "@/components/ui/PageHeader";
import { Container } from "@/components/ui/Container";
import { Tag } from "@/components/ui/Tag";

export function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About"
        title={profile.fullName}
        description={profile.shortBiography}
      />
      <Container className="grid gap-12 py-16 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <img
            src={profile.profileImage}
            alt={profile.fullName}
            className="w-full max-w-sm rounded-[2rem] object-cover object-top shadow-[0_24px_60px_rgb(26_22_18/0.12)]"
          />
          <dl className="mt-8 space-y-3 text-sm">
            <div>
              <dt className="text-muted">Location</dt>
              <dd className="text-ink">{profile.location}</dd>
            </div>
            <div>
              <dt className="text-muted">Availability</dt>
              <dd className="text-ink">{profile.availability}</dd>
            </div>
            <div>
              <dt className="text-muted">Languages</dt>
              <dd className="text-ink">{profile.languages.join(", ")}</dd>
            </div>
            <div>
              <dt className="text-muted">Focus</dt>
              <dd className="text-ink">{profile.yearsOfExperience}</dd>
            </div>
          </dl>
        </div>
        <div className="space-y-6 text-base leading-8 text-ink-soft">
          {profile.detailedBiography.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <div>
            <h2 className="font-display text-2xl text-ink">Career objective</h2>
            <p className="mt-3">{profile.careerObjectives}</p>
          </div>
          <div>
            <h2 className="font-display text-2xl text-ink">Philosophy</h2>
            <p className="mt-3">{profile.philosophy}</p>
          </div>
          <div>
            <h2 className="font-display text-2xl text-ink">Current interests</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {profile.interests.map((interest) => (
                <Tag key={interest}>{interest}</Tag>
              ))}
            </div>
          </div>
          <div>
            <h2 className="font-display text-2xl text-ink">Links</h2>
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              {socialLinks.map((link) => (
                <a key={link.label} href={link.href} className="text-accent">
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </>
  );
}
