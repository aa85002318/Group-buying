/** Matches products.disclaimer DB DEFAULT (NOT NULL). */
export const DEFAULT_PRODUCT_DISCLAIMER =
  "本產品不宣稱任何醫療療效，僅供一般食用參考。";

/** Never return null — explicit NULL bypasses the column DEFAULT and fails NOT NULL. */
export function resolveProductDisclaimer(
  ...candidates: Array<string | null | undefined>
): string {
  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return DEFAULT_PRODUCT_DISCLAIMER;
}
