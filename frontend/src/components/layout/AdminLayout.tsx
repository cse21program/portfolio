import { Outlet } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { PageViewport } from "@/components/layout/PageViewport";
import { adminNav } from "@/config/navigation";

export function AdminLayout() {
  return (
    <PageViewport>
      <AppShell
        area="Studio"
        nav={adminNav}
        homeHref="/admin"
        switchTo={{ label: "Your account", href: "/dashboard" }}
      >
        <Outlet />
      </AppShell>
    </PageViewport>
  );
}
