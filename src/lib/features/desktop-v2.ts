import { GROUP_BUY_CONSUMER_VISIBLE } from "@/lib/features/group-buy-visibility";

/**
 * Desktop V2 feature gate.
 *
 * Staging: on by default when APP_ENV=staging or hostname is staging
 *   (set NEXT_PUBLIC_ENABLE_DESKTOP_V2=false to force off).
 * Production: always off (hostname + APP_ENV hard-block).
 */

const PRODUCTION_HOST = "shop.chimeidiygroupbuying.com";
const STAGING_HOST = "staging.chimeidiygroupbuying.com";

function isProductionContext(): boolean {
  if (process.env.NEXT_PUBLIC_APP_ENV === "production") return true;
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  if (site.includes(PRODUCTION_HOST) && !site.includes("staging")) return true;
  return false;
}

/** Server / build-time gate. */
export function isDesktopV2EnvEnabled(): boolean {
  if (isProductionContext()) return false;
  if (process.env.NEXT_PUBLIC_ENABLE_DESKTOP_V2 === "false") return false;
  if (process.env.NEXT_PUBLIC_ENABLE_DESKTOP_V2 === "true") return true;
  if (process.env.NEXT_PUBLIC_APP_ENV === "staging") return true;
  return false;
}

/** Client-side gate with hostname hard-block on production. */
export function isDesktopV2EnabledClient(): boolean {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === PRODUCTION_HOST) return false;
    if (host === STAGING_HOST) {
      return process.env.NEXT_PUBLIC_ENABLE_DESKTOP_V2 !== "false";
    }
    if (host === "localhost" || host === "127.0.0.1") {
      return (
        process.env.NEXT_PUBLIC_ENABLE_DESKTOP_V2 === "true" ||
        process.env.NODE_ENV === "development"
      );
    }
  }
  return isDesktopV2EnvEnabled();
}

export const DESKTOP_BREAKPOINT_PX = 1024;

const ALL_DESKTOP_NAV_LINKS = [
  { href: "/", label: "首頁" },
  { href: "/group-buy", label: "團購", groupBuy: true },
  { href: "/shop", label: "商城" },
  { href: "/recipes", label: "食譜" },
  { href: "/activities", label: "最新活動" },
  { href: "/themes", label: "品牌專區" },
  { href: "/ai", label: "AI助手" },
  { href: "/stores", label: "門市資訊" },
] as const;

/** 團購 stays out of the website nav while FEATURES.groupBuying is off (same as the app). */
export const DESKTOP_NAV_LINKS = ALL_DESKTOP_NAV_LINKS.filter(
  (link) => !("groupBuy" in link) || GROUP_BUY_CONSUMER_VISIBLE
);

/**
 * Hub pages that render their own full-bleed Desktop V2 layout.
 * Every other storefront page falls back to the centered desktop frame
 * in AppShell until it gets a dedicated desktop design.
 */
export const DESKTOP_V2_NATIVE_PATHS = [
  "/",
  "/group-buy",
  "/shop",
  "/recipes",
  "/activities",
  "/themes",
  "/ai",
  "/stores",
  "/member",
] as const;

export function isDesktopV2NativePath(pathname: string): boolean {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return (DESKTOP_V2_NATIVE_PATHS as readonly string[]).includes(path);
}

/** Attribute set on <html> before hydration when Desktop V2 will render. */
export const DESKTOP_V2_BOOT_ATTR = "data-desktop-v2-boot";

/**
 * Inline <head> script: pages are statically prerendered as Mobile, so a
 * desktop visitor would briefly see the mobile tree before hydration swaps
 * in Desktop V2. This flags <html> early so CSS can hide the mobile shell
 * until the desktop tree mounts (CSS also force-reveals after 3s as a
 * safety net). Mirrors isDesktopV2EnabledClient().
 */
export function getDesktopV2BootScript(): string {
  const cfg = JSON.stringify({
    prod: PRODUCTION_HOST,
    staging: STAGING_HOST,
    flag: process.env.NEXT_PUBLIC_ENABLE_DESKTOP_V2 ?? "",
    dev: process.env.NODE_ENV === "development",
    env: isDesktopV2EnvEnabled(),
    bp: DESKTOP_BREAKPOINT_PX,
    attr: DESKTOP_V2_BOOT_ATTR,
  });
  return `(function(c){try{var h=location.hostname,on;if(h===c.prod)on=false;else if(h===c.staging)on=c.flag!=="false";else if(h==="localhost"||h==="127.0.0.1")on=c.flag==="true"||c.dev;else on=c.env;if(on&&window.matchMedia("(min-width: "+c.bp+"px)").matches)document.documentElement.setAttribute(c.attr,"")}catch(e){}})(${cfg});`;
}

/**
 * Long-form reading pages: on Desktop V2 the fallback frame narrows to a
 * comfortable line length instead of stretching text across 1200px.
 */
const DESKTOP_V2_READING_EXACT = ["/terms", "/privacy", "/faq", "/account-deletion"];
const DESKTOP_V2_READING_PREFIX = ["/articles/", "/news/", "/support/", "/help/"];

export function isDesktopV2ReadingPath(pathname: string): boolean {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  if (DESKTOP_V2_READING_EXACT.includes(path)) return true;
  return DESKTOP_V2_READING_PREFIX.some((prefix) => path.startsWith(prefix));
}
