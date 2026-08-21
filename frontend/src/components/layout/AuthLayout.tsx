import { useLayoutEffect, type ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { PageViewport } from "@/components/layout/PageViewport";
import { TrackPageview } from "@/features/analytics/TrackPageview";

const AUTH_PORTRAIT = "/images/profile-portrait.webp";

export function AuthLayout() {
  useLayoutEffect(() => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = AUTH_PORTRAIT;
    link.type = "image/webp";
    document.head.appendChild(link);
    return () => {
      link.remove();
    };
  }, []);

  return (
    <PageViewport>
      <TrackPageview />
      <Outlet />
    </PageViewport>
  );
}
