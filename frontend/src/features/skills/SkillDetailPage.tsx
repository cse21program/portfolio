import { Link, useParams } from "react-router-dom";
import { Container } from "@/components/ui/Container";
import { NotFoundState } from "@/components/ui/NotFoundState";
import { getSkill } from "@/content/skills";

export function SkillDetailPage() {
  const { skillSlug = "" } = useParams();
  const skill = getSkill(skillSlug);

  if (!skill) {
    return <NotFoundState title="Skill not found" />;
  }

  return (
    <Container className="space-y-10 py-16">
      <div>
        <p className="text-sm tracking-wide text-accent uppercase">{skill.field}</p>
        <h1 className="mt-3 font-display text-5xl text-ink">{skill.name}</h1>
        <p className="mt-4 max-w-3xl text-lg text-ink-soft">{skill.overview}</p>
        <p className="mt-3 text-sm text-muted">
          {skill.level} · {skill.years}
        </p>
      </div>
      <section>
        <h2 className="font-display text-3xl text-ink">Topics</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {skill.topics.map((topic) => (
            <Link
              key={topic.slug}
              to={`/skills/${skill.slug}/${topic.slug}`}
              className="rounded-2xl border border-line bg-surface p-6 hover:border-accent/40"
            >
              <h3 className="font-display text-2xl text-ink">{topic.title}</h3>
              <p className="mt-2 text-sm text-ink-soft">{topic.summary}</p>
            </Link>
          ))}
        </div>
      </section>
    </Container>
  );
}
