import { useContext, type ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { NotFoundState } from "@/components/ui/NotFoundState";
import { AuthContext } from "@/features/auth/AuthContext";
import { useSiteAccess } from "@/features/content/SiteAccessContext";
import type { PublicCatalogKey } from "@/types/siteAccess";

export function CatalogStoppedBanner() {
  return (
    <div
      role="status"
      className="border-b border-accent/30 bg-accent/5 px-4 py-3 text-center text-sm text-ink sm:px-6"
    >
      Stopped on the public site — visitors cannot open this catalog. Studio still has full access.
    </div>
  );
}

export function PublicCatalog({
  catalog,
  children,
}: {
  catalog: PublicCatalogKey;
  children?: ReactNode;
}) {
  const { catalogs, ready } = useSiteAccess();
  const admin = useContext(AuthContext)?.user?.role === "ADMIN";
  const live = catalogs[catalog] !== false;

  if (!ready) {
    return <div className="min-h-[40vh]" aria-busy="true" />;
  }

  if (!live && !admin) {
    return <NotFoundState title="Page not found" description="That page is not on this site." />;
  }

  return (
    <>
      {!live && admin ? <CatalogStoppedBanner /> : null}
      {children ?? <Outlet />}
    </>
  );
}
