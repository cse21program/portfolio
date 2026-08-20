import type { Article } from "@/types/public";
import { yearFromDate } from "@/lib/catalogFilters";

export type { Article };

export const blogStatuses = ["draft", "scheduled", "published", "archived"] as const;
export type BlogStatus = (typeof blogStatuses)[number];

export function listFromLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function paragraphsFromBody(value: string) {
  return value
    .split(/\n{2,}/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function slugFromTitle(title: string) {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function isSlug(value: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length >= 2 && value.length <= 80;
}

export function estimateReadingTime(paragraphs: string[]) {
  const words = paragraphs.join(" ").split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200) || 1);
  return `${minutes} min`;
}

export function formatBlogDate(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  const iso = /^\d{4}-\d{2}-\d{2}/.test(trimmed) ? `${trimmed.slice(0, 10)}T00:00:00` : trimmed;
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) {
    return trimmed;
  }
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(parsed));
}

export function readingLabel(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  return /read$/i.test(trimmed) ? trimmed : `${trimmed} read`;
}

export function authorInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function normalizeArticle(item: Partial<Article> & Pick<Article, "title" | "slug">, index = 0): Article {
  return {
    id: typeof item.id === "string" && item.id.length > 0 ? item.id : undefined,
    title: item.title.trim(),
    slug: item.slug.trim().toLowerCase(),
    excerpt: item.excerpt?.trim() ?? "",
    content: (item.content ?? []).map((entry) => entry.trim()).filter(Boolean),
    featuredImageUrl: item.featuredImageUrl?.trim() || null,
    author: item.author?.trim() || "Rezaul Karim",
    category: item.category?.trim() ?? "",
    tags: (item.tags ?? []).map((entry) => entry.trim()).filter(Boolean),
    skill: item.skill?.trim() ?? "",
    topic: item.topic?.trim() ?? "",
    readingTime: item.readingTime?.trim() || estimateReadingTime(item.content ?? []),
    publishedAt: item.publishedAt?.trim() ?? "",
    status: item.status?.trim() || "published",
    seoTitle: item.seoTitle?.trim() ?? "",
    seoDescription: item.seoDescription?.trim() ?? "",
    canonicalUrl: item.canonicalUrl?.trim() ?? "",
    sortOrder: item.sortOrder ?? index,
    updatedAt: item.updatedAt,
    likeCount: typeof item.likeCount === "number" ? item.likeCount : 0,
  };
}

export function normalizeArticleList(items: Article[] | undefined) {
  return (items ?? []).map((item, index) => normalizeArticle(item, index));
}

export function publishedArticles(items: Article[]) {
  return items.filter((item) => (item.status ?? "published") === "published");
}

export function findArticle(items: Article[], slug: string) {
  return publishedArticles(items).find((item) => item.slug === slug);
}

export function relatedArticles(article: Article, items: Article[]) {
  const others = publishedArticles(items).filter((item) => item.slug !== article.slug);
  const close = others.filter(
    (item) =>
      (article.category && item.category === article.category) ||
      (article.skill && item.skill === article.skill) ||
      (article.topic && item.topic === article.topic),
  );
  const rest = others.filter((item) => !close.includes(item));
  return [...close, ...rest].slice(0, 3);
}

export function matchesArticleQuery(item: Article, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return true;
  }
  return [item.title, item.excerpt, item.category, item.skill, item.topic, item.tags.join(" "), item.author]
    .join(" ")
    .toLowerCase()
    .includes(needle);
}

export type ArticleFilters = {
  query: string;
  category: string;
  skill: string;
  tag: string;
  status: string;
  topic?: string;
  year?: string;
};

export function matchesArticleFilters(item: Article, filters: ArticleFilters) {
  if (!matchesArticleQuery(item, filters.query)) {
    return false;
  }
  if (filters.category && item.category !== filters.category) {
    return false;
  }
  if (filters.skill && item.skill !== filters.skill) {
    return false;
  }
  if (filters.topic && item.topic !== filters.topic) {
    return false;
  }
  if (filters.tag && !(item.tags ?? []).includes(filters.tag)) {
    return false;
  }
  if (filters.year && yearFromDate(item.publishedAt) !== filters.year) {
    return false;
  }
  if (filters.status && (item.status ?? "published") !== filters.status) {
    return false;
  }
  return true;
}

export function emptyArticle(sortOrder = 0): Article {
  return {
    id: crypto.randomUUID(),
    title: "",
    slug: "",
    excerpt: "",
    content: [],
    featuredImageUrl: null,
    author: "Rezaul Karim",
    category: "",
    tags: [],
    skill: "",
    topic: "",
    readingTime: "",
    publishedAt: new Date().toISOString().slice(0, 10),
    status: "draft",
    seoTitle: "",
    seoDescription: "",
    canonicalUrl: "",
    sortOrder,
  };
}
