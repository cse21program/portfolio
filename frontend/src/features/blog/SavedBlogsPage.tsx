import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { ArticleCard } from "@/features/blog/blogUi";
import { apiGet } from "@/lib/api";
import { normalizeArticleList, type Article } from "@/types/blog";

export function SavedBlogsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const payload = await apiGet<{ blogs: Article[] }>("/blogs/bookmarks", { cache: "no-store" });
      setArticles(normalizeArticleList(payload.blogs ?? []));
    } catch {
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs tracking-[0.16em] text-muted uppercase">Reading list</p>
        <h1 className="mt-2 font-display text-3xl text-ink">Saved posts</h1>
        <p className="mt-2 text-sm text-ink-soft">Notes you bookmarked from the blog.</p>
      </div>

      {loading && articles.length === 0 ? (
        <div className="h-40 animate-pulse rounded-[1.75rem] bg-paper-muted" />
      ) : articles.length === 0 ? (
        <EmptyState
          title="Nothing saved yet"
          description="Open a published post and choose Save. Bookmarks stay with your account."
          action={{ label: "Browse the blog", to: "/blog" }}
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {articles.map((article) => (
            <ArticleCard key={article.id ?? article.slug} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
