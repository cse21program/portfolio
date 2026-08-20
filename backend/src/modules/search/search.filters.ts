import { parsePriceCents } from "@modules/cart/cart.money";

export const searchSorts = ["relevance", "newest", "popular"] as const;
export type SearchSort = (typeof searchSorts)[number];

export const searchAccess = ["free", "paid"] as const;
export type SearchAccess = (typeof searchAccess)[number];

export const searchPriceBands = ["under-50", "50-199", "200-plus"] as const;
export type SearchPriceBand = (typeof searchPriceBands)[number];

export const searchPriceBandLabels: Record<SearchPriceBand, string> = {
  "under-50": "Under $50",
  "50-199": "$50–$199",
  "200-plus": "$200+",
};

export function yearFromDate(value: string) {
  const trimmed = value.trim();
  const year = /^\d{4}/.test(trimmed) ? trimmed.slice(0, 4) : "";
  return /^\d{4}$/.test(year) ? year : "";
}

export function dateValue(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return 0;
  }
  const iso = /^\d{4}-\d{2}-\d{2}/.test(trimmed) ? `${trimmed.slice(0, 10)}T00:00:00` : trimmed;
  const parsed = Date.parse(iso);
  if (!Number.isNaN(parsed)) {
    return parsed;
  }
  const year = yearFromDate(trimmed);
  return year ? Date.parse(`${year}-01-01T00:00:00`) : 0;
}

export function paidCents(free: boolean, ...labels: Array<string | null | undefined>) {
  if (free) {
    return 0;
  }
  for (const label of labels) {
    const cents = parsePriceCents(label ?? "");
    if (cents && cents > 0) {
      return cents;
    }
  }
  return null;
}

export function priceBandOf(free: boolean, cents: number | null): SearchPriceBand | "free" | "" {
  if (free) {
    return "free";
  }
  if (cents === null) {
    return "";
  }
  if (cents < 5000) {
    return "under-50";
  }
  if (cents < 20000) {
    return "50-199";
  }
  return "200-plus";
}

export function uniqueSorted(values: string[]) {
  return [...new Set(values.map((item) => item.trim()).filter(Boolean))].sort((left, right) =>
    left.localeCompare(right),
  );
}

export function uniqueYears(values: string[]) {
  return uniqueSorted(values.map(yearFromDate).filter(Boolean)).reverse();
}

export function popularityScore(featured: boolean, extra = 0) {
  return (featured ? 100 : 0) + extra;
}

export function itemPriceBand(free: boolean | null, cents: number | null) {
  if (free === true) {
    return "free" as const;
  }
  if (free !== false) {
    return "" as const;
  }
  return priceBandOf(false, cents);
}

export function matchesYearFilter(value: string, year?: string) {
  return !year || yearFromDate(value) === year;
}

export function matchesSkillFilter(value: string, skill?: string) {
  return !skill || value === skill;
}

export function matchesTopicFilter(value: string, topic?: string) {
  return !topic || value === topic;
}

export function matchesAccessFilter(free: boolean | null, access?: SearchAccess) {
  if (!access) {
    return true;
  }
  if (access === "free") {
    return free === true;
  }
  return free === false;
}

export function matchesPriceFilter(free: boolean | null, cents: number | null, price?: SearchPriceBand) {
  return !price || itemPriceBand(free, cents) === price;
}
