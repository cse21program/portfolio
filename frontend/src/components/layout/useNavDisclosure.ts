import { useEffect, useRef, type RefObject } from "react";
import { useLocation } from "react-router-dom";

export function useNavDisclosure(
  open: boolean,
  onClose: () => void,
  options: {
    rootRef?: RefObject<HTMLElement | null>;
    lockScroll?: boolean;
  } = {},
) {
  const { pathname } = useLocation();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const lastPath = useRef(pathname);

  useEffect(() => {
    if (lastPath.current === pathname) {
      return;
    }
    lastPath.current = pathname;
    onCloseRef.current();
  }, [pathname]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCloseRef.current();
      }
    }

    function onPointer(event: PointerEvent) {
      const root = options.rootRef?.current;
      if (root && event.target instanceof Node && !root.contains(event.target)) {
        onCloseRef.current();
      }
    }

    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open, options.rootRef]);

  useEffect(() => {
    if (!open || !options.lockScroll) {
      return;
    }
    const scroller = document.querySelector<HTMLElement>("[data-page-scroll]");
    const node = scroller ?? document.body;
    const previous = node.style.overflow;
    node.style.overflow = "hidden";
    return () => {
      node.style.overflow = previous;
    };
  }, [open, options.lockScroll]);
}
