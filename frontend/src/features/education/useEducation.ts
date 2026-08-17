import { useCallback, useEffect, useState } from "react";
import { education as fallbackEducation } from "@/content/experience";
import { apiGet } from "@/lib/api";
import { normalizeEducationList, type Education } from "@/types/education";

export function useEducation() {
  const [education, setEducation] = useState<Education[]>(fallbackEducation);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      const payload = await apiGet<{ education: Education[] }>("/education", {
        cache: "no-store",
      });
      setEducation(normalizeEducationList(payload.education));
      setError("");
    } catch {
      setEducation(fallbackEducation);
      setError("Could not load education");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { education, loading, error, reload };
}
