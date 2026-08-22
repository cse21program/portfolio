import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PreviewBanner } from "@/components/content/PreviewBanner";
import { RichText } from "@/components/content/RichText";
import { Container } from "@/components/ui/Container";
import { NotFoundState } from "@/components/ui/NotFoundState";
import { ArticleByline, Chip, TagPills } from "@/features/blog/blogUi";
import { FollowButton } from "@/features/follow/FollowButton";
import { BlogEngagement } from "@/features/blog/BlogEngagement";
import { useBlogs } from "@/features/blog/useBlogs";
import { usePreview } from "@/features/content/usePreview";
import { isLiveContent } from "@/lib/publishing";
import {
  findArticle,
  formatBlogDate,
  readingLabel,
  relatedArticles,
  type Article,
} from "@/types/blog";

function BlogJsonLd({ article, url }: { article: Article; url: string }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.seoTitle?.trim() || article.title,
    description: article.seoDescription?.trim() || article.excerpt,
    author: { "@type": "Person", name: article.author || "Rezaul Karim" },
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    image: article.featuredImageUrl || undefined,
    url,
  };

  return <script type="application/ld+json">{JSON.stringify(data)}</script>;
}

function ActionButton({
  children,
  onClick,
  primary = false,
}: {
  children: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium transition ${
        primary
          ? "bg-ink text-paper hover:bg-accent"
          : "border border-line bg-surface text-ink hover:border-accent/40"
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function BlogDetailPage() {
  const { slug = "" } = useParams();
  const { articles, loading } = useBlogs();
  const preview = usePreview();
  const article = preview
    ? articles.find((item) => item.slug === slug)
    : findArticle(articles, slug);
  const related = article ? relatedArticles(article, articles) : [];
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!article) {
      return;
    }
    const previous = document.title;
    document.title = article.seoTitle?.trim() || `${article.title} — Blog`;
    const description = article.seoDescription?.trim() || article.excerpt;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", description);
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    const href =
      article.canonicalUrl?.trim() ||
      (typeof window === "undefined" ? `/blog/${article.slug}` : `${window.location.origin}/blog/${article.slug}`);
    canonical.setAttribute("href", href);
    return () => {
      document.title = previous;
    };
  }, [article]);

  if (loading && !article) {
    return (
      <Container className="space-y-6 py-16">
        <div className="h-10 w-64 animate-pulse rounded-full bg-paper-muted" />
        <div className="h-40 animate-pulse rounded-[1.75rem] bg-paper-muted" />
      </Container>
    );
  }

  if (!article) {
    return <NotFoundState title="Article not found" />;
  }

  const url =
    typeof window === "undefined" ? `/blog/${article.slug}` : `${window.location.origin}/blog/${article.slug}`;
  const cover = article.featuredImageUrl?.trim() || null;
  const author = article.author?.trim() || "Rezaul Karim";
  const title = article.title;
  const excerpt = article.excerpt;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  async function shareArticle() {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text: excerpt, url });
        return;
      } catch {
        // Fall through to copy if the visitor cancels or share is unavailable.
      }
    }
    await copyLink();
  }

  return (
    <>
      <BlogJsonLd article={article} url={url} />
      <section className="relative overflow-hidden border-b border-line bg-surface">
        <div className="pointer-events-none absolute -top-28 left-1/3 h-80 w-80 rounded-full bg-accent/15 blur-3xl" />
        <div className="pointer-events-none absolute right-0 bottom-0 h-56 w-56 rounded-full bg-paper-muted blur-3xl" />
        <Container className="relative grid items-start gap-8 py-12 lg:grid-cols-[1.08fr_0.92fr] lg:py-16">
          <div>
            <Link to="/blog" className="text-sm font-medium text-accent hover:text-accent-dark">
              ← All writing
            </Link>
            {article.category ? (
              <p className="mt-5 text-xs tracking-[0.16em] text-accent uppercase">{article.category}</p>
            ) : null}
            <h1 className="mt-3 font-display text-4xl tracking-tight text-ink sm:text-5xl lg:text-6xl">
              {article.title}
            </h1>
            {article.excerpt ? (
              <p className="mt-4 max-w-xl text-lg leading-8 text-ink-soft">{article.excerpt}</p>
            ) : null}
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <ArticleByline article={article} />
              <FollowButton compact />
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {article.skill ? <Chip accent>{article.skill}</Chip> : null}
              {article.topic ? <Chip>{article.topic}</Chip> : null}
            </div>
            {article.tags.length > 0 ? (
              <div className="mt-5">
                <TagPills items={article.tags} />
              </div>
            ) : null}
            <div className="mt-8 flex flex-wrap gap-3">
              <ActionButton primary onClick={() => void shareArticle()}>
                Share
              </ActionButton>
              <ActionButton onClick={() => void copyLink()}>
                {copied ? "Link copied" : "Copy link"}
              </ActionButton>
            </div>
          </div>

          {cover ? (
            <img
              src={cover}
              alt=""
              className="aspect-[16/10] w-full rounded-[1.75rem] border border-line object-cover"
            />
          ) : (
            <aside className="rounded-[1.75rem] border border-line bg-paper/80 p-6 sm:p-7">
              <p className="text-xs tracking-[0.16em] text-accent uppercase">In this note</p>
              <dl className="mt-5 space-y-4 text-sm">
                <div>
                  <dt className="text-muted">Reading time</dt>
                  <dd className="mt-1 font-medium text-ink">{readingLabel(article.readingTime) || "—"}</dd>
                </div>
                {article.publishedAt ? (
                  <div>
                    <dt className="text-muted">Published</dt>
                    <dd className="mt-1 font-medium text-ink">{formatBlogDate(article.publishedAt)}</dd>
                  </div>
                ) : null}
                {article.category ? (
                  <div>
                    <dt className="text-muted">Category</dt>
                    <dd className="mt-1 font-medium text-ink">{article.category}</dd>
                  </div>
                ) : null}
                {article.skill ? (
                  <div>
                    <dt className="text-muted">Skill</dt>
                    <dd className="mt-1 font-medium text-ink">{article.skill}</dd>
                  </div>
                ) : null}
              </dl>
            </aside>
          )}
        </Container>
      </section>

      <section className="border-b border-line py-14 sm:py-16">
        <Container className="max-w-3xl space-y-6">
          {!isLiveContent(article) ? <PreviewBanner status={article.status} /> : null}
          <article>
            <RichText paragraphs={article.content} lead />
          </article>
        </Container>
      </section>

      <BlogEngagement slug={article.slug} />

      <section className="border-b border-line bg-paper-muted/35 py-12 sm:py-16">
        <Container className="flex max-w-3xl flex-wrap items-center justify-between gap-6">
          <ArticleByline article={article} />
          <Link to="/about" className="text-sm font-medium text-accent hover:text-accent-dark">
            More about {author.split(" ")[0]} →
          </Link>
        </Container>
      </section>

      {related.length > 0 ? (
        <section className="border-b border-line py-14 sm:py-16">
          <Container>
            <h2 className="font-display text-3xl tracking-tight text-ink">Related</h2>
            <p className="mt-2 text-sm text-ink-soft">Keep reading if this note was useful.</p>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {related.map((item) => (
                <Link
                  key={item.slug}
                  to={`/blog/${item.slug}`}
                  aria-label={item.title}
                  className="flex flex-col rounded-[1.5rem] border border-line bg-surface p-5 transition hover:border-accent/40"
                >
                  {item.category ? <p className="text-xs text-accent">{item.category}</p> : null}
                  <h3 className="mt-2 font-display text-2xl text-ink">{item.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-6 text-ink-soft">{item.excerpt}</p>
                  <p className="mt-4 text-sm font-medium text-accent">
                    Read article
                    <span aria-hidden="true"> →</span>
                  </p>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      ) : null}
    </>
  );
}
