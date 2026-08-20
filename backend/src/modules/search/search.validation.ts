import { z } from "zod";
import { searchSorts } from "./search.filters";
import { searchKinds } from "./search.types";

function firstString(value: unknown) {
  if (Array.isArray(value)) {
    return String(value[0] ?? "");
  }
  return typeof value === "string" ? value : "";
}

function optionalString() {
  return z.preprocess((value) => {
    const raw = firstString(value).trim();
    return raw.length === 0 ? undefined : raw;
  }, z.string().max(80, "Filter must be 80 characters or fewer").optional());
}

function optionalEnum<T extends string>(values: [T, ...T[]]) {
  return z.preprocess((value) => {
    const raw = firstString(value).trim();
    return raw.length === 0 ? undefined : raw;
  }, z.enum(values).optional());
}

export const searchQuerySchema = z.object({
  q: z.preprocess(firstString, z.string().trim().max(80, "Search must be 80 characters or fewer")),
  kind: z.preprocess((value) => {
    const raw = firstString(value).trim();
    return raw.length === 0 ? undefined : raw;
  }, z.enum(searchKinds).optional()),
  sort: z.preprocess((value) => {
    const raw = firstString(value).trim();
    return raw.length === 0 ? "relevance" : raw;
  }, z.enum(searchSorts)),
  year: z.preprocess((value) => {
    const raw = firstString(value).trim();
    return raw.length === 0 ? undefined : raw;
  }, z.string().regex(/^\d{4}$/, "Year must be four digits").optional()),
  skill: optionalString(),
  topic: optionalString(),
  access: optionalEnum(["free", "paid"]),
  price: optionalEnum(["under-50", "50-199", "200-plus"]),
});

export type SearchQueryInput = z.infer<typeof searchQuerySchema>;
