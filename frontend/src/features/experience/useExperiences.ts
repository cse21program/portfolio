import { useCallback, useEffect, useState } from "react";
import { experiences as fallbackExperiences } from "@/content/experience";
import { apiGet } from "@/lib/api";
import { normalizeExperienceList, type Experience } from "@/types/experience";

export function useExperiences() {
  const [experiences, setExperiences] = useState<Experience[]>(fallbackExperiences);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      const payload = await apiGet<{ experiences: Experience[] }>("/experience", {
        cache: "no-store",
      });
      setExperiences(normalizeExperienceList(payload.experiences));
      setError("");
    } catch {
      setExperiences(fallbackExperiences);
      setError("Could not load experience");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { experiences, loading, error, reload };
}
