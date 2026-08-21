import { ButtonLink } from "@/components/ui/ButtonLink";
import { Container } from "@/components/ui/Container";
import { ContentCard } from "@/components/ui/ContentCard";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Tag } from "@/components/ui/Tag";
import { site } from "@/config/site";
import { useExperiences } from "@/features/experience/useExperiences";
import { useEducation } from "@/features/education/useEducation";
import { displayEndDate } from "@/types/experience";
import { displayEducationEndDate } from "@/types/education";
import { useCertificates } from "@/features/certificates/useCertificates";
import { publishedCertificates } from "@/types/certificates";
import { useProjects } from "@/features/projects/useProjects";
import { selectFeaturedProjects } from "@/types/projects";
import { heroSkills } from "@/content/profile";
import { useAboutProfile } from "@/features/about/AboutProfileContext";
import { ProfileLinks } from "@/features/about/ProfileLinks";
import { IntroVideo, hasIntroVideo } from "@/features/about/IntroVideo";
import { isUsableHref } from "@/features/about/linkPlatforms";
import { ResumePrint } from "@/features/resume/ResumePrint";
import { createResumeView, dateRange, splitName } from "@/features/resume/resumeView";
import { useResume } from "@/features/resume/useResume";
import { pdfDownloadHref, type ResumeCredit } from "@/types/resume";

