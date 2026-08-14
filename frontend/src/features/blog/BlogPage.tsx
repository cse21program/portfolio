import { PageHeader } from "@/components/ui/PageHeader";
import { Container } from "@/components/ui/Container";
import { ContentCard } from "@/components/ui/ContentCard";
import { articles } from "@/content/blog";

export function BlogPage() {
  return (
    <>
      <PageHeader
        eyebrow="Blog"
        title="Writing"
        description="Notes on backend, DevOps, and how this platform is being built."
      />
      <Container className="grid gap-4 py-16 md:grid-cols-2">
        {articles.map((article) => (
          <ContentCard
            key={article.slug}
            to={`/blog/${article.slug}`}
            eyebrow={article.category}
            title={article.title}
            description={article.excerpt}
            tags={article.tags}
            meta={`${article.publishedAt} · ${article.readingTime}`}
          />
        ))}
      </Container>
    </>
  );
}
