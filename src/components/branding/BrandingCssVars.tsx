"use client";

import { useEffect } from "react";
import {
  brandingToCssVars,
  type BrandingSettings,
} from "@/lib/branding";
import { loadBrandFonts } from "@/components/branding/loadBrandFonts";

/** Fetch CMS branding and apply CSS variables + fonts on :root. */
export function BrandingCssVars() {
  useEffect(() => {
    let cancelled = false;
    fetch("/api/branding")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled || !d.branding) return;
        const branding = d.branding as BrandingSettings;
        const vars = brandingToCssVars(branding);
        const root = document.documentElement;
        Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));

        // Same loader as admin rich-text / storefront RichTextHtml (Google-first).
        loadBrandFonts([branding.bodyFont, branding.headingFont]);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