function CreditGallery({
  heading,
  items,
}: {
  heading: string;
  items: ResumeCredit[];
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <Section>
      <SectionHeader eyebrow="Highlights" title={heading} />
      <ul className="grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <li
            key={`${heading}-${item.title}-${item.year}`}
            className="rounded-[1.75rem] border border-line bg-surface p-6 shadow-[0_1px_0_rgb(26_22_18/0.04)]"
          >
            <p className="text-xs tracking-[0.16em] text-accent uppercase">{item.year || "—"}</p>
            <h3 className="mt-2 font-display text-2xl text-ink">
              {item.href && isUsableHref(item.href) ? (
                <a className="hover:text-accent-dark" href={item.href}>
                  {item.title}
                </a>
              ) : (
                item.title
              )}
            </h3>
            {item.detail ? <p className="mt-2 text-sm leading-6 text-ink-soft">{item.detail}</p> : null}
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function ResumePage() {
  const { profile } = useAboutProfile();
  const { resume } = useResume();
  const { experiences } = useExperiences();
  const { education } = useEducation();
  const { projects } = useProjects();
  const { certificates } = useCertificates();
  const selectedProjects = selectFeaturedProjects(projects);
  const visibleCertificates = publishedCertificates(certificates);
  const model = createResumeView(profile, resume);
  const name = splitName(profile.fullName);
  const showVideo = hasIntroVideo(profile.embedVideoUrl, profile.introVideoUrl);

  return (
    <>
      <div className="resume-screen print:hidden">
        <section className="relative overflow-hidden border-b border-line bg-surface">
          <div className="pointer-events-none absolute -top-28 left-1/3 h-80 w-80 rounded-full bg-accent/15 blur-3xl" />
          <div className="pointer-events-none absolute right-0 bottom-0 h-56 w-56 rounded-full bg-paper-muted blur-3xl" />
          <Container className="relative grid items-center gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/90 px-3 py-1 text-xs tracking-[0.16em] text-accent uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                Resume
              </p>
              <h1
                className="mt-5 font-display text-5xl leading-[1.02] tracking-tight text-ink sm:text-6xl lg:text-7xl"
                aria-label={profile.fullName}
              >
                {name.first}
                {name.rest ? <span className="mt-1 block italic text-accent">{name.rest}</span> : null}
              </h1>
              <p className="mt-4 text-xl text-ink-soft">{model.headline}</p>
              <p className="mt-8 max-w-xl font-display text-2xl leading-snug text-ink sm:text-[1.7rem]">
                {model.summary}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                {resume.pdfUrl ? (
                  <a
                    className="inline-flex items-center rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper shadow-sm transition hover:bg-accent"
                    href={pdfDownloadHref(resume.pdfUrl, resume.pdfFileName)}
                    download={resume.pdfFileName ?? "resume.pdf"}
                  >
                    Download PDF
                  </a>
                ) : null}
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center rounded-full border border-line bg-surface/80 px-5 py-2.5 text-sm font-medium text-ink transition hover:border-accent/40"
                >
                  Print this page
                </button>
                <ButtonLink to="/contact" variant="ghost">
                  Contact
                </ButtonLink>
              </div>
              <ProfileLinks className="mt-8" links={profile.links} layout="pills" />
            </div>

            {profile.profilePhotoUrl ? (
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
                  <p className="absolute -bottom-4 left-1/2 w-max -translate-x-1/2 rounded-full border border-line bg-surface px-4 py-2 text-xs text-ink shadow-sm">
                    {profile.availability}
                  </p>
                </div>
              </div>
            ) : null}
          </Container>
        </section>

        {showVideo ? (
          <section className="border-b border-line bg-paper-muted/35 py-16 lg:py-20">
            <Container>
              <p className="text-xs tracking-[0.18em] text-accent uppercase">Introduction</p>
              <h2 className="mt-3 font-display text-3xl text-ink">A short introduction</h2>
              <p className="mt-2 max-w-xl text-ink-soft">Press play when you want sound.</p>
              <div className="mt-8">
                <IntroVideo
                  embedUrl={profile.embedVideoUrl}
                  fileUrl={profile.introVideoUrl}
                  poster={profile.profilePhotoUrl}
                />
              </div>
            </Container>
          </section>
        ) : null}

        <section className="border-b border-line bg-paper-muted/35 py-8 sm:py-10">
          <Container>
            <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                { label: "Location", value: profile.location },
                { label: "Languages", value: profile.languages.join(" · ") },
                { label: "Focus", value: profile.yearsOfExperience },
                { label: "Availability", value: profile.availability },
              ].map((fact) => (
                <li
                  key={fact.label}
                  className="rounded-3xl border border-line bg-surface p-4 shadow-[0_1px_0_rgb(26_22_18/0.04)] sm:p-5"
                >
                  <p className="text-xs tracking-[0.16em] text-muted uppercase">{fact.label}</p>
                  <p className="mt-1.5 font-display text-lg leading-snug text-ink sm:text-xl">{fact.value}</p>
                </li>
              ))}
            </ul>
          </Container>
        </section>

        <Section>
          <SectionHeader
            eyebrow="Work"
            title="Experience"
            description="Roles, delivery, and the stack used along the way."
            to="/experience"
            actionLabel="Full timeline"
          />
          <div className="space-y-6">
            {experiences.map((item, index) => (
              <article
                key={item.id ?? `${item.company}-${item.position}-${index}`}
                className="rounded-[1.75rem] border border-line bg-surface p-6 shadow-[0_1px_0_rgb(26_22_18/0.04)] sm:p-8"
              >
                <p className="text-xs tracking-[0.16em] text-accent uppercase">
                  {dateRange(item.startDate, displayEndDate(item))} · {item.type}
                </p>
                <h3 className="mt-3 font-display text-3xl text-ink">{item.position}</h3>
                <p className="mt-1 text-ink-soft">
                  {item.company} · {item.location}
                </p>
                <p className="mt-4 max-w-3xl leading-7 text-ink-soft">{item.description}</p>
                <ul className="mt-5 list-disc space-y-2 pl-5 text-sm leading-6 text-ink-soft">
                  {item.responsibilities.map((entry) => (
                    <li key={entry}>{entry}</li>
                  ))}
                </ul>
                <div className="mt-6 flex flex-wrap gap-2">
                  {item.technologies.map((tech) => (
                    <Tag key={tech}>{tech}</Tag>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </Section>

        <Section className="border-t border-line bg-paper-muted/40">
          <SectionHeader eyebrow="Study" title="Education" to="/education" actionLabel="Education page" />
          <div className="grid gap-5 lg:grid-cols-2">
            {education.map((item, index) => (
              <article
                key={item.id ?? `${item.institution}-${item.degree}-${index}`}
                className="rounded-[1.75rem] border border-line bg-surface p-6 sm:p-8"
              >
                <p className="text-xs tracking-[0.16em] text-accent uppercase">
                  {dateRange(item.startDate, displayEducationEndDate(item))}
                </p>
                <h3 className="mt-3 font-display text-2xl text-ink">
                  {item.degree} {item.field}
                </h3>
                <p className="mt-1 text-ink-soft">
                  {item.institution} · {item.location}
                </p>
                <p className="mt-4 text-sm leading-7 text-ink-soft">{item.description}</p>
              </article>
            ))}
          </div>
        </Section>

        <Section>
          <SectionHeader
            eyebrow="Build"
            title="Selected projects"
            to="/projects"
            actionLabel="All projects"
          />
          <div className="grid gap-5 lg:grid-cols-2">
            {selectedProjects.map((item, index) => (
              <ContentCard
                key={item.slug}
                to={`/projects/${item.slug}`}
                eyebrow={item.category}
                title={item.title}
                description={item.shortDescription}
                meta={dateRange(item.startDate, item.endDate)}
                tags={item.technologies.slice(0, 4)}
                featured={index === 0}
              />
            ))}
          </div>
        </Section>

        <CreditGallery heading="Awards" items={resume.awards} />
        <CreditGallery heading="Publications" items={resume.publications} />

        <Section className="border-t border-line bg-paper-muted/40">
          <SectionHeader eyebrow="Proof" title="Certificates" to="/certificates" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleCertificates.map((item) => (
              <article key={item.slug} className="rounded-3xl border border-line bg-surface p-5">
                <p className="text-xs tracking-[0.16em] text-accent uppercase">{item.issueDate}</p>
                <h3 className="mt-2 font-display text-xl text-ink">{item.title}</h3>
                <p className="mt-1 text-sm text-ink-soft">{item.organization}</p>
              </article>
            ))}
          </div>
        </Section>

        <Section>
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <SectionHeader eyebrow="Craft" title="Skills" to="/skills" />
              <div className="flex flex-wrap gap-2">
                {heroSkills.map((skill) => (
                  <Tag key={skill}>{skill}</Tag>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-[1.75rem] border border-line bg-surface p-6">
                <h2 className="font-display text-2xl text-ink">Languages</h2>
                <p className="mt-2 leading-7 text-ink-soft">{profile.languages.join(" · ")}</p>
              </div>
              <div className="rounded-[1.75rem] border border-line bg-surface p-6">
                <h2 className="font-display text-2xl text-ink">Interests</h2>
                <p className="mt-2 leading-7 text-ink-soft">{profile.interests.join(" · ")}</p>
              </div>
            </div>
          </div>
        </Section>

        <section className="border-t border-line bg-surface py-16">
          <Container className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <p className="text-xs tracking-[0.18em] text-accent uppercase">Print</p>
              <p className="mt-2 font-display text-3xl text-ink">Need a one-page CV?</p>
              <p className="mt-2 max-w-lg text-ink-soft">{site.resumeNote}</p>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper hover:bg-accent"
            >
              Print this page
            </button>
          </Container>
        </section>
      </div>

      <ResumePrint
        model={model}
        experiences={experiences}
        education={education}
        projects={selectedProjects}
        certificates={visibleCertificates}
      />
    </>
  );
}
