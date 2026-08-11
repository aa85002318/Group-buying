/** Normalize Excel/CSV cell values. SheetJS keeps numeric cells as numbers. */
export function cellText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) {
    return Number.isInteger(value) ? String(value) : String(value);
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value).trim();
}

export function pickImportValue(row: Record<string, unknown>, ...keys: string[]): string {
  const exact = new Map(Object.entries(row).map(([key, value]) => [key.trim(), value]));
  for (const key of keys) {
    const value = cellText(exact.get(key));
    if (value) return value;
  }

  const normalized = new Map(
    Object.entries(row).map(([key, value]) => [key.trim().toLowerCase(), value])
  );
  for (const key of keys) {
    const value = cellText(normalized.get(key.toLowerCase()));
    if (value) return value;
  }
  return "";
}

/** Convert Excel serial dates (e.g. 46022) or ISO-like strings to YYYY-MM-DD. */
export function toIsoDate(value: string): string | null {
  const raw = value.trim();
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);

  const serial = Number(raw);
  if (Number.isFinite(serial) && serial > 20000 && serial < 80000) {
    const utc = new Date(Math.round((serial - 25569) * 86400 * 1000));
    if (!Number.isNaN(utc.getTime())) return utc.toISOString().slice(0, 10);
  }
  return raw;
}
