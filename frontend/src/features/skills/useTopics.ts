import { useCallback, useEffect, useState } from "react";
import { topics as fallbackTopics } from "@/content/topics";
import { apiGet } from "@/lib/api";
import { normalizeTopicList, type KnowledgeTopic } from "@/types/topics";

export function useTopics() {
  const [topics, setTopics] = useState<KnowledgeTopic[]>(fallbackTopics);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      const payload = await apiGet<{ topics: KnowledgeTopic[] }>("/topics", {
        cache: "no-store",
      });
      setTopics(normalizeTopicList(payload.topics));
      setError("");
    } catch {
      setTopics(fallbackTopics);
      setError("Could not load topics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { topics, loading, error, reload };
}
