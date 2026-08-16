import { Link, useParams } from "react-router-dom";
import { Container } from "@/components/ui/Container";
import { NotFoundState } from "@/components/ui/NotFoundState";
import { getArticle } from "@/content/blog";
import { getCourse, getTutorial } from "@/content/learning";
import { getSkill, getTopic } from "@/content/skills";

export function TopicDetailPage() {
  const { skillSlug = "", topicSlug = "" } = useParams();
  const skill = getSkill(skillSlug);
  const topic = getTopic(skillSlug, topicSlug);

  if (!skill || !topic) {
    return <NotFoundState title="Topic not found" />;
  }

  return (
    <Container className="space-y-10 py-16">
      <div>
        <p className="text-sm tracking-wide text-accent uppercase">
          {skill.field} / {skill.name}
        </p>
        <h1 className="mt-3 font-display text-5xl text-ink">{topic.title}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-ink-soft">{topic.overview}</p>
      </div>
      <RelatedList
        title="Related writing"
        items={topic.relatedBlogSlugs.map((slug) => {
          const article = getArticle(slug);
          return article ? { to: `/blog/${article.slug}`, label: article.title } : null;
        })}
      />
      <RelatedList
        title="Related tutorials"
        items={topic.relatedTutorialSlugs.map((slug) => {
          const tutorial = getTutorial(slug);
          return tutorial ? { to: `/tutorials/${tutorial.slug}`, label: tutorial.title } : null;
        })}
      />
      <RelatedList
        title="Related courses"
        items={topic.relatedCourseSlugs.map((slug) => {
          const course = getCourse(slug);
          return course ? { to: `/courses/${course.slug}`, label: course.title } : null;
        })}
      />
      <Link to={`/skills/${skill.slug}`} className="text-sm text-accent">
        Back to {skill.name}
      </Link>
    </Container>
  );
}

function RelatedList({
  title,
  items,
}: {
  title: string;
  items: Array<{ to: string; label: string } | null>;
}) {
  const links = items.filter((item): item is { to: string; label: string } => item !== null);
  if (links.length === 0) return null;

  return (
    <section>
      <h2 className="font-display text-2xl text-ink">{title}</h2>
      <ul className="mt-3 space-y-2">
        {links.map((item) => (
          <li key={item.to}>
            <Link to={item.to} className="text-accent">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
