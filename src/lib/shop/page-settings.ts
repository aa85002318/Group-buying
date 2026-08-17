/** Shop hub appearance — header / hero background colors. */

export type ShopPageSettings = {
  header_bg_color: string;
  hero_bg_color: string;
  header_border_color: string | null;
};

/** Shop hub yellow — IP welcome plane (#FFD454). */
export const SHOP_BRAND_YELLOW = "#FFD454";

export const DEFAULT_SHOP_PAGE_SETTINGS: ShopPageSettings = {
  header_bg_color: SHOP_BRAND_YELLOW,
  hero_bg_color: SHOP_BRAND_YELLOW,
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
  { name: "主黃", value: SHOP_BRAND_YELLOW },
  { name: "App Hero 黃（舊）", value: "#FDE045" },
  { name: "Hero 黃（舊）", value: "#FEDB49" },
  { name: "頁首黃（舊）", value: "#FCCA30" },
  { name: "淺黃", value: "#FFF3B8" },
  { name: "淡黃", value: "#FFF8D9" },
  { name: "奶油黃", value: "#FFF4CC" },
  { name: "暖白", value: "#FFFEFA" },
] as const;
