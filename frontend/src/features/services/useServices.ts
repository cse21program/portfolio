import { useCallback, useEffect, useState } from "react";
import { services as fallbackServices } from "@/content/services";
import { ApiRequestError, apiGet } from "@/lib/api";
import { featuredServices, normalizeServiceList, publishedServices, type Service } from "@/types/services";

export function useServices() {
  const [services, setServices] = useState<Service[]>(fallbackServices);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      const payload = await apiGet<{ services: Service[] }>("/services", { cache: "no-store" });
      setServices(normalizeServiceList(payload.services));
      setError("");
    } catch {
      setServices(fallbackServices);
      setError("Could not load services");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { services, loading, error, reload };
}

export function useServiceDetail(slug: string) {
  const [service, setService] = useState<Service | null>(null);
  const [related, setRelated] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    if (!slug) {
      setService(null);
      setRelated([]);
      setNotFound(true);
      setLoading(false);
      return;
    }

    try {
      const payload = await apiGet<{ service: Service; related?: Service[] }>(`/services/${slug}`, {
        cache: "no-store",
      });
      setService(normalizeServiceList([payload.service])[0] ?? null);
      setRelated(normalizeServiceList(payload.related ?? []));
      setNotFound(false);
      setError("");
    } catch (caught) {
      setService(null);
      setRelated([]);
      setNotFound(caught instanceof ApiRequestError && caught.status === 404);
      setError(caught instanceof ApiRequestError ? caught.message : "Could not load this service");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { service, related, loading, notFound, error, reload };
}

export { featuredServices, publishedServices };
