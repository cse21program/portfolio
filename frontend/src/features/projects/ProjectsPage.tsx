import { PageHeader } from "@/components/ui/PageHeader";
import { Container } from "@/components/ui/Container";
import { ContentCard } from "@/components/ui/ContentCard";
import { projects } from "@/content/projects";

export function ProjectsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Projects"
        title="Case studies"
        description="Selected work with problem, solution, architecture, and lessons."
      />
      <Container className="grid gap-4 py-16 md:grid-cols-2">
        {projects.map((project) => (
          <ContentCard
            key={project.slug}
            to={`/projects/${project.slug}`}
            eyebrow={project.status}
            title={project.title}
            description={project.shortDescription}
            tags={project.technologies.slice(0, 5)}
            meta={project.category}
          />
        ))}
      </Container>
    </>
  );
}
