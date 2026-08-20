import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { env } from "@/config/env";

const SKIP = /^\/(admin|dashboard|login|register|forgot-password|reset-password|verify-email)(\/|$)/;

function remember(path: string) {
  try {
    const key = `pageview:${path}`;
    if (sessionStorage.getItem(key)) {
      return false;
    }
    sessionStorage.setItem(key, "1");
    return true;
  } catch {
    return true;
  }
}

export function TrackPageview() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname || "/";
    if (SKIP.test(path) || !remember(path)) {
      return;
    }
    void fetch(`${env.apiUrl}/analytics/pageview`, {
      method: "POST",
      credentials: "include",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path }),
    }).catch(() => undefined);
  }, [location.pathname]);

  return null;
}
