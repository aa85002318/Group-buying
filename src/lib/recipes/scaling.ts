/** Scale recipe ingredient amounts without mutating originals. */

const NON_NUMERIC = /^(少許|適量|少許即可|適量即可|to taste|a pinch|as needed)$/i;

export function parseAmount(amount: string | null | undefined): number | null {
  if (amount == null) return null;
  const raw = String(amount).trim();
  if (!raw || NON_NUMERIC.test(raw)) return null;
  const match = raw.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  if (!match) return null;
  const n = Number(match[0]);
  return Number.isFinite(n) ? n : null;
}

/** Round for display: keep up to 2 decimals, trim trailing zeros. */
export function formatScaledAmount(value: number): string {
  if (!Number.isFinite(value)) return "";
  const rounded = Math.round(value * 100) / 100;
  return String(rounded);
}

export function scaleAmountText(
  amount: string | null | undefined,
  multiplier: number,
  quantityNumeric?: number | null
): string | null {
  if (amount == null && quantityNumeric == null) return null;
  if (amount && NON_NUMERIC.test(String(amount).trim())) return String(amount).trim();
  const base = quantityNumeric ?? parseAmount(amount);
  if (base == null) return amount ?? null;
  return formatScaledAmount(base * multiplier);
}

export const RECIPE_SCALE_PRESETS = [0.5, 1, 1.5, 2] as const;
