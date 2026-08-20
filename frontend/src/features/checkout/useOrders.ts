import { useCallback, useEffect, useState } from "react";
import { apiDelete, apiGet } from "@/lib/api";
import type { CommerceOrder } from "@/types/order";

export function useOrders(enabled = true) {
  const [orders, setOrders] = useState<CommerceOrder[]>([]);
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
      const payload = await apiGet<{ orders: CommerceOrder[] }>("/orders", { cache: "no-store" });
      setOrders(payload.orders ?? []);
      setError("");
    } catch {
      setOrders([]);
      setError("Could not load purchases");
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const cancelOrder = useCallback(
    async (orderNumber: string) => {
      await apiDelete(`/orders/${orderNumber}`);
      await reload();
    },
    [reload],
  );

  return { orders, loading, error, reload, cancelOrder };
}
