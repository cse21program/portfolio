import { useCallback, useEffect, useState } from "react";
import { fields as fallbackFields } from "@/content/fields";
import { apiGet } from "@/lib/api";
import { normalizeFieldList, type SkillField } from "@/types/fields";

export function useFields() {
  const [fields, setFields] = useState<SkillField[]>(fallbackFields);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      const payload = await apiGet<{ fields: SkillField[] }>("/fields", {
        cache: "no-store",
      });
      setFields(normalizeFieldList(payload.fields));
      setError("");
    } catch {
      setFields(fallbackFields);
      setError("Could not load fields");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { fields, loading, error, reload };
}
