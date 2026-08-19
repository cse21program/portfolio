import { useCallback, useEffect, useState } from "react";
import { apiDelete, apiGet, apiPost } from "@/lib/api";
import type { ServiceOrder } from "@/types/serviceOrder";

export function useServiceOrders(enabled = true) {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    if (!enabled) {
      setOrders([]);
      setError("");
      setLoading(false);
      return;
    }
    try {
      const payload = await apiGet<{ orders: ServiceOrder[] }>("/service-orders", { cache: "no-store" });
      setOrders(payload.orders ?? []);
      setError("");
    } catch {
      setOrders([]);
      setError("Could not load orders");
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const requestService = useCallback(
    async (input: {
      serviceSlug: string;
      packageName?: string;
      requirements: string;
      budget?: string;
      timeline?: string;
    }) => {
      const payload = await apiPost<{ order: ServiceOrder }>("/service-orders", input);
      await reload();
      return payload.order;
    },
    [reload],
  );

  const cancelOrder = useCallback(
    async (id: string) => {
      await apiDelete(`/service-orders/${id}`);
      await reload();
    },
    [reload],
  );

  return { orders, loading, error, reload, requestService, cancelOrder };
}
