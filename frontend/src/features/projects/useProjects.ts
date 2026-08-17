import { useCallback, useEffect, useState } from "react";
import { projects as fallbackProjects } from "@/content/projects";
import { apiGet } from "@/lib/api";
import { normalizeProjectList, type Project } from "@/types/projects";

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>(fallbackProjects);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      const payload = await apiGet<{ projects: Project[] }>("/projects", {
        cache: "no-store",
      });
      setProjects(normalizeProjectList(payload.projects));
      setError("");
    } catch {
      setProjects(fallbackProjects);
      setError("Could not load projects");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { projects, loading, error, reload };
}
