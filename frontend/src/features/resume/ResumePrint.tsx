import type { ReactNode } from "react";
import type { Education, Experience, Project } from "@/types/public";
import { certificates } from "@/content/certificates";
import { heroSkills } from "@/content/profile";
import { isUsableHref } from "@/features/about/linkPlatforms";
import { dateRange, type ResumeViewModel } from "@/features/resume/resumeView";
import { displayEndDate } from "@/types/experience";
import { displayEducationEndDate } from "@/types/education";
import type { ResumeCredit } from "@/types/resume";

function PrintSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="break-inside-avoid">
      <h2 className="border-b border-neutral-300 pb-1 text-[10.5px] font-semibold tracking-[0.18em] text-black uppercase">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function PrintRow({
  title,
  subtitle,
  when,
}: {
  title: ReactNode;
  subtitle?: string;
  when: string;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-0.5">
      <div className="min-w-0">
        <p className="text-[13.5px] font-semibold text-black">{title}</p>
        {subtitle ? <p className="text-[12px] text-neutral-600">{subtitle}</p> : null}
      </div>
      <p className="shrink-0 text-[11.5px] tabular-nums text-neutral-500">{when}</p>
    </div>
  );
}

function PrintCredits({ items }: { items: ResumeCredit[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={`${item.title}-${item.year}`}>
          <PrintRow
            title={
              item.href && isUsableHref(item.href) ? (
                <a href={item.href}>{item.title}</a>
              ) : (
                item.title
              )
            }
            subtitle={item.detail || undefined}
            when={item.year}
          />
        </li>
      ))}
    </ul>
  );
}

export function ResumePrint({
  model,
  experiences,
  education,
  projects = [],
}: {
  model: ResumeViewModel;
  experiences: Experience[];
  education: Education[];
  projects?: Project[];
}) {
  const { profile, resume, headline, summary, contacts } = model;

  return (
    <article className="resume-print hidden font-sans text-black print:block" aria-hidden="true">
      <header className="border-b border-neutral-300 pb-3">
        <p className="text-[22px] font-semibold tracking-tight">{profile.fullName}</p>
        <p className="mt-0.5 text-[13px] text-neutral-700">{headline}</p>
        <p className="mt-2 text-[11.5px] text-neutral-600">
          {contacts.map((item) => item.label).join("  ·  ")}
        </p>
      </header>

      <div className="mt-5 space-y-5">
        <PrintSection title="Professional summary">
          <p className="text-[12.5px] leading-5 text-neutral-700">{summary}</p>
        </PrintSection>

        <PrintSection title="Experience">
          <div className="space-y-4">
            {experiences.map((item, index) => (
              <div key={item.id ?? `${item.company}-${item.position}-${index}`} className="break-inside-avoid">
                <PrintRow
                  title={`${item.position}, ${item.company}`}
                  subtitle={`${item.type} · ${item.location}`}
                  when={dateRange(item.startDate, displayEndDate(item))}
                />
                <p className="mt-1.5 text-[12.5px] leading-5 text-neutral-700">{item.description}</p>
                <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-[12.5px] leading-5 text-neutral-700">
                  {item.responsibilities.map((entry) => (
                    <li key={entry}>{entry}</li>
                  ))}
                  {item.achievements.map((entry) => (
                    <li key={entry}>{entry}</li>
                  ))}
                </ul>
                {item.technologies.length > 0 ? (
                  <p className="mt-1 text-[11.5px] text-neutral-500">
                    Technologies: {item.technologies.join(", ")}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </PrintSection>

        <PrintSection title="Education">
          {education.map((item, index) => (
            <div key={item.id ?? `${item.institution}-${item.degree}-${index}`} className="break-inside-avoid">
              <PrintRow
                title={`${item.degree} ${item.field}`}
                subtitle={`${item.institution} · ${item.location}`}
                when={dateRange(item.startDate, displayEducationEndDate(item))}
              />
            </div>
          ))}
        </PrintSection>

        <PrintSection title="Selected projects">
          <div className="space-y-3">
            {projects.map((item) => (
              <div key={item.slug} className="break-inside-avoid">
                <PrintRow
                  title={item.title}
                  subtitle={item.category}
                  when={dateRange(item.startDate, item.endDate)}
                />
                <p className="mt-1 text-[12.5px] leading-5 text-neutral-700">{item.shortDescription}</p>
              </div>
            ))}
          </div>
        </PrintSection>

        {resume.publications.length > 0 ? (
          <PrintSection title="Publications">
            <PrintCredits items={resume.publications} />
          </PrintSection>
        ) : null}

        {resume.awards.length > 0 ? (
          <PrintSection title="Awards">
            <PrintCredits items={resume.awards} />
          </PrintSection>
        ) : null}

        <PrintSection title="Certifications">
          <ul className="space-y-2">
            {certificates.map((item) => (
              <li key={item.slug}>
                <PrintRow title={item.title} subtitle={item.organization} when={item.issueDate} />
              </li>
            ))}
          </ul>
        </PrintSection>

        <PrintSection title="Technical skills">
          <p className="text-[12.5px] leading-5 text-neutral-700">{heroSkills.join(" · ")}</p>
        </PrintSection>

        <div className="grid grid-cols-2 gap-5">
          {profile.languages.length > 0 ? (
            <PrintSection title="Languages">
              <p className="text-[12.5px] text-neutral-700">{profile.languages.join(" · ")}</p>
            </PrintSection>
          ) : null}
          {profile.interests.length > 0 ? (
            <PrintSection title="Interests">
              <p className="text-[12.5px] text-neutral-700">{profile.interests.join(" · ")}</p>
            </PrintSection>
          ) : null}
        </div>
      </div>
    </article>
  );
}
