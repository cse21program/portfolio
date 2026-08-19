import { useCallback, useEffect, useState } from "react";
import { tutorials as fallbackTutorials } from "@/content/learning";
import { apiGet } from "@/lib/api";
import { normalizeTutorialList, type Tutorial } from "@/types/tutorial";

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
