/** Site branding tokens from site_settings.branding (with safe defaults). */

import {
  BRAND_FONT_OPTIONS,
  getBrandFont,
  fontFamilyForInlineStyle,
  brandFontIdsInHtml,
  type BrandFontId,
} from "@/lib/branding/fonts";

export type BrandingSettings = {
  primary: string;
  primaryHover: string;
  background: string;
  surface: string;
  softCoral: string;
  honey: string;
  mint: string;
  sky: string;
  title: string;
  text: string;
  border: string;
  pagePaddingX: string;
  cardRadius: string;
  logoUrl?: string | null;
  mobileLogoUrl?: string | null;
  faviconUrl?: string | null;
  /** Body / UI font — shared by website, APP, PWA */
  bodyFont?: BrandFontId;
  /** Heading / display font */
  headingFont?: BrandFontId;
};

export const DEFAULT_BRANDING: BrandingSettings = {
  primary: "#FF6B5B",
  primaryHover: "#FF8273",
  background: "#FFF9F5",
  surface: "#FFFFFF",
  softCoral: "#FFE8E2",
  honey: "#FFC857",
  mint: "#9FD8B6",
  sky: "#A7D7FF",
  title: "#43332B",
  text: "#6D5C53",
  border: "#F2E7DF",
  pagePaddingX: "15px",
  cardRadius: "16px",
  logoUrl: null,
  mobileLogoUrl: null,
  faviconUrl: null,
  bodyFont: "noto-sans-tc",
  headingFont: "noto-sans-tc",
};

function asHex(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const v = value.trim();
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v)) return v;
  return fallback;
}

function asCssLength(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const v = value.trim();
  if (/^\d+(\.\d+)?(px|rem|em|%)$/.test(v)) return v;
  return fallback;
}

function asFontId(value: unknown, fallback: BrandFontId): BrandFontId {
  if (typeof value !== "string") return fallback;
  return BRAND_FONT_OPTIONS.some((f) => f.id === value)
    ? (value as BrandFontId)
    : fallback;
}

export function mergeBrandingSettings(raw: unknown): BrandingSettings {
  const src =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};
  return {
    primary: asHex(src.primary, DEFAULT_BRANDING.primary),
    primaryHover: asHex(src.primaryHover, DEFAULT_BRANDING.primaryHover),
    background: asHex(src.background, DEFAULT_BRANDING.background),
    surface: asHex(src.surface, DEFAULT_BRANDING.surface),
    softCoral: asHex(src.softCoral, DEFAULT_BRANDING.softCoral),
    honey: asHex(src.honey, DEFAULT_BRANDING.honey),
    mint: asHex(src.mint, DEFAULT_BRANDING.mint),
    sky: asHex(src.sky, DEFAULT_BRANDING.sky),
    title: asHex(src.title, DEFAULT_BRANDING.title),
    text: asHex(src.text, DEFAULT_BRANDING.text),
    border: asHex(src.border, DEFAULT_BRANDING.border),
    pagePaddingX: asCssLength(src.pagePaddingX, DEFAULT_BRANDING.pagePaddingX),
    cardRadius: asCssLength(src.cardRadius, DEFAULT_BRANDING.cardRadius),
    logoUrl: typeof src.logoUrl === "string" ? src.logoUrl : null,
    mobileLogoUrl: typeof src.mobileLogoUrl === "string" ? src.mobileLogoUrl : null,
    faviconUrl: typeof src.faviconUrl === "string" ? src.faviconUrl : null,
    bodyFont: asFontId(src.bodyFont, DEFAULT_BRANDING.bodyFont!),
    headingFont: asFontId(src.headingFont, DEFAULT_BRANDING.headingFont!),
  };
}

/** CSS custom properties injected into :root */
export function brandingToCssVars(b: BrandingSettings): Record<string, string> {
  const body = getBrandFont(b.bodyFont);
  const heading = getBrandFont(b.headingFont);
  return {
    "--brand-primary": b.primary,
    "--brand-primary-hover": b.primaryHover,
    "--brand-background": b.background,
    "--brand-surface": b.surface,
    "--brand-soft-coral": b.softCoral,
    "--brand-honey": b.honey,
    "--brand-mint": b.mint,
    "--brand-sky": b.sky,
    "--brand-title": b.title,
    "--brand-text": b.text,
    "--brand-border": b.border,
    "--page-padding-x": b.pagePaddingX,
    "--card-radius": b.cardRadius,
    "--font-sans": body.family,
    "--font-brand": body.family,
    "--font-heading": heading.family,
  };
}

export { BRAND_FONT_OPTIONS, getBrandFont, fontFamilyForInlineStyle, brandFontIdsInHtml };
export type { BrandFontId };
