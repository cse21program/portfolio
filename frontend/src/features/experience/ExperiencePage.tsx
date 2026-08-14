import { PageHeader } from "@/components/ui/PageHeader";
import { Container } from "@/components/ui/Container";
import { Tag } from "@/components/ui/Tag";
import { experiences } from "@/content/experience";

export function ExperiencePage() {
  return (
    <>
      <PageHeader
        eyebrow="Experience"
        title="Work and practice"
        description="Roles, responsibilities, and the stack used along the way."
      />
      <Container className="space-y-10 py-16">
        {experiences.map((item) => (
          <article key={item.company} className="rounded-3xl border border-line bg-surface p-8">
            <p className="text-sm text-muted">
              {item.startDate}
              {item.endDate ? ` — ${item.endDate}` : ""} · {item.type}
            </p>
            <h2 className="mt-2 font-display text-3xl text-ink">{item.position}</h2>
            <p className="text-ink-soft">
              {item.company} · {item.location}
            </p>
            <p className="mt-4 max-w-3xl leading-7 text-ink-soft">{item.description}</p>
            <h3 className="mt-8 text-sm font-semibold text-ink">Responsibilities</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-ink-soft">
              {item.responsibilities.map((entry) => (
                <li key={entry}>{entry}</li>
              ))}
            </ul>
            <h3 className="mt-8 text-sm font-semibold text-ink">Achievements</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-ink-soft">
              {item.achievements.map((entry) => (
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
      </Container>
    </>
  );
}
