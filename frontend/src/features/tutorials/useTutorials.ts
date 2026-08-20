import { useCallback, useEffect, useState } from "react";
import { tutorials as fallbackTutorials } from "@/content/learning";
import { ApiRequestError, apiGet } from "@/lib/api";
import {
  defaultTutorialAccess,
  normalizeTutorialList,
  parseTutorialAccess,
  type Tutorial,
  type TutorialAccess,
} from "@/types/tutorial";

export function useTutorials() {
  const [tutorials, setTutorials] = useState<Tutorial[]>(fallbackTutorials);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      const payload = await apiGet<{ tutorials: Tutorial[] }>("/tutorials", { cache: "no-store" });
      setTutorials(normalizeTutorialList(payload.tutorials));
      setError("");
    } catch {
      setTutorials(fallbackTutorials);
      setError("Could not load tutorials");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { tutorials, loading, error, reload };
}

export function useTutorialDetail(slug: string) {
  const [tutorial, setTutorial] = useState<Tutorial | null>(null);
  const [related, setRelated] = useState<Tutorial[]>([]);
  const [access, setAccess] = useState<TutorialAccess>(defaultTutorialAccess);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    if (!slug) {
      setTutorial(null);
      setRelated([]);
      setAccess(defaultTutorialAccess);
      setNotFound(true);
      setLoading(false);
      return;
    }

    try {
      const payload = await apiGet<{
        tutorial: Tutorial;
        related?: Tutorial[];
        access?: TutorialAccess;
      }>(`/tutorials/${slug}`, { cache: "no-store" });
      const next = normalizeTutorialList([payload.tutorial])[0] ?? null;
      const canReadSections = Boolean(next?.free) || parseTutorialAccess(payload.access).canReadSections;
      setTutorial(next);
      setRelated(normalizeTutorialList(payload.related ?? []));
      setAccess({
        purchased: parseTutorialAccess(payload.access).purchased,
        canReadSections,
      });
      setNotFound(false);
      setError("");
    } catch (caught) {
      setTutorial(null);
      setRelated([]);
      setAccess(defaultTutorialAccess);
      if (caught instanceof ApiRequestError && caught.status === 404) {
        setNotFound(true);
        setError("");
      } else {
        setNotFound(false);
        setError("Could not load this tutorial");
      }
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    setLoading(true);
    void reload();
  }, [reload]);

  return { tutorial, related, access, loading, notFound, error, reload };
}
