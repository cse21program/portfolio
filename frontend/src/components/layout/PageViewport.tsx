import type { ReactNode } from "react";
import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

export function PageViewport({ children }: { children: ReactNode }) {
  const { pathname, hash } = useLocation();

  useLayoutEffect(() => {
    if (!hash) {
      return;
    }
    const id = decodeURIComponent(hash.replace(/^#/, ""));
    document.getElementById(id)?.scrollIntoView();
  }, [pathname, hash]);

  return (
    <div className="h-dvh overflow-hidden print:h-auto print:overflow-visible">
      <div key={pathname} className="h-full overflow-y-auto overscroll-none print:h-auto print:overflow-visible">
        {children}
      </div>
    </div>
  );
}
