/** Shop hub appearance — header / hero background colors. */

export type ShopPageSettings = {
  header_bg_color: string;
  hero_bg_color: string;
  header_border_color: string | null;
};

export const DEFAULT_SHOP_PAGE_SETTINGS: ShopPageSettings = {
  /** Matches shop hero banner top yellow (#FEDB49). */
  header_bg_color: "#FEDB49",
  hero_bg_color: "#FEDB49",
  header_border_color: null,
};

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

export function normalizeShopHex(value: unknown, fallback: string): string {
  const v = String(value ?? "").trim().toUpperCase();
  return HEX_RE.test(v) ? v : fallback.toUpperCase();
}

export function parseShopPageSettings(row: Record<string, unknown> | null | undefined): ShopPageSettings {
  if (!row) return { ...DEFAULT_SHOP_PAGE_SETTINGS };
  return {
    header_bg_color: normalizeShopHex(
      row.header_bg_color,
      DEFAULT_SHOP_PAGE_SETTINGS.header_bg_color
    ),
    hero_bg_color: normalizeShopHex(
      row.hero_bg_color,
      DEFAULT_SHOP_PAGE_SETTINGS.hero_bg_color
    ),
    header_border_color: row.header_border_color
      ? normalizeShopHex(row.header_border_color, "")
      : null,
  };
}

export const SHOP_HEADER_COLOR_PRESETS = [
  { name: "Hero 黃", value: "#FEDB49" },
  { name: "頁首黃（舊）", value: "#FCCA30" },
  { name: "主黃（舊）", value: "#FFD84D" },
  { name: "淺黃", value: "#FFF3B8" },
  { name: "淡黃", value: "#FFF8D9" },
  { name: "奶油黃", value: "#FFF4CC" },
  { name: "暖白", value: "#FFFEFA" },
] as const;
