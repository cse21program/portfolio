import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";

type SearchModalContextValue = {
  open: boolean;
  openSearch: () => void;
  closeSearch: () => void;
};

const SearchModalContext = createContext<SearchModalContextValue | null>(null);

export function useSearchModal() {
  const value = useContext(SearchModalContext);
  if (!value) {
    throw new Error("useSearchModal must be used within SearchProvider");
  }
  return value;
}

export function useOptionalSearchModal() {
  return useContext(SearchModalContext);
}

export function SearchProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const openSearch = useCallback(() => setOpen(true), []);
  const closeSearch = useCallback(() => setOpen(false), []);
  const value = useMemo(() => ({ open, openSearch, closeSearch }), [open, openSearch, closeSearch]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.defaultPrevented) {
        return;
      }
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "k") {
        return;
      }
      event.preventDefault();
      if (pathname === "/search") {
        document.getElementById("global-search")?.focus();
        return;
      }
      setOpen((current) => !current);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pathname]);

  return <SearchModalContext.Provider value={value}>{children}</SearchModalContext.Provider>;
}
