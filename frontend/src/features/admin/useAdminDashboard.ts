import { useCallback, useEffect, useState } from "react";
import { ApiRequestError, apiGet } from "@/lib/api";
import { emptyDashboard, type AdminDashboard } from "@/types/dashboard";

function errorMessage(caught: unknown) {
  if (caught instanceof ApiRequestError) {
    return caught.message;
  }
  return "Could not load the dashboard";
}

export function useAdminDashboard() {
  const [dashboard, setDashboard] = useState<AdminDashboard>(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setError("");
    const payload = await apiGet<{ dashboard: AdminDashboard }>("/admin/dashboard", { cache: "no-store" });
    setDashboard(payload.dashboard ?? emptyDashboard);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void reload()
      .catch((caught) => {
        if (!cancelled) {
          setError(errorMessage(caught));
          setDashboard(emptyDashboard);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [reload]);

  return { dashboard, loading, error, reload };
}
