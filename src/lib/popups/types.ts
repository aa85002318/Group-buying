/** 首頁彈跳公告 — types, link helpers, dismiss keys */

export type HomepagePopupStatus = "draft" | "scheduled" | "active" | "ended" | "disabled";
export type HomepagePopupPriority = "emergency" | "high" | "normal" | "low";
export type HomepagePopupAudience = "all" | "guest" | "member";
export type HomepagePopupDisplayScope = "home_only" | "site_first_open";
export type HomepagePopupLinkType =
  | "internal"
  | "external"
  | "product"
  | "category"
  | "group_buy"
  | "recipe"
  | "article"
  | "news"
  | "video"
  | "course"
  | "ai_tools"
  | "member"
  | "support"
  | "custom";

export type HomepagePopupEventType = "view" | "click" | "close" | "dismiss_today";

export interface HomepagePopup {
  id: string;
  internal_name: string;
  title: string;
  description: string | null;
  desktop_image_url: string | null;
  mobile_image_url: string | null;
  button_text: string;
  link_type: HomepagePopupLinkType;
  link_url: string | null;
  linked_resource_id: string | null;
  display_scope: HomepagePopupDisplayScope;
  audience_type: HomepagePopupAudience;
  priority: HomepagePopupPriority;
  priority_rank: number;
  allow_close: boolean;
  allow_close_on_backdrop: boolean;
  allow_dismiss_today: boolean;
  dismiss_after_click: boolean;
  starts_at: string | null;
  ends_at: string | null;
  status: HomepagePopupStatus;
  view_count: number;
  click_count: number;
  close_count: number;
  dismiss_today_count: number;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export const PRIORITY_RANK: Record<HomepagePopupPriority, number> = {
  emergency: 100,
  high: 80,
  normal: 50,
  low: 20,
};

export const PRIORITY_LABELS: Record<HomepagePopupPriority, string> = {
  emergency: "緊急",
  high: "高",
  normal: "一般",
  low: "低",
};

export const STATUS_LABELS: Record<HomepagePopupStatus, string> = {
  draft: "草稿",
  scheduled: "排程中",
  active: "顯示中",
  ended: "已結束",
  disabled: "停用",
};

export const LINK_TYPE_OPTIONS: Array<{ value: HomepagePopupLinkType; label: string; pathHint?: string }> = [
  { value: "internal", label: "自訂 App 內路徑", pathHint: "/shop" },
  { value: "external", label: "外部網址", pathHint: "https://" },
  { value: "product", label: "商品頁", pathHint: "/products/{id}" },
  { value: "category", label: "商品分類", pathHint: "/baking-materials/{slug}" },
  { value: "group_buy", label: "團購活動", pathHint: "/group-buy/{id}" },
  { value: "recipe", label: "食譜", pathHint: "/recipes/{slug}" },
  { value: "article", label: "文章", pathHint: "/articles/{slug}" },
  { value: "news", label: "最新資訊", pathHint: "/news/{slug}" },
  { value: "video", label: "影音", pathHint: "/videos/{id}" },
  { value: "course", label: "課程", pathHint: "/courses/{id}" },
  { value: "ai_tools", label: "AI 工具", pathHint: "/ai-tools" },
  { value: "member", label: "會員中心", pathHint: "/member" },
  { value: "support", label: "客服中心", pathHint: "/support" },
  { value: "custom", label: "自訂路徑", pathHint: "/" },
];

export function todayKeyTaipei(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function popupDismissStorageKey(popupId: string, day = todayKeyTaipei()): string {
  return `chimeidiy_popup_dismissed_${popupId}_${day}`;
}

export const POPUP_SESSION_SHOWN_KEY = "chimeidiy_popup_shown_session";

/** Validate link — block javascript: and require https for external */
export function validatePopupLink(
  linkType: HomepagePopupLinkType,
  linkUrl: string | null | undefined
): { ok: true; url: string } | { ok: false; error: string } {
  const raw = (linkUrl ?? "").trim();
  if (!raw) {
    if (linkType === "ai_tools") return { ok: true, url: "/ai-tools" };
    if (linkType === "member") return { ok: true, url: "/member" };
    if (linkType === "support") return { ok: true, url: "/support" };
    return { ok: false, error: "請填寫連結網址" };
  }
  const lower = raw.toLowerCase();
  if (lower.startsWith("javascript:") || lower.startsWith("data:")) {
    return { ok: false, error: "不允許的連結協定" };
  }
  if (linkType === "external") {
    if (!/^https:\/\//i.test(raw)) {
      return { ok: false, error: "外部連結須以 https:// 開頭" };
    }
    return { ok: true, url: raw };
  }
  if (raw.startsWith("/")) return { ok: true, url: raw };
  if (/^https:\/\//i.test(raw)) return { ok: true, url: raw };
  return { ok: false, error: "內部路徑請以 / 開頭" };
}

export function resolvePopupHref(popup: Pick<HomepagePopup, "link_type" | "link_url" | "linked_resource_id">): string | null {
  const type = popup.link_type;
  const id = popup.linked_resource_id?.trim();
  if (type === "ai_tools") return "/ai-tools";
  if (type === "member") return "/member";
  if (type === "support") return "/support";
  if (id) {
    if (type === "product") return `/products/${id}`;
    if (type === "category") return `/baking-materials/${id}`;
    if (type === "group_buy") return `/group-buy/${id}`;
    if (type === "recipe") return `/recipes/${id}`;
    if (type === "article") return `/articles/${id}`;
    if (type === "news") return `/news/${id}`;
    if (type === "video") return `/videos/${id}`;
    if (type === "course") return `/courses/${id}`;
  }
  const validated = validatePopupLink(type, popup.link_url);
  return validated.ok ? validated.url : null;
}

export function computeDisplayStatus(
  popup: Pick<HomepagePopup, "status" | "starts_at" | "ends_at">,
  now = new Date()
): HomepagePopupStatus {
  if (popup.status === "draft" || popup.status === "disabled") return popup.status;
  const start = popup.starts_at ? new Date(popup.starts_at) : null;
  const end = popup.ends_at ? new Date(popup.ends_at) : null;
  if (end && !Number.isNaN(end.getTime()) && now > end) return "ended";
  if (start && !Number.isNaN(start.getTime()) && now < start) return "scheduled";
  if (popup.status === "active" || popup.status === "scheduled") return "active";
  return popup.status;
}

export function isPopupCurrentlyVisible(
  popup: Pick<HomepagePopup, "status" | "starts_at" | "ends_at">,
  now = new Date()
): boolean {
  if (popup.status !== "active" && popup.status !== "scheduled") {
    // Only `active` is intentionally shown; scheduled waits for starts_at via compute
  }
  const display = computeDisplayStatus(popup, now);
  return display === "active" && (popup.status === "active" || popup.status === "scheduled");
}

/** Eligible for public show: status active, within schedule */
export function isEligibleActivePopup(
  popup: Pick<HomepagePopup, "status" | "starts_at" | "ends_at">,
  now = new Date()
): boolean {
  if (popup.status !== "active") return false;
  if (popup.starts_at && new Date(popup.starts_at) > now) return false;
  if (popup.ends_at && new Date(popup.ends_at) < now) return false;
  return true;
}

export function clickRate(views: number, clicks: number): string {
  if (views <= 0) return "—";
  return `${((clicks / views) * 100).toFixed(1)}%`;
}
