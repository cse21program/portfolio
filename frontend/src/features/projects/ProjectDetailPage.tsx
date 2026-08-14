import { Link, useParams } from "react-router-dom";
import { Container } from "@/components/ui/Container";
import { NotFoundState } from "@/components/ui/NotFoundState";
import { Tag } from "@/components/ui/Tag";
import { getProject, projects } from "@/content/projects";

export function ProjectDetailPage() {
  const { slug = "" } = useParams();
  const project = getProject(slug);

  if (!project) {
    return <NotFoundState title="Project not found" />;
  }

  const related = projects.filter((item) => item.slug !== project.slug).slice(0, 2);

  return (
    <Container className="space-y-12 py-16">
      <div>
        <p className="text-sm tracking-wide text-accent uppercase">{project.category}</p>
        <h1 className="mt-3 font-display text-5xl text-ink">{project.title}</h1>
        <p className="mt-4 max-w-3xl text-lg text-ink-soft">{project.shortDescription}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {project.technologies.map((tech) => (
            <Tag key={tech}>{tech}</Tag>
          ))}
        </div>
      </div>

      <section>
        <h2 className="font-display text-3xl text-ink">Overview</h2>
        <p className="mt-3 max-w-3xl leading-7 text-ink-soft">{project.problem}</p>
      </section>
      <section>
        <h2 className="font-display text-3xl text-ink">Problem</h2>
        <p className="mt-3 max-w-3xl leading-7 text-ink-soft">{project.problem}</p>
      </section>
      <section>
        <h2 className="font-display text-3xl text-ink">Solution</h2>
        <p className="mt-3 max-w-3xl leading-7 text-ink-soft">{project.solution}</p>
      </section>
      <section>
        <h2 className="font-display text-3xl text-ink">Architecture</h2>
        <p className="mt-3 max-w-3xl leading-7 text-ink-soft">{project.architecture}</p>
      </section>
      <section>
        <h2 className="font-display text-3xl text-ink">Features</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-ink-soft">
          {project.features.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="font-display text-3xl text-ink">Challenges</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-ink-soft">
          {project.challenges.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="font-display text-3xl text-ink">Lessons learned</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-ink-soft">
          {project.lessons.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
      <div className="flex flex-wrap gap-4 text-sm">
        {project.githubUrl ? (
          <a href={project.githubUrl} className="text-accent" target="_blank" rel="noreferrer">
            GitHub
          </a>
        ) : null}
        {project.liveUrl ? (
          <a href={project.liveUrl} className="text-accent" target="_blank" rel="noreferrer">
            Live demo
          </a>
        ) : null}
      </div>
      {related.length > 0 ? (
        <section>
          <h2 className="font-display text-3xl text-ink">Related projects</h2>
          <div className="mt-4 flex flex-col gap-2">
            {related.map((item) => (
              <Link key={item.slug} to={`/projects/${item.slug}`} className="text-accent">
                {item.title}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </Container>
  );
}
