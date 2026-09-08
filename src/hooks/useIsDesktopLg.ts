"use client";

import { useSyncExternalStore } from "react";
import { DESKTOP_BREAKPOINT_PX } from "@/lib/features/desktop-v2";

const QUERY = `(min-width: ${DESKTOP_BREAKPOINT_PX}px)`;

function subscribe(onStoreChange: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", onStoreChange);
  return () => mql.removeEventListener("change", onStoreChange);
}

function getSnapshot() {
  return window.matchMedia(QUERY).matches;
}

/** SSR / first paint: treat as mobile so existing Mobile UI is the default. */
function getServerSnapshot() {
  return false;
}

/** True when viewport ≥ 1024px (Tailwind `lg`). */
export function useIsDesktopLg(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
