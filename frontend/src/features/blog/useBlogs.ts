import { useCallback, useEffect, useState } from "react";
import { articles as fallbackArticles } from "@/content/blog";
import { apiGet } from "@/lib/api";
import { normalizeArticleList, type Article } from "@/types/blog";

export function useBlogs() {
  const [articles, setArticles] = useState<Article[]>(fallbackArticles);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      const payload = await apiGet<{ blogs: Article[] }>("/blogs", { cache: "no-store" });
      setArticles(normalizeArticleList(payload.blogs));
      setError("");
    } catch {
      setArticles(fallbackArticles);
      setError("Could not load posts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { articles, loading, error, reload };
}
