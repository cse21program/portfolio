import type { ReactNode } from "react";
import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

export function scrollPageToId(id: string) {
  const node = document.getElementById(id);
  if (!node) {
    return;
  }
  const scroller = document.querySelector<HTMLElement>("[data-page-scroll]");
  const header = document.querySelector("header");
  const offset = Math.round((header?.getBoundingClientRect().height ?? 68) + 12);
  if (scroller && typeof scroller.scrollTo === "function") {
    const top =
      scroller.scrollTop + node.getBoundingClientRect().top - scroller.getBoundingClientRect().top - offset;
    scroller.scrollTo({ top: Math.max(0, top) });
    return;
  }
  if (typeof node.scrollIntoView === "function") {
    node.scrollIntoView({ block: "start" });
  }
}

export function PageViewport({ children }: { children: ReactNode }) {
  const { pathname, hash } = useLocation();

  useLayoutEffect(() => {
    if (!hash) {
      return;
    }
    scrollPageToId(decodeURIComponent(hash.replace(/^#/, "")));
  }, [pathname, hash]);

  return (
    <div className="h-dvh overflow-hidden print:h-auto print:overflow-visible">
      <div
        key={pathname}
        data-page-scroll
        className="h-full overflow-y-auto overscroll-none [scrollbar-gutter:stable] print:h-auto print:overflow-visible"
      >
        {children}
      </div>
    </div>
  );
}
