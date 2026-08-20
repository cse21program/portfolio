import { useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import { useSearchModal } from "@/features/search/SearchContext";
import { SearchPalette } from "@/features/search/SearchPalette";

export function SearchModal() {
  const { open, closeSearch } = useSearchModal();
  const { pathname } = useLocation();
  const labelId = useId();
  const hiddenOnPage = pathname === "/search";

  useEffect(() => {
    if (!open || hiddenOnPage) {
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open, hiddenOnPage]);

  if (!open || hiddenOnPage || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-ink/45 p-3 pt-[10vh] backdrop-blur-[6px] sm:p-6 sm:pt-[12vh]"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelId}
      tabIndex={-1}
      onClick={closeSearch}
    >
      <p id={labelId} className="sr-only">
        Search the catalog
      </p>
      <div className="w-full max-w-2xl" onClick={(event) => event.stopPropagation()}>
        <SearchPalette onClose={closeSearch} />
      </div>
    </div>,
    document.body,
  );
}
