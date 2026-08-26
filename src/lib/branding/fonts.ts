/**
 * Shared brand font catalog for website / APP / PWA.
 * Files are hosted in Supabase Storage bucket `brand-fonts` (or local /fonts fallback).
 */

export type BrandFontId =
  | "system"
  | "noto-sans-tc"
  | "noto-sans-hk"
  | "noto-serif-tc"
  | "noto-serif-hk"
  | "chiron-goround-tc"
  | "chiron-hei-hk"
  | "chiron-sung-hk"
  | "chocolate-classical-sans"
  | "cactus-classical-serif"
  | "lxgw-wenkai-tc"
  | "lxgw-wenkai-mono-tc";

export type BrandFontOption = {
  id: BrandFontId;
  label: string;
  /** CSS font-family stack */
  family: string;
  /** Relative path under brand-fonts bucket / public/fonts */
  file?: string;
  /** Google Fonts CSS2 family query (optional CDN fallback) */
  googleFamily?: string;
  category: "sans" | "serif" | "rounded" | "mono" | "system";
  sample: string;
};

export const BRAND_FONT_OPTIONS: BrandFontOption[] = [
  {
    id: "system",
    label: "系統預設",
    family: '"Noto Sans TC", "PingFang TC", "Microsoft JhengHei", system-ui, sans-serif',
    category: "system",
    sample: "棋美點心屋 CHIMEIDIY",
  },
  {
    id: "noto-sans-tc",
    label: "Noto Sans TC（黑體）",
    family: '"Noto Sans TC", "PingFang TC", sans-serif',
    file: "NotoSansTC-VariableFont_wght.ttf",
    googleFamily: "Noto+Sans+TC:wght@100..900",
    category: "sans",
    sample: "門市取貨・團購結單",
  },
  {
    id: "noto-sans-hk",
    label: "Noto Sans HK",
    family: '"Noto Sans HK", "Noto Sans TC", sans-serif',
    file: "NotoSansHK-VariableFont_wght.ttf",
    googleFamily: "Noto+Sans+HK:wght@100..900",
    category: "sans",
    sample: "烘焙材料・食譜教學",
  },
  {
    id: "noto-serif-tc",
    label: "Noto Serif TC（明體）",
    family: '"Noto Serif TC", "Songti TC", serif',
    file: "NotoSerifTC-VariableFont_wght.ttf",
    googleFamily: "Noto+Serif+TC:wght@200..900",
    category: "serif",
    sample: "季節甜點・手作溫度",
  },
  {
    id: "noto-serif-hk",
    label: "Noto Serif HK",
    family: '"Noto Serif HK", "Noto Serif TC", serif',
    file: "NotoSerifHK-VariableFont_wght.ttf",
    googleFamily: "Noto+Serif+HK:wght@200..900",
    category: "serif",
    sample: "品牌故事・質感標題",
  },
  {
    id: "chiron-goround-tc",
    label: "昭源圓體 TC",
    family: '"Chiron GoRound TC", "Noto Sans TC", sans-serif',
    file: "ChironGoRoundTC-VariableFont_wght.ttf",
    googleFamily: "Chiron+GoRound+TC:wght@200..900",
    category: "rounded",
    sample: "圓潤親和・APP 標題",
  },
  {
    id: "chiron-hei-hk",
    label: "昭源黑體 HK",
    family: '"Chiron Hei HK", "Noto Sans TC", sans-serif',
    file: "ChironHeiHK-VariableFont_wght.ttf",
    googleFamily: "Chiron+Hei+HK:wght@200..900",
    category: "sans",
    sample: "清晰內文・後台設定",
  },
  {
    id: "chiron-sung-hk",
    label: "昭源宋體 HK",
    family: '"Chiron Sung HK", "Noto Serif TC", serif',
    file: "ChironSungHK-VariableFont_wght.ttf",
    googleFamily: "Chiron+Sung+HK:wght@200..900",
    category: "serif",
    sample: "典雅標題・文章閱讀",
  },
  {
    id: "chocolate-classical-sans",
    label: "巧克力古典黑體",
    family: '"Chocolate Classical Sans", "Noto Sans TC", sans-serif',
    file: "ChocolateClassicalSans-Regular.ttf",
    googleFamily: "Chocolate+Classical+Sans",
    category: "sans",
    sample: "品牌標語・活動 Banner",
  },
  {
    id: "cactus-classical-serif",
    label: "仙人掌古典明體",
    family: '"Cactus Classical Serif", "Noto Serif TC", serif',
    file: "CactusClassicalSerif-Regular.ttf",
    googleFamily: "Cactus+Classical+Serif",
    category: "serif",
    sample: "故事感標題・食譜封面",
  },
  {
    id: "lxgw-wenkai-tc",
    label: "霞鶩文楷 TC",
    family: '"LXGW WenKai TC", "KaiTi", serif',
    file: "LXGWWenKaiTC-Regular.ttf",
    googleFamily: "LXGW+WenKai+TC:wght@300;400;700",
    category: "serif",
    sample: "手寫溫度・教學步驟",
  },
  {
    id: "lxgw-wenkai-mono-tc",
    label: "霞鶩文楷等寬 TC",
    family: '"LXGW WenKai Mono TC", ui-monospace, monospace',
    file: "LXGWWenKaiMonoTC-Regular.ttf",
    googleFamily: "LXGW+WenKai+Mono+TC:wght@300;400;700",
    category: "mono",
    sample: "SKU-001 / 批號 LOT",
  },
];

