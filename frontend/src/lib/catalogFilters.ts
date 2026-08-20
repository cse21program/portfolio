import { parsePriceCents } from "@/lib/money";

export const catalogSorts = ["", "newest", "popular"] as const;
export type CatalogSort = (typeof catalogSorts)[number];

export const catalogPriceBands = ["under-50", "50-199", "200-plus"] as const;
export type CatalogPriceBand = (typeof catalogPriceBands)[number];

export const catalogPriceBandLabels: Record<CatalogPriceBand, string> = {
  "under-50": "Under $50",
  "50-199": "$50–$199",
  "200-plus": "$200+",
};

export const catalogSortLabels: Record<Exclude<CatalogSort, "">, string> = {
  newest: "Newest",
  popular: "Popular",
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

export function catalogYears(values: string[]) {
  return [...new Set(values.map(yearFromDate).filter(Boolean))].sort((left, right) => right.localeCompare(left));
}

export function catalogPriceBandsOf(items: Array<{ free: boolean; cents: number | null }>) {
  return catalogPriceBands.filter((band) => items.some((item) => priceBandOf(item.free, item.cents) === band));
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

export function priceBandOf(free: boolean, cents: number | null): CatalogPriceBand | "free" | "" {
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

export function matchesYear(value: string, year: string) {
  return !year || yearFromDate(value) === year;
}

export function matchesPriceBand(free: boolean, cents: number | null, band: string) {
  if (!band) {
    return true;
  }
  return priceBandOf(free, cents) === band;
}

export function compareNewest(left: string, right: string) {
  return dateValue(right) - dateValue(left);
}

export function comparePopular(left: number, right: number) {
  return right - left;
}

export function sortCatalogItems<T>(
  items: T[],
  sort: CatalogSort,
  dateOf: (item: T) => string,
  popularityOf: (item: T) => number,
) {
  if (!sort) {
    return items;
  }
  return [...items].sort((left, right) => {
    if (sort === "newest") {
      const delta = compareNewest(dateOf(left), dateOf(right));
      if (delta !== 0) {
        return delta;
      }
    }
    if (sort === "popular") {
      const delta = comparePopular(popularityOf(left), popularityOf(right));
      if (delta !== 0) {
        return delta;
      }
      return compareNewest(dateOf(left), dateOf(right));
    }
    return 0;
  });
}
