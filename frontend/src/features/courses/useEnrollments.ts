import { useCallback, useEffect, useState } from "react";
import { apiDelete, apiGet, apiPost } from "@/lib/api";
import type { Enrollment } from "@/types/enrollment";

export function useEnrollments() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      const payload = await apiGet<{ enrollments: Enrollment[] }>("/enrollments", { cache: "no-store" });
      setEnrollments(payload.enrollments ?? []);
      setError("");
    } catch {
      setEnrollments([]);
      setError("Could not load enrollments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const enroll = useCallback(async (courseSlug: string) => {
    const payload = await apiPost<{ enrollment: Enrollment }>("/enrollments", { courseSlug });
    await reload();
    return payload.enrollment;
  }, [reload]);

  const leave = useCallback(async (courseSlug: string) => {
    await apiDelete(`/enrollments/${courseSlug}`);
    await reload();
  }, [reload]);

  return { enrollments, loading, error, reload, enroll, leave };
}

export function activeEnrollments(items: Enrollment[]) {
  return items.filter((item) => item.status === "active");
}
