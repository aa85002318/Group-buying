/** Extract pickup token from scanned QR text or manual input. */
export function parsePickupToken(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  try {
    const url = new URL(trimmed);
    const pathToken = url.pathname.match(/\/staff\/pickup\/([^/?#]+)/)?.[1];
    if (pathToken) return decodeURIComponent(pathToken);
    const queryToken = url.searchParams.get("token");
    if (queryToken) return queryToken.trim();
  } catch {
    // not a URL — use as raw token
  }

  return trimmed;
}
