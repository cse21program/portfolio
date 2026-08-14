import { useParams } from "react-router-dom";
import { Container } from "@/components/ui/Container";
import { NotFoundState } from "@/components/ui/NotFoundState";
import { getTutorial } from "@/content/learning";

export function TutorialDetailPage() {
  const { slug = "" } = useParams();
  const tutorial = getTutorial(slug);

  if (!tutorial) {
    return <NotFoundState title="Tutorial not found" />;
  }

  return (
    <Container className="max-w-3xl space-y-8 py-16">
      <div>
        <p className="text-sm tracking-wide text-accent uppercase">
          {tutorial.difficulty} · {tutorial.skill}
        </p>
        <h1 className="mt-3 font-display text-5xl text-ink">{tutorial.title}</h1>
        <p className="mt-4 text-lg text-ink-soft">{tutorial.description}</p>
        <p className="mt-3 text-sm text-muted">
          {tutorial.duration} · {tutorial.price}
        </p>
      </div>
      <ol className="space-y-4">
        {tutorial.sections.map((section, index) => (
          <li key={section.title} className="rounded-2xl border border-line bg-surface p-5">
            <p className="text-xs text-muted">Section {index + 1}</p>
            <h2 className="mt-1 font-display text-2xl text-ink">{section.title}</h2>
            <p className="mt-2 text-sm text-ink-soft">{section.summary}</p>
          </li>
        ))}
      </ol>
    </Container>
  );
}
