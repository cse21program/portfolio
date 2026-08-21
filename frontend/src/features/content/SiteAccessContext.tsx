import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { apiGet } from "@/lib/api";
import { defaultPublicCatalogs, normalizePublicCatalogs, type PublicCatalogs } from "@/types/siteAccess";

type SiteAccessValue = {
  catalogs: PublicCatalogs;
  ready: boolean;
  reload: () => Promise<void>;
};

const SiteAccessContext = createContext<SiteAccessValue | undefined>(undefined);

export function SiteAccessProvider({ children }: { children: ReactNode }) {
  const [catalogs, setCatalogs] = useState<PublicCatalogs>(defaultPublicCatalogs);
  const [ready, setReady] = useState(false);

  const reload = useCallback(async () => {
    try {
      const payload = await apiGet<{ catalogs: PublicCatalogs }>("/site-access", { cache: "no-store" });
      setCatalogs(normalizePublicCatalogs(payload.catalogs));
    } catch {
      setCatalogs(defaultPublicCatalogs);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const value = useMemo(() => ({ catalogs, ready, reload }), [catalogs, ready, reload]);
  return <SiteAccessContext.Provider value={value}>{children}</SiteAccessContext.Provider>;
}

export function useSiteAccess() {
  return (
    useContext(SiteAccessContext) ?? {
      catalogs: defaultPublicCatalogs,
      ready: true,
      reload: async () => undefined,
    }
  );
}
