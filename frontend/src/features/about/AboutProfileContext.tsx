import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiGet } from "@/lib/api";
import type { AboutProfile } from "@/types/about";
import { normalizeAboutProfile } from "@/types/about";
import { fallbackAboutProfile } from "@/features/about/fallback";

type AboutProfileContextValue = {
  profile: AboutProfile;
  loading: boolean;
  reload: () => Promise<void>;
};

const AboutProfileContext = createContext<AboutProfileContextValue | undefined>(undefined);

export function AboutProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<AboutProfile>(fallbackAboutProfile);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const payload = await apiGet<{ profile: AboutProfile }>("/portfolio/about", {
        cache: "no-store",
      });
      setProfile(normalizeAboutProfile(payload.profile));
    } catch {
      setProfile(fallbackAboutProfile);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const value = useMemo(() => ({ profile, loading, reload: load }), [profile, loading, load]);

  return <AboutProfileContext.Provider value={value}>{children}</AboutProfileContext.Provider>;
}

export function useAboutProfile() {
  const context = useContext(AboutProfileContext);
  if (!context) {
    return { profile: fallbackAboutProfile, loading: false, reload: async () => undefined };
  }
  return context;
}
