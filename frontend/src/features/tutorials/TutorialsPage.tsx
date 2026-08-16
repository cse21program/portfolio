import { PageHeader } from "@/components/ui/PageHeader";
import { Container } from "@/components/ui/Container";
import { ContentCard } from "@/components/ui/ContentCard";
import { tutorials } from "@/content/learning";

export function TutorialsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Tutorials"
        title="Structured walkthroughs"
        description="Longer than a blog post, more linear than a course. Some will be premium later."
      />
      <Container className="grid gap-4 py-16 md:grid-cols-2">
        {tutorials.map((tutorial) => (
          <ContentCard
            key={tutorial.slug}
            to={`/tutorials/${tutorial.slug}`}
            eyebrow={tutorial.free ? "Free" : tutorial.price}
            title={tutorial.title}
            description={tutorial.description}
            meta={`${tutorial.difficulty} · ${tutorial.duration}`}
          />
        ))}
      </Container>
    </>
  );
}
