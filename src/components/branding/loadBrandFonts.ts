"use client";

import {
  BRAND_FONT_OPTIONS,
  brandFontFaceCss,
  brandGoogleFontsHref,
  getBrandFont,
  type BrandFontId,
} from "@/lib/branding/fonts";

function fontFileUrl(file: string): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!base) return null;
  return `${base}/storage/v1/object/public/brand-fonts/${file}`;
}

function ensureLinkTag(id: string, href: string) {
  if (typeof document === "undefined") return;
  let el = document.getElementById(id) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.id = id;
    el.rel = "stylesheet";
    document.head.appendChild(el);
  }
  if (el.getAttribute("data-href") !== href) {
    el.href = href;
    el.setAttribute("data-href", href);
  }
}

function ensureStyleTag(id: string, css: string) {
  if (typeof document === "undefined") return;
  let el = document.getElementById(id) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = id;
    document.head.appendChild(el);
  }
  if (el.textContent !== css) el.textContent = css;
}

const loadedGoogle = new Set<string>();
const loadedFaces = new Set<string>();

/**
 * Load brand fonts the same way on admin + storefront.
 * Prefer Google Fonts CDN; only self-host when a family has no Google CSS
 * (avoids two different files registering the same family name).
 */
export function loadBrandFonts(ids: Array<string | null | undefined>) {
  if (typeof document === "undefined") return;

  const normalized = Array.from(
    new Set(
      ids
        .map((id) => (typeof id === "string" && id ? id : null))
        .filter((id): id is BrandFontId => Boolean(id) && id !== "system")
    )
  );
  if (!normalized.length) return;

  const googleIds = normalized.filter((id) => getBrandFont(id).googleFamily);
  const selfHostIds = normalized.filter((id) => {
    const opt = getBrandFont(id);
    return Boolean(opt.file) && !opt.googleFamily;
  });

  const googleKey = googleIds.slice().sort().join(",");
  if (googleIds.length && !loadedGoogle.has(googleKey)) {
    const href = brandGoogleFontsHref(googleIds);
    if (href) {
      // Merge with previously requested google families so one link can grow.
      const prev = (document.getElementById("chimeidiy-brand-google-fonts") as HTMLLinkElement | null)
        ?.getAttribute("data-ids")
        ?.split(",")
        .filter(Boolean) ?? [];
      const merged = Array.from(new Set([...prev, ...googleIds]));
      const mergedHref = brandGoogleFontsHref(merged);
      if (mergedHref) {
        ensureLinkTag("chimeidiy-brand-google-fonts", mergedHref);
        const link = document.getElementById("chimeidiy-brand-google-fonts");
        link?.setAttribute("data-ids", merged.join(","));
        loadedGoogle.add(googleKey);
        loadedGoogle.add(merged.slice().sort().join(","));
      }
    }
  }

  for (const id of selfHostIds) {
    if (loadedFaces.has(id)) continue;
    const opt = getBrandFont(id);
    if (!opt.file) continue;
    const url = fontFileUrl(opt.file);
    const css = brandFontFaceCss(opt, url);
    if (!css) continue;
    ensureStyleTag(`chimeidiy-font-face-${id}`, css);
    loadedFaces.add(id);
  }
}

/** Preload every catalog font that has a Google family (admin editor preview). */
export function loadAllBrandGoogleFonts() {
  loadBrandFonts(BRAND_FONT_OPTIONS.map((f) => f.id));
}
