"use client";

import { useEffect } from "react";
import {
  brandingToCssVars,
  getBrandFont,
  type BrandingSettings,
} from "@/lib/branding";
import {
  brandFontFaceCss,
  brandGoogleFontsHref,
} from "@/lib/branding/fonts";

function fontFileUrl(file: string): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!base) return null;
  return `${base}/storage/v1/object/public/brand-fonts/${file}`;
}

function ensureStyleTag(id: string, css: string) {
  let el = document.getElementById(id) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = css;
}

function ensureLinkTag(id: string, href: string) {
  let el = document.getElementById(id) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.id = id;
    el.rel = "stylesheet";
    document.head.appendChild(el);
  }
  if (el.href !== href) el.href = href;
}

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

        // Prefer Google Fonts CDN (same OFL families as the downloaded zips).
        const googleHref = brandGoogleFontsHref([branding.bodyFont, branding.headingFont]);
        if (googleHref) ensureLinkTag("chimeidiy-brand-google-fonts", googleHref);

        // Optional self-hosted copies from Supabase brand-fonts bucket.
        const body = getBrandFont(branding.bodyFont);
        const heading = getBrandFont(branding.headingFont);
        const faces = [body, heading]
          .filter((f, i, arr) => arr.findIndex((x) => x.id === f.id) === i)
          .map((f) => {
            if (!f.file) return "";
            const url = fontFileUrl(f.file);
            return url ? brandFontFaceCss(f, url) : "";
          })
          .join("");
        if (faces) ensureStyleTag("chimeidiy-brand-font-faces", faces);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