export function getBrandFont(id: string | null | undefined): BrandFontOption {
  return BRAND_FONT_OPTIONS.find((f) => f.id === id) ?? BRAND_FONT_OPTIONS[0]!;
}

/** Primary family name without quotes (e.g. Noto Sans TC). */
export function brandFontPrimaryName(option: BrandFontOption): string {
  return option.family.split(",")[0]!.replace(/['"]/g, "").trim();
}

/**
 * font-family value safe inside double-quoted HTML style="...".
 * Brand stacks use double quotes which would break style attributes.
 */
export function fontFamilyForInlineStyle(family: string): string {
  return family.replace(/"/g, "'");
}

/** Detect brand font ids referenced by inline font-family / data-brand-font in HTML. */
export function brandFontIdsInHtml(html: string | null | undefined): BrandFontId[] {
  if (!html) return [];
  const found = new Set<BrandFontId>();
  const dataRe = /data-brand-font\s*=\s*["']([^"']+)["']/gi;
  let dataMatch: RegExpExecArray | null;
  while ((dataMatch = dataRe.exec(html)) !== null) {
    const id = dataMatch[1] as BrandFontId;
    if (BRAND_FONT_OPTIONS.some((f) => f.id === id)) found.add(id);
  }
  for (const opt of BRAND_FONT_OPTIONS) {
    if (opt.id === "system") continue;
    const name = brandFontPrimaryName(opt);
    if (!name) continue;
    if (html.includes(name)) found.add(opt.id);
  }
  return Array.from(found);
}

export function brandFontFaceCss(
  option: BrandFontOption,
  fileUrl: string | null
): string {
  if (!option.file || !fileUrl) return "";
  const familyName = brandFontPrimaryName(option);
  return `@font-face{font-family:"${familyName}";src:url("${fileUrl}") format("truetype");font-display:swap;font-weight:100 900;font-style:normal;}`;
}

export function brandGoogleFontsHref(ids: Array<string | null | undefined>): string | null {
  const families = new Set<string>();
  for (const id of ids) {
    const opt = getBrandFont(id);
    if (opt.googleFamily) families.add(opt.googleFamily);
  }
  if (!families.size) return null;
  const q = Array.from(families)
    .map((f) => `family=${f}`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${q}&display=swap`;
}
