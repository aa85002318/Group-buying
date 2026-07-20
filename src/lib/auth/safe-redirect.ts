const BLOCKED_PREFIXES = ["//", "/\\", "/auth/login", "/auth/register"];

/** Prevent open redirects — only allow same-origin relative paths */
export function getSafeRedirectPath(next: string | null | undefined, fallback = "/"): string {
  if (!next) return fallback;
  const trimmed = next.trim();
  if (!trimmed.startsWith("/")) return fallback;
  if (BLOCKED_PREFIXES.some((p) => trimmed.startsWith(p))) return fallback;
  if (trimmed.includes("://")) return fallback;
  return trimmed;
}
