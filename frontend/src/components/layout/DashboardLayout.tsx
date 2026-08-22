import { Outlet } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { PageViewport } from "@/components/layout/PageViewport";
import { customerNav } from "@/config/navigation";
import { useAuth } from "@/features/auth/AuthContext";

export function DashboardLayout() {
  const { user } = useAuth();

  return (
    <PageViewport>
      <AppShell
        area="Your account"
        nav={customerNav}
        homeHref="/dashboard"
        switchTo={user?.role === "ADMIN" ? { label: "Studio", href: "/admin" } : undefined}
      >
        <Outlet />
      </AppShell>
    </PageViewport>
  );
}
