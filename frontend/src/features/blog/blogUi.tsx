import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { authorInitials, formatBlogDate, readingLabel, type Article } from "@/types/blog";

export function Chip({
  children,
  accent = false,
}: {
  children: ReactNode;
  accent?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs ${
        accent
          ? "border-accent/25 bg-accent/10 text-accent-dark"
          : "border-line bg-paper text-ink-soft"
      }`}
    >
      {children}
    </span>
  );
}

export function TagPills({ items, limit }: { items: string[]; limit?: number }) {
  const visible = limit ? items.slice(0, limit) : items;
  if (visible.length === 0) {
    return null;
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {visible.map((tag) => (
        <li key={tag}>
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-1.5 text-xs text-ink">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
            {tag}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function ArticleByline({ article }: { article: Article }) {
  const author = article.author?.trim() || "Rezaul Karim";
  const date = formatBlogDate(article.publishedAt);
  const time = readingLabel(article.readingTime);

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line bg-paper font-display text-sm text-ink">
        {authorInitials(author)}
      </span>
      <div>
        <p className="font-medium text-ink">{author}</p>
        <p>{[date, time].filter(Boolean).join(" · ")}</p>
      </div>
    </div>
  );
}

export function ArticleCard({
  article,
  featured = false,
}: {
  article: Article;
  featured?: boolean;
}) {
  const image = article.featuredImageUrl?.trim() || null;
  const wide = featured && Boolean(image);

  return (
    <Link
      to={`/blog/${article.slug}`}
      className={`group relative flex h-full overflow-hidden rounded-[1.75rem] border border-line bg-surface shadow-[0_1px_0_rgb(26_22_18/0.04)] transition duration-200 hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-[0_18px_40px_rgb(26_22_18/0.08)] ${
        wide ? "flex-col md:flex-row" : "flex-col"
      }`}
    >
      {featured ? (
        <span className="absolute inset-y-0 left-0 w-1 bg-accent" aria-hidden="true" />
      ) : null}
      {image ? (
        <img
          src={image}
          alt=""
          className={`object-cover ${wide ? "aspect-[16/10] md:aspect-auto md:w-[46%]" : "aspect-[16/9] w-full"}`}
        />
      ) : null}
      <div className={`flex flex-1 flex-col p-5 sm:p-7 ${featured ? "md:p-8" : ""}`}>
        <div className="flex flex-wrap gap-2">
          {featured ? <Chip accent>Latest</Chip> : null}
          {article.category ? <Chip accent={!featured}>{article.category}</Chip> : null}
          {article.skill ? <Chip>{article.skill}</Chip> : null}
        </div>
        <h2
          className={`mt-5 font-display tracking-tight text-ink transition group-hover:text-accent-dark ${
            featured ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl"
          }`}
        >
          {article.title}
        </h2>
        <p className="mt-3 flex-1 text-base leading-8 text-ink-soft">{article.excerpt}</p>
        <div className="mt-6">
          <TagPills items={article.tags} limit={featured ? 6 : 4} />
        </div>
        <div className="mt-6 flex items-center justify-between gap-3">
          <p className="text-xs text-muted">
            {[formatBlogDate(article.publishedAt), readingLabel(article.readingTime)]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <p className="text-sm font-medium text-accent group-hover:text-accent-dark">Read article →</p>
        </div>
      </div>
    </Link>
  );
}
