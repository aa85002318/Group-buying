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

export const DESKTOP_NAV_LINKS = [
  { href: "/", label: "首頁" },
  { href: "/shop", label: "商城" },
  { href: "/recipes", label: "食譜" },
  { href: "/activities", label: "最新活動" },
  { href: "/themes", label: "品牌專區" },
  { href: "/ai", label: "AI助手" },
  { href: "/stores", label: "門市資訊" },
] as const;
