import { useCallback, useEffect, useState } from "react";
import { testimonials as fallbackTestimonials } from "@/content/testimonials";
import { apiGet } from "@/lib/api";
import { normalizeTestimonialList, type Testimonial } from "@/types/testimonials";

export function useTestimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(fallbackTestimonials);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      const payload = await apiGet<{ testimonials: Testimonial[] }>("/testimonials", {
        cache: "no-store",
      });
      setTestimonials(normalizeTestimonialList(payload.testimonials));
      setError("");
    } catch {
      setTestimonials(fallbackTestimonials);
      setError("Could not load testimonials");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { testimonials, loading, error, reload };
}
