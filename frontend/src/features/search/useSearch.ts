import { useCallback, useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import {
  emptySearchResults,
  type SearchAccess,
  type SearchKind,
  type SearchResults,
  type SearchSort,
} from "@/types/search";

export type SearchQuery = {
  query: string;
  kind: SearchKind | "";
  sort: SearchSort;
  year: string;
  skill: string;
  topic: string;
  access: SearchAccess | "";
  price: string;
};

export function useSearch({ query, kind, sort, year, skill, topic, access, price }: SearchQuery) {
  const [results, setResults] = useState<SearchResults>(emptySearchResults);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    const q = query.trim();
    if (!q) {
      setResults({ ...emptySearchResults, kind: kind || null, sort });
      setError("");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({ q, sort });
      if (kind) {
        params.set("kind", kind);
      }
      if (year) {
        params.set("year", year);
      }
      if (skill) {
        params.set("skill", skill);
      }
      if (topic) {
        params.set("topic", topic);
      }
      if (access) {
        params.set("access", access);
      }
      if (price) {
        params.set("price", price);
      }
      const payload = await apiGet<SearchResults>(`/search?${params.toString()}`, { cache: "no-store" });
      setResults(payload);
      setError("");
    } catch {
      setResults({ ...emptySearchResults, query: q, kind: kind || null, sort });
      setError("Could not search right now");
    } finally {
      setLoading(false);
    }
  }, [query, kind, sort, year, skill, topic, access, price]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { results, loading, error, reload };
}
