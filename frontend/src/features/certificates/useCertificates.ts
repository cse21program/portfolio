import { useCallback, useEffect, useState } from "react";
import { certificates as fallbackCertificates } from "@/content/certificates";
import { apiGet } from "@/lib/api";
import { normalizeCertificateList, type Certificate } from "@/types/certificates";

export function useCertificates() {
  const [certificates, setCertificates] = useState<Certificate[]>(fallbackCertificates);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      const payload = await apiGet<{ certificates: Certificate[] }>("/certificates", {
        cache: "no-store",
      });
      setCertificates(normalizeCertificateList(payload.certificates));
      setError("");
    } catch {
      setCertificates(fallbackCertificates);
      setError("Could not load certificates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { certificates, loading, error, reload };
}
