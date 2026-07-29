"use client";

import { useEffect } from "react";
import { brandingToCssVars, type BrandingSettings } from "@/lib/branding";

/** Fetch CMS branding and apply CSS variables on :root. Safe no-op on failure. */
export function BrandingCssVars() {
  useEffect(() => {
    let cancelled = false;
    fetch("/api/branding")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled || !d.branding) return;
        const vars = brandingToCssVars(d.branding as BrandingSettings);
        const root = document.documentElement;
        Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
