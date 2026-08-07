"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useSideMenuHistory } from "@/hooks/useSideMenuHistory";

export function useSideMenu(open: boolean, onOpenChange: (open: boolean) => void) {
  const history = useSideMenuHistory();
  const [query, setQuery] = useState("");
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const titleId = useId();
  const scrollYRef = useRef(0);

  const close = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const openMenu = useCallback(() => {
    onOpenChange(true);
  }, [onOpenChange]);

  useEffect(() => {
    if (!open) {
      history.reset();
      setQuery("");
      return;
    }
    scrollYRef.current = window.scrollY;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => {
      panelRef.current?.focus();
    }, 40);
    return () => {
      document.body.style.overflow = prev;
      window.clearTimeout(t);
      window.scrollTo(0, scrollYRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only on close
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (history.canPop) history.pop();
        else close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, history, close]);

  // Android / browser back: pop panel instead of leaving page
  useEffect(() => {
    if (!open) return;
    const state = { sideMenu: true };
    window.history.pushState(state, "");
    const onPop = () => {
      if (history.canPop) {
        history.pop();
        window.history.pushState(state, "");
      } else {
        close();
      }
    };
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
    };
  }, [open, history.canPop, history, close]);

  return {
    ...history,
    query,
    setQuery,
    close,
    openMenu,
    triggerRef,
    panelRef,
    titleId,
  };
}
