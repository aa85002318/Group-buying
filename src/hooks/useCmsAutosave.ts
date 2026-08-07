"use client";

import { useEffect, useRef } from "react";

/**
 * Autosave hook — local dirty tracking only in Phase 1–2.
 * Call `saveFn` when dirty after debounce; does not write until wired.
 */
export function useCmsAutosave(
  isDirty: boolean,
  saveFn: () => void | Promise<void>,
  enabled: boolean,
  delayMs = 1200
) {
  const fnRef = useRef(saveFn);
  fnRef.current = saveFn;

  useEffect(() => {
    if (!enabled || !isDirty) return;
    const t = window.setTimeout(() => {
      void fnRef.current();
    }, delayMs);
    return () => window.clearTimeout(t);
  }, [isDirty, enabled, delayMs]);
}
