import { PageHeader } from "@/components/ui/PageHeader";
import { Container } from "@/components/ui/Container";
import { education } from "@/content/experience";

export function EducationPage() {
  return (
    <>
      <PageHeader
        eyebrow="Education"
        title="Study and supporting work"
        description="Degrees, institutions, and how they connect to the software I ship."
      />
      <Container className="space-y-8 py-16">
        {education.map((item) => (
          <article key={item.institution} className="rounded-3xl border border-line bg-surface p-8">
            <h2 className="font-display text-3xl text-ink">
              {item.degree} {item.field}
            </h2>
            <p className="mt-2 text-ink-soft">
              {item.institution} · {item.location}
            </p>
            <p className="mt-2 text-sm text-muted">
              {item.startDate}
              {item.endDate ? ` — ${item.endDate}` : ""}
              {item.grade ? ` · ${item.grade}` : ""}
            </p>
            <p className="mt-4 max-w-3xl leading-7 text-ink-soft">{item.description}</p>
            <ul className="mt-6 list-disc space-y-2 pl-5 text-sm text-ink-soft">
              {item.achievements.map((entry) => (
                <li key={entry}>{entry}</li>
              ))}
            </ul>
            {item.website ? (
              <a href={item.website} className="mt-6 inline-block text-sm text-accent" target="_blank" rel="noreferrer">
                Institution website
              </a>
            ) : null}
          </article>
        ))}
      </Container>
    </>
  );
}
