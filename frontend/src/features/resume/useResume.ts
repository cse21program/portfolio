import { useCallback, useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { fallbackResume, normalizeResume, type ResumeDocument } from "@/types/resume";

export function useResume() {
  const [resume, setResume] = useState<ResumeDocument>(fallbackResume);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      const payload = await apiGet<{ resume: ResumeDocument }>("/portfolio/resume", {
        cache: "no-store",
      });
      setResume(normalizeResume(payload.resume));
      setError("");
    } catch {
      setError("Could not load the resume");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { resume, loading, error, reload, setResume };
}
