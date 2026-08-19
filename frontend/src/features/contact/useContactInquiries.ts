import { useCallback, useEffect, useState } from "react";
import { apiGet, apiPatch } from "@/lib/api";
import type { ContactMessage, ContactStatus } from "@/types/contact";

export function useContactInquiries() {
  const [inquiries, setInquiries] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      const payload = await apiGet<{ inquiries: ContactMessage[] }>("/contact", { cache: "no-store" });
      setInquiries(payload.inquiries ?? []);
      setError("");
    } catch {
      setError("Could not load inquiries");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const updateInquiry = useCallback(
    async (id: string, input: { status?: ContactStatus; adminNote?: string }) => {
      const payload = await apiPatch<{ inquiry: ContactMessage }>(`/contact/${id}`, input);
      const next = payload.inquiry;
      setInquiries((current) => current.map((item) => (item.id === next.id ? { ...item, ...next } : item)));
      return next;
    },
    [],
  );

  return { inquiries, loading, error, reload, updateInquiry };
}
