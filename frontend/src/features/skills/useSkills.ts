import { useCallback, useEffect, useState } from "react";
import { skills as fallbackSkills } from "@/content/skills";
import { apiGet } from "@/lib/api";
import { normalizeSkillList, type Skill } from "@/types/skills";

export function useSkills() {
  const [skills, setSkills] = useState<Skill[]>(fallbackSkills);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      const payload = await apiGet<{ skills: Skill[] }>("/skills", {
        cache: "no-store",
      });
      setSkills(normalizeSkillList(payload.skills));
      setError("");
    } catch {
      setSkills(fallbackSkills);
      setError("Could not load skills");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { skills, loading, error, reload };
}
