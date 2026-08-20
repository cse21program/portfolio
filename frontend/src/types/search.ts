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

export const searchSorts = ["relevance", "newest", "popular"] as const;
export type SearchSort = (typeof searchSorts)[number];

export const searchSortLabels: Record<SearchSort, string> = {
  relevance: "Relevance",
  newest: "Newest",
  popular: "Popular",
};

export const searchAccess = ["free", "paid"] as const;
export type SearchAccess = (typeof searchAccess)[number];

export const searchAccessLabels: Record<SearchAccess, string> = {
  free: "Free",
  paid: "Paid",
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
  access: SearchAccess[];
  prices: Array<"under-50" | "50-199" | "200-plus">;
};

export type SearchResults = {
  query: string;
  kind: SearchKind | null;
  sort?: SearchSort;
  total: number;
  groups: SearchGroup[];
  facets?: SearchFacets;
};

export const emptySearchFacets: SearchFacets = {
  years: [],
  skills: [],
  topics: [],
  access: [],
  prices: [],
};

export const emptySearchResults: SearchResults = {
  query: "",
  kind: null,
  sort: "relevance",
  total: 0,
  groups: [],
  facets: emptySearchFacets,
};

export function isSearchKind(value: string): value is SearchKind {
  return (searchKinds as readonly string[]).includes(value);
}

export function parseSearchKind(value: string | null): SearchKind | "" {
  if (!value) {
    return "";
  }
  return isSearchKind(value) ? value : "";
}

export function parseSearchSort(value: string | null): SearchSort {
  return (searchSorts as readonly string[]).includes(value ?? "") ? (value as SearchSort) : "relevance";
}

export function parseSearchAccess(value: string | null): SearchAccess | "" {
  return (searchAccess as readonly string[]).includes(value ?? "") ? (value as SearchAccess) : "";
}

export function parseSearchYear(value: string | null) {
  return value && /^\d{4}$/.test(value) ? value : "";
}

export function parseSearchPrice(value: string | null) {
  return value === "under-50" || value === "50-199" || value === "200-plus" ? value : "";
}
