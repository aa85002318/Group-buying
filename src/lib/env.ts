/**
 * Centralized environment helpers for deployment (Vercel / Netlify / local).
 * Development: prefer the browser's current origin so LAN IP / localhost both work.
 */

export type AppEnvironment = "development" | "staging" | "production";

const DEV_DEFAULT_ORIGIN = "http://localhost:3003";

export function getAppEnv(): AppEnvironment {
  const env = process.env.NEXT_PUBLIC_APP_ENV;
  if (env === "staging" || env === "production") return env;
  return "development";
}

export function isProduction(): boolean {
  return getAppEnv() === "production";
}

/** Browser-only: current page origin (http://192.168.x.x:3003, https://shop.example.com, etc.) */
export function getBrowserOrigin(): string | null {
  if (typeof window === "undefined") return null;
  return window.location.origin.replace(/\/$/, "");
}

/**
 * Resolve site URL for links, auth redirects, share URLs.
 * Priority: explicit env → browser origin (client) → Vercel/Netlify → dev default.
 */
export function getSiteUrl(): string {
  const explicit =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (explicit) return explicit.replace(/\/$/, "");

  const browser = getBrowserOrigin();
  if (browser) return browser;

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`.replace(/\/$/, "");
  }

  if (process.env.URL) {
    return process.env.URL.replace(/\/$/, "");
  }

  return DEV_DEFAULT_ORIGIN;
}

/** Server routes: use incoming request host when env is not set (multi-device dev). */
export function getSiteUrlFromRequest(request: Request): string {
  const explicit =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  try {
    const url = new URL(request.url);
    if (url.origin && url.origin !== "null") {
      return url.origin.replace(/\/$/, "");
    }
  } catch {
    // ignore
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  const resolvedHost = forwardedHost ?? host;
  if (resolvedHost) {
    return `${proto}://${resolvedHost}`.replace(/\/$/, "");
  }

  return getSiteUrl();
}

/** Prefer client origin, then explicit origin param, then env / request. */
export function resolveSiteUrl(options?: { origin?: string; request?: Request }): string {
  if (options?.origin?.startsWith("http")) {
    return options.origin.replace(/\/$/, "");
  }
  const browser = getBrowserOrigin();
  if (browser) return browser;
  if (options?.request) return getSiteUrlFromRequest(options.request);
  return getSiteUrl();
}

export const BRAND_NAME = "chimeidiy 團購";
export const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL ?? "support@chimeidiy.com";
