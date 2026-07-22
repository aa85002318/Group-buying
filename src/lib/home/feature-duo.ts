import { APP_ROUTES } from "@/lib/site-links";

export type FeatureDuoLinkTarget = "_self" | "_blank";

export type HomeFeatureDuoItem = {
  id: string;
  slot_key: string;
  title: string;
  image_url: string | null;
  link_url: string;
  link_target: FeatureDuoLinkTarget;
  alt_text: string | null;
  notes?: string | null;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

/** 建議上傳尺寸（滿版雙卡） */
export const FEATURE_DUO_IMAGE_SPEC = {
  width: 720,
  height: 420,
  ratioLabel: "12:7",
  formats: "JPG / PNG / WebP",
  maxSizeLabel: "建議 500KB 以內",
  hint: "建議尺寸 720×420 px（比例約 12:7）。圖片會滿版裁切顯示，請勿在圖上加文字說明。",
} as const;

export const DEFAULT_HOME_FEATURE_DUO_ITEMS: HomeFeatureDuoItem[] = [
  {
    id: "default-ai",
    slot_key: "ai",
    title: "AI 助手",
    image_url: "/branding/feature-duo-ai.png",
    link_url: APP_ROUTES.aiTools,
    link_target: "_self",
    alt_text: "AI 助手",
    sort_order: 10,
    is_active: true,
  },
  {
    id: "default-live",
    slot_key: "live",
    title: "直播資訊",
    image_url: "/branding/feature-duo-live.png",
    link_url: APP_ROUTES.live,
    link_target: "_self",
    alt_text: "直播資訊",
    sort_order: 20,
    is_active: true,
  },
];

export function normalizeFeatureDuoItem(
  raw: Partial<HomeFeatureDuoItem> & { id?: string }
): HomeFeatureDuoItem {
  const target = raw.link_target === "_blank" ? "_blank" : "_self";
  return {
    id: raw.id ?? `item-${Date.now()}`,
    slot_key: String(raw.slot_key ?? "").trim() || `slot-${Date.now()}`,
    title: String(raw.title ?? "").trim(),
    image_url: raw.image_url?.trim() || null,
    link_url: String(raw.link_url ?? "").trim(),
    link_target: target,
    alt_text: raw.alt_text?.trim() || null,
    notes: raw.notes?.trim() || null,
    sort_order: Number(raw.sort_order ?? 0),
    is_active: raw.is_active !== false,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
}
