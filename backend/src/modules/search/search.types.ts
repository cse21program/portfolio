import { dateValue } from "./search.filters";

export const searchKinds = [
  "project",
  "skill",
  "topic",
  "blog",
  "tutorial",
  "course",
  "service",
] as const;

export type SearchKind = (typeof searchKinds)[number];

export const searchKindLabels: Record<SearchKind, string> = {
  project: "Projects",
  skill: "Skills",
  topic: "Topics",
  blog: "Blogs",
  tutorial: "Tutorials",
  course: "Courses",
  service: "Services",
};

export type SearchHit = {
  kind: SearchKind;
  title: string;
  href: string;
  summary: string;
  meta: string;
};

export type SearchGroup = {
  kind: SearchKind;
  label: string;
  items: SearchHit[];
};

export type SearchFacets = {
  years: string[];
  skills: string[];
  topics: string[];
  access: Array<"free" | "paid">;
  prices: Array<"under-50" | "50-199" | "200-plus">;
};

export type SearchResults = {
  query: string;
  kind: SearchKind | null;
  sort: "relevance" | "newest" | "popular";
  total: number;
  groups: SearchGroup[];
  facets: SearchFacets;
};

export type SearchCandidate = SearchHit & {
  publishedAt: string;
  skill: string;
  topic: string;
  free: boolean | null;
  priceCents: number | null;
  featured: boolean;
  popularity: number;
};

export const emptySearchFacets: SearchFacets = {
  years: [],
  skills: [],
  topics: [],
  access: [],
  prices: [],
};

const PER_GROUP = 10;

export function normalizeNeedle(value: string) {
  return value.trim().toLowerCase();
}

export function haystackOf(parts: Array<string | string[] | null | undefined>) {
  return parts
    .flatMap((part) => (Array.isArray(part) ? part : [part ?? ""]))
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function matchesNeedle(haystack: string, needle: string) {
  if (!needle) {
    return false;
  }
  return haystack.includes(needle);
}

export function rankMatch(title: string, needle: string) {
  const value = title.trim().toLowerCase();
  if (!needle || !value) {
    return 0;
  }
  if (value === needle) {
    return 4;
  }
  if (value.startsWith(needle)) {
    return 3;
  }
  if (value.includes(needle)) {
    return 2;
  }
  return 1;
}

export function toSearchHit(item: SearchHit): SearchHit {
  return {
    kind: item.kind,
    title: item.title,
    href: item.href,
    summary: item.summary,
    meta: item.meta,
  };
}

export function sortHits(items: SearchHit[], needle: string) {
  return [...items].sort((left, right) => {
    const rank = rankMatch(right.title, needle) - rankMatch(left.title, needle);
    if (rank !== 0) {
      return rank;
    }
    return left.title.localeCompare(right.title);
  });
}

export function sortCandidates(
  items: Array<SearchHit & Partial<Pick<SearchCandidate, "publishedAt" | "popularity">>>,
  needle: string,
  sort: SearchResults["sort"] = "relevance",
) {
  return [...items].sort((left, right) => {
    if (sort === "newest") {
      const delta = dateValue(right.publishedAt ?? "") - dateValue(left.publishedAt ?? "");
      if (delta !== 0) {
        return delta;
      }
    }
    if (sort === "popular") {
      const delta = (right.popularity ?? 0) - (left.popularity ?? 0);
      if (delta !== 0) {
        return delta;
      }
    }
    const rank = rankMatch(right.title, needle) - rankMatch(left.title, needle);
    if (rank !== 0) {
      return rank;
    }
    return left.title.localeCompare(right.title);
  });
}

export function takeGroup(
  kind: SearchKind,
  items: Array<SearchHit & Partial<Pick<SearchCandidate, "publishedAt" | "popularity">>>,
  needle: string,
  sort: SearchResults["sort"] = "relevance",
): SearchGroup | null {
  const ranked = sortCandidates(items, needle, sort).slice(0, PER_GROUP).map(toSearchHit);
  if (ranked.length === 0) {
    return null;
  }
  return {
    kind,
    label: searchKindLabels[kind],
    items: ranked,
  };
}
