import { PageHeader } from "@/components/ui/PageHeader";
import { Container } from "@/components/ui/Container";
import { Tag } from "@/components/ui/Tag";
import { site } from "@/config/site";
import { education, experiences } from "@/content/experience";
import { certificates } from "@/content/certificates";
import { featuredProjects } from "@/content/projects";
import { heroSkills } from "@/content/profile";
import { useAboutProfile } from "@/features/about/AboutProfileContext";

export function ResumePage() {
  const { profile } = useAboutProfile();
  return (
    <>
      <PageHeader
        eyebrow="Resume"
        title="Curriculum vitae"
        description={site.resumeNote}
      />
      <Container className="space-y-12 py-16 print:py-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl text-ink">{profile.fullName}</h2>
            <p className="text-ink-soft">{profile.professionalTitle}</p>
            <p className="mt-2 text-sm text-muted">
              {profile.location} · {site.email}
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-full bg-ink px-5 py-2.5 text-sm text-paper print:hidden"
          >
            Download / print PDF
          </button>
        </div>

        <section>
          <h3 className="text-sm tracking-wide text-accent uppercase">Summary</h3>
          <p className="mt-3 max-w-3xl text-ink-soft">{profile.shortBiography}</p>
        </section>

        <section>
          <h3 className="text-sm tracking-wide text-accent uppercase">Experience</h3>
          <div className="mt-6 space-y-8">
            {experiences.map((item) => (
              <article key={item.company}>
                <p className="font-medium text-ink">
                  {item.position} · {item.company}
                </p>
                <p className="text-sm text-muted">
                  {item.type} · {item.location} · {item.startDate}
                  {item.endDate ? ` — ${item.endDate}` : ""}
                </p>
                <p className="mt-2 text-sm text-ink-soft">{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-sm tracking-wide text-accent uppercase">Education</h3>
          {education.map((item) => (
            <article key={item.institution} className="mt-4">
              <p className="font-medium text-ink">
                {item.degree} {item.field}
              </p>
              <p className="text-sm text-muted">{item.institution}</p>
            </article>
          ))}
        </section>

        <section>
          <h3 className="text-sm tracking-wide text-accent uppercase">Skills</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {heroSkills.map((skill) => (
              <Tag key={skill}>{skill}</Tag>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-sm tracking-wide text-accent uppercase">Certificates</h3>
          <ul className="mt-4 space-y-2 text-sm text-ink-soft">
            {certificates.map((item) => (
              <li key={item.slug}>
                {item.title} — {item.organization}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="text-sm tracking-wide text-accent uppercase">Projects</h3>
          <ul className="mt-4 space-y-2 text-sm text-ink-soft">
            {featuredProjects.map((item) => (
              <li key={item.slug}>
                {item.title} — {item.shortDescription}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="text-sm tracking-wide text-accent uppercase">Languages</h3>
          <p className="mt-3 text-sm text-ink-soft">{profile.languages.join(", ")}</p>
        </section>
      </Container>
    </>
  );
}
