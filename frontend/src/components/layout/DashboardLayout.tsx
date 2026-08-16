import { Outlet } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { customerNav } from "@/config/navigation";
import { useAuth } from "@/features/auth/AuthContext";

export function DashboardLayout() {
  const { user } = useAuth();

  return (
    <AppShell
      area="Your account"
      nav={customerNav}
      homeHref="/dashboard"
      extras={
        user?.role === "ADMIN"
          ? [{ label: "Admin studio", href: "/admin" }]
          : []
      }
    >
      <Outlet />
    </AppShell>
  );
}
