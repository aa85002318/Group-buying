/**
 * Content settings for the website-home blocks added with the new layout
 * (首頁效果圖). Everything lives in homepage_blocks.config — no schema change.
 */

import { DESKTOP_IP_ANGEL_PNG } from "@/lib/desktop/brand-assets";

function rec(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}
function str(v: unknown, fallback = ""): string {
  return typeof v === "string" && v.trim() ? v : fallback;
}
function strList(v: unknown, fallback: string[]): string[] {
  if (!Array.isArray(v)) return fallback;
  const out = v.map((x) => (typeof x === "string" ? x.trim() : "")).filter(Boolean);
  return out.length ? out : v.length === 0 ? [] : fallback;
}

/* 搜尋列 --------------------------------------------------------------- */

export const DEFAULT_SEARCH_PLACEHOLDER = "今天想做什麼？搜尋商品、食譜、烘焙知識…";

export function searchPlaceholder(config: Record<string, unknown> | null | undefined) {
  return str(rec(config).placeholder, DEFAULT_SEARCH_PLACEHOLDER);
}

/* 一鍵買齊材料 --------------------------------------------------------- */

export const DEFAULT_INGREDIENT_HINT = "喜歡這道食譜？材料也幫你準備好了 ↓";

/* AI 烘焙小幫手 -------------------------------------------------------- */

export type AiSectionSettings = {
  badge: string;
  body: string;
  chips: string[];
  buttonText: string;
  href: string;
  imageUrl: string;
};

export const DEFAULT_AI_SECTION: AiSectionSettings = {
  badge: "CHIMEIDIY AI",
  body: "材料推薦、份量換算、失敗分析，\n陪你解決每一個烘焙問題。",
  chips: ["材料推薦", "份量換算", "失敗分析"],
  buttonText: "開始提問",
  href: "/ai",
  imageUrl: DESKTOP_IP_ANGEL_PNG,
};

export function parseAiSection(config: Record<string, unknown> | null | undefined): AiSectionSettings {
  const c = rec(config);
  return {
    badge: str(c.badge, DEFAULT_AI_SECTION.badge),
    body: str(c.body, DEFAULT_AI_SECTION.body),
    chips: strList(c.chips, DEFAULT_AI_SECTION.chips),
    buttonText: str(c.button_text, DEFAULT_AI_SECTION.buttonText),
    href: str(c.link_url, DEFAULT_AI_SECTION.href),
    imageUrl: str(c.image_url, DEFAULT_AI_SECTION.imageUrl),
  };
}

/* 大安門市 + 企業採購 -------------------------------------------------- */

export type StoreB2bSettings = {
  store: {
    eyebrow: string;
    name: string;
    address: string;
    tags: string[];
    linkText: string;
    href: string;
    /** Empty = use the store's photo from 門市管理. */
    imageUrl: string;
  };
  b2b: {
    enabled: boolean;
    eyebrow: string;
    title: string;
    tags: string[];
    note: string;
    buttonText: string;
    href: string;
  };
};

export const DEFAULT_STORE_B2B: StoreB2bSettings = {
  store: {
    eyebrow: "實體門市",
    name: "大安門市",
    address: "台北市大安區復興南路二段292號",
    tags: ["到店選購", "門市取貨"],
    linkText: "查看門市資訊",
    href: "/stores",
    imageUrl: "",
  },
  b2b: {
    enabled: true,
    eyebrow: "企業採購 / B2B",
    title: "大量採購，專人服務",
    tags: ["咖啡廳", "麵包店", "餐飲業者", "企業採購"],
    note: "雙北滿額配送",
    buttonText: "立即詢價",
    href: "/corporate",
  },
};

export function parseStoreB2b(config: Record<string, unknown> | null | undefined): StoreB2bSettings {
  const c = rec(config);
  const s = rec(c.store);
  const b = rec(c.b2b);
  const d = DEFAULT_STORE_B2B;
  return {
    store: {
      eyebrow: str(s.eyebrow, d.store.eyebrow),
      name: str(s.name, d.store.name),
      address: str(s.address, d.store.address),
      tags: strList(s.tags, d.store.tags),
      linkText: str(s.link_text, d.store.linkText),
      href: str(s.link_url, d.store.href),
      imageUrl: str(s.image_url, ""),
    },
    b2b: {
      enabled: b.enabled !== false,
      eyebrow: str(b.eyebrow, d.b2b.eyebrow),
      title: str(b.title, d.b2b.title),
      tags: strList(b.tags, d.b2b.tags),
      note: str(b.note, d.b2b.note),
      buttonText: str(b.button_text, d.b2b.buttonText),
      href: str(b.link_url, d.b2b.href),
    },
  };
}

/** Comma / 、 separated text ⇄ list (admin fields). */
export function listToText(list: string[]) {
  return list.join("、");
}
export function textToList(text: string) {
  return text
    .split(/[、,，\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}
