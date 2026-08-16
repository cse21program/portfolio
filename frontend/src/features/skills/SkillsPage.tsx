import { PageHeader } from "@/components/ui/PageHeader";
import { Container } from "@/components/ui/Container";
import { ContentCard } from "@/components/ui/ContentCard";
import { skillFields, skills } from "@/content/skills";

export function SkillsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Skills"
        title="Fields, skills, and topics"
        description="A knowledge tree instead of progress bars. Each skill opens into topics with related writing and courses."
      />
      <Container className="space-y-14 py-16">
        {skillFields.map((field) => (
          <section key={field}>
            <h2 className="font-display text-3xl text-ink">{field}</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {skills
                .filter((skill) => skill.field === field)
                .map((skill) => (
                  <ContentCard
                    key={skill.slug}
                    to={`/skills/${skill.slug}`}
                    title={skill.name}
                    description={skill.summary}
                    meta={skill.level}
                    tags={skill.topics.map((topic) => topic.title)}
                  />
                ))}
            </div>
          </section>
        ))}
      </Container>
    </>
  );
}
