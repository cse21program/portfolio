import { useParams } from "react-router-dom";
import { Container } from "@/components/ui/Container";
import { NotFoundState } from "@/components/ui/NotFoundState";
import { Tag } from "@/components/ui/Tag";
import { getArticle } from "@/content/blog";

export function BlogDetailPage() {
  const { slug = "" } = useParams();
  const article = getArticle(slug);

  if (!article) {
    return <NotFoundState title="Article not found" />;
  }

  return (
    <Container className="max-w-3xl py-16">
      <p className="text-sm tracking-wide text-accent uppercase">{article.category}</p>
      <h1 className="mt-3 font-display text-5xl text-ink">{article.title}</h1>
      <p className="mt-4 text-sm text-muted">
        {article.publishedAt} · {article.readingTime} · {article.skill}
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        {article.tags.map((tag) => (
          <Tag key={tag}>{tag}</Tag>
        ))}
      </div>
      <div className="mt-10 space-y-6 text-lg leading-8 text-ink-soft">
        {article.content.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </Container>
  );
}
