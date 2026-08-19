import { Link } from "react-router-dom";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { ContentCard } from "@/components/ui/ContentCard";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Tag } from "@/components/ui/Tag";
import { site } from "@/config/site";
import { featuredCertificates } from "@/content/certificates";
import { courses, tutorials } from "@/content/learning";
import { heroSkills } from "@/content/profile";
import { featuredServices, testimonials } from "@/content/services";
import { useAboutProfile } from "@/features/about/AboutProfileContext";
import { ProfileLinks } from "@/features/about/ProfileLinks";
import { useBlogs } from "@/features/blog/useBlogs";
import { useExperiences } from "@/features/experience/useExperiences";
import { useProjects } from "@/features/projects/useProjects";
import { useFields } from "@/features/skills/useFields";
import { useSkills } from "@/features/skills/useSkills";
import { publishedArticles } from "@/types/blog";
import { displayEndDate } from "@/types/experience";
import { publishedFields } from "@/types/fields";
import { selectFeaturedProjects } from "@/types/projects";
import { groupSkillsByField, selectFeaturedSkills } from "@/types/skills";

export function HomePage() {
  const { projects } = useProjects();
  const [leadProject, ...otherProjects] = selectFeaturedProjects(projects);
  const { skills } = useSkills();
  const { fields } = useFields();
  const featuredSkillGroups = groupSkillsByField(
    selectFeaturedSkills(skills),
    publishedFields(fields).map((item) => item.name),
  );
  const { profile } = useAboutProfile();
  const { experiences } = useExperiences();
  const { articles } = useBlogs();
  const recentArticles = publishedArticles(articles).slice(0, 3);

  return (
    <>
      <section className="relative overflow-hidden border-b border-line bg-surface">
        <div className="pointer-events-none absolute -top-32 left-1/3 h-80 w-80 rounded-full bg-accent/15 blur-3xl" />
        <div className="pointer-events-none absolute right-0 bottom-0 h-56 w-56 rounded-full bg-paper-muted blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:py-24">
          <div>
            <p className="flex items-center gap-2 text-xs tracking-[0.18em] text-accent uppercase">
              <span className="inline-block h-px w-6 bg-accent" />
              {profile.professionalTitle}
            </p>
            <h1 className="mt-5 font-display text-5xl leading-[1.05] tracking-tight text-ink sm:text-6xl lg:text-7xl">
              {profile.fullName.split(" ")[0]}{" "}
              <span className="italic text-accent">
                {profile.fullName.split(" ").slice(1).join(" ") || profile.fullName}
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-ink-soft">
              {site.introduction}
            </p>
            <div className="mt-7 flex flex-wrap gap-2">
              {heroSkills.map((skill) => (
                <Tag key={skill}>{skill}</Tag>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink to="/projects">View projects</ButtonLink>
              <ButtonLink to="/services" variant="secondary">
                Hire me
              </ButtonLink>
              <ButtonLink to="/resume" variant="ghost">
                Resume
              </ButtonLink>
            </div>
            <ProfileLinks className="mt-8" links={profile.links} />
          </div>

          <div className="flex justify-center lg:justify-end">
            <div className="relative">
              <div className="absolute -top-6 -right-6 h-28 w-28 rounded-full bg-accent/20" />
              <div className="absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-paper-muted" />
              <img
                src={profile.profilePhotoUrl}
                alt={profile.fullName}
                width={320}
                height={400}
                className="relative h-80 w-64 rounded-[2rem] object-cover object-top shadow-[0_24px_60px_rgb(26_22_18/0.18)] sm:h-[22rem] sm:w-72"
              />
              <p className="absolute -bottom-4 left-1/2 w-max -translate-x-1/2 rounded-full border border-line bg-surface px-4 py-2 text-xs text-ink shadow-sm">
                {profile.availability}
              </p>
            </div>
          </div>
        </div>
      </section>

      <Section>
        <SectionHeader
          eyebrow="About"
          title="A short biography"
          to="/about"
          actionLabel="Read more"
        />
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="font-display text-3xl leading-snug text-ink sm:text-4xl">
              {profile.shortBiography}
            </p>
            <p className="mt-4 text-sm text-muted">
              {profile.location}
              <span className="mx-2 text-line">·</span>
              {profile.availability}
            </p>
          </div>
          <p className="text-base leading-8 text-ink-soft">{profile.detailedBiography[0]}</p>
        </div>
      </Section>

      <Section className="bg-paper-muted/40">
        <SectionHeader
          eyebrow="Skills"
          title="What I work in"
          description="Fields, then skills, then topics you can open."
          to="/skills"
        />
        <div className="overflow-hidden rounded-[1.75rem] border border-line bg-surface">
          {featuredSkillGroups.map((group) => (
            <div
              key={group.field}
              className="flex flex-col gap-3 border-b border-line px-5 py-5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:px-7 hover:bg-paper/70"
            >
              <p className="text-sm font-medium text-ink">
                <Link
                  to={`/fields/${group.skills[0]?.fieldSlug || group.field.toLowerCase().replace(/\s+/g, "-")}`}
                  className="hover:text-accent-dark"
                >
                  {group.field}
                </Link>
              </p>
              <ul className="flex flex-wrap gap-2 sm:justify-end">
                {group.skills.map((skill) => (
                  <li key={skill.slug}>
                    <Link
                      to={`/skills/${skill.slug}`}
                      className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-1.5 text-sm text-ink transition hover:border-accent hover:text-accent-dark"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
                      {skill.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeader eyebrow="Projects" title="Selected case studies" to="/projects" />
        <div className="grid gap-5 lg:grid-cols-3">
          {leadProject ? (
            <div className="lg:col-span-2">
              <ContentCard
                featured
                to={`/projects/${leadProject.slug}`}
                image={leadProject.thumbnailUrl}
                eyebrow={`Featured · ${leadProject.category}`}
                title={leadProject.title}
                description={leadProject.shortDescription}
                tags={leadProject.technologies.slice(0, 5)}
              />
            </div>
          ) : null}
          {otherProjects.map((project) => (
            <ContentCard
              key={project.slug}
              to={`/projects/${project.slug}`}
              eyebrow={project.category}
              title={project.title}
              description={project.shortDescription}
              tags={project.technologies.slice(0, 4)}
            />
          ))}
        </div>
      </Section>

      <Section className="bg-paper-muted/40">
        <SectionHeader eyebrow="Services" title="Work we can do together" to="/services" />
        <div className="grid gap-5 lg:grid-cols-3">
          {featuredServices.map((service) => (
            <ContentCard
              key={service.slug}
              to={`/services/${service.slug}`}
              eyebrow={service.pricingType}
              title={service.title}
              description={service.shortDescription}
              meta={`${service.startingPrice} · ${service.deliveryTime}`}
            />
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeader eyebrow="Courses" title="Learn the production path" to="/courses" />
        <div className="grid gap-5 md:grid-cols-2">
          {courses.map((course) => (
            <ContentCard
              key={course.slug}
              to={`/courses/${course.slug}`}
              eyebrow={course.difficulty}
              title={course.title}
              description={course.subtitle}
              meta={`${course.salePrice ?? course.price} · ${course.duration}`}
            />
          ))}
        </div>
      </Section>

      <Section className="bg-paper-muted/40">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHeader eyebrow="Tutorials" title="Recent tutorials" to="/tutorials" />
            <div className="space-y-4">
              {tutorials.map((tutorial) => (
                <ContentCard
                  key={tutorial.slug}
                  to={`/tutorials/${tutorial.slug}`}
                  title={tutorial.title}
                  description={tutorial.description}
                  meta={`${tutorial.difficulty} · ${tutorial.duration}`}
                />
              ))}
            </div>
          </div>
          <div>
            <SectionHeader eyebrow="Blog" title="Recent articles" to="/blog" />
            <div className="space-y-4">
              {recentArticles.map((article) => (
                <ContentCard
                  key={article.slug}
                  to={`/blog/${article.slug}`}
                  title={article.title}
                  description={article.excerpt}
                  meta={`${article.publishedAt} · ${article.readingTime}`}
                />
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section>
        <SectionHeader eyebrow="Experience" title="Work so far" to="/experience" />
        <div className="relative space-y-0 before:absolute before:top-2 before:bottom-2 before:left-[0.4rem] before:w-px before:bg-line">
          {experiences.map((item, index) => (
            <article key={item.id ?? `${item.company}-${index}`} className="relative grid gap-4 py-6 pl-10 md:grid-cols-[9rem_1fr]">
              <span className="absolute top-8 left-0 h-3.5 w-3.5 rounded-full border-2 border-accent bg-surface" />
              <p className="text-sm text-muted">
                {item.startDate}
                {displayEndDate(item) ? ` — ${displayEndDate(item)}` : ""}
              </p>
              <div>
                <h3 className="font-display text-2xl text-ink">{item.position}</h3>
                <p className="text-ink-soft">{item.company}</p>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-ink-soft">
                  {item.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section className="bg-paper-muted/40">
        <SectionHeader eyebrow="Certificates" title="Credentials" to="/certificates" />
        <div className="grid gap-5 md:grid-cols-2">
          {featuredCertificates.map((certificate) => (
            <article
              key={certificate.slug}
              className="rounded-3xl border border-line bg-surface p-6 shadow-[0_1px_0_rgb(26_22_18/0.04)]"
            >
              <p className="text-xs tracking-[0.16em] text-accent uppercase">
                {certificate.organization}
              </p>
              <h3 className="mt-2 font-display text-2xl text-ink">{certificate.title}</h3>
              <p className="mt-3 text-sm leading-7 text-ink-soft">{certificate.description}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeader eyebrow="Testimonials" title="What people say" />
        <div className="grid gap-5 lg:grid-cols-3">
          {testimonials.map((item) => (
            <blockquote
              key={item.name}
              className="relative overflow-hidden rounded-3xl border border-line bg-surface p-6"
            >
              <span className="pointer-events-none absolute -top-3 right-4 font-display text-7xl text-accent/15">
                “
              </span>
              <p className="relative text-sm leading-7 text-ink-soft">{item.comment}</p>
              <footer className="relative mt-5 text-sm text-ink">
                {item.name}
                <span className="block text-muted">
                  {item.position}, {item.company}
                </span>
              </footer>
            </blockquote>
          ))}
        </div>
      </Section>

      <section className="relative overflow-hidden bg-ink text-paper">
        <div className="pointer-events-none absolute -right-16 -bottom-20 h-64 w-64 rounded-full bg-accent/30 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <p className="flex items-center gap-2 text-xs tracking-[0.18em] text-paper-muted uppercase">
            <span className="inline-block h-px w-6 bg-paper-muted" />
            Hire me
          </p>
          <h2 className="mt-4 max-w-2xl font-display text-4xl leading-tight sm:text-5xl">
            Have a backend, cloud, or teaching brief?
          </h2>
          <p className="mt-4 max-w-xl text-paper-muted">
            Tell me about the system, the deadline, and the outcome you need.
          </p>
          <Link
            to="/contact"
            className="mt-8 inline-flex rounded-full bg-paper px-5 py-2.5 text-sm font-medium text-ink hover:bg-paper-muted"
          >
            Contact me
          </Link>
        </div>
      </section>
    </>
  );
}
