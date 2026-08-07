/** Unified Canvas CMS shared types (Phase 1+). */

export type CmsDevice = "desktop" | "tablet" | "mobile";

export type CmsPageType =
  | "home"
  | "shop"
  | "category"
  | "product_template"
  | "recipes"
  | "recipe_category"
  | "recipe_template"
  | "group_buy"
  | "member"
  | "ai_assistant"
  | "article"
  | "global_component"
  | "custom";

export type CmsPageStatus = "draft" | "published" | "disabled" | "unset";

export type CmsPublishState =
  | "local_dirty"
  | "draft_saved"
  | "unpublished_changes"
  | "published"
  | "publish_failed"
  | "unset";

export type CmsBlockCategory =
  | "basic"
  | "nav"
  | "product"
  | "recipe"
  | "group_buy"
  | "member"
  | "service"
  | "global";

export interface CmsPageSettings {
  headerId?: string;
  navigationId?: string;
  footerId?: string;
  showBottomNavigation?: boolean;
  requireAuthentication?: boolean;
  seo?: {
    title?: string;
    description?: string;
    ogImage?: string;
    canonicalUrl?: string;
    indexable?: boolean;
  };
}

export interface CmsBlock {
  id: string;
  type: string;
  name: string;
  enabled: boolean;
  locked?: boolean;
  order: number;
  settings: Record<string, unknown>;
  responsiveSettings?: {
    desktop?: Record<string, unknown>;
    tablet?: Record<string, unknown>;
    mobile?: Record<string, unknown>;
  };
  sharedBlockId?: string;
  schedule?: {
    startsAt?: string;
    endsAt?: string;
  };
  /** Legacy source key (homepage block_key / shop section id) */
  sourceKey?: string;
}

export interface CmsPage {
  id: string;
  name: string;
  slug: string;
  pageType: CmsPageType;
  status: CmsPageStatus;
  blocks: CmsBlock[];
  settings: CmsPageSettings;
  draftVersion?: number;
  publishedVersion?: number;
  updatedAt?: string;
  publishedAt?: string;
  /** Frontend path for preview */
  previewPath?: string;
  /** Admin edit route (legacy studio or new canvas) */
  editHref?: string;
  publishState?: CmsPublishState;
  blockCount?: number;
  categoryGroup?: string;
  systemRequired?: boolean;
  hasLayoutCms?: boolean;
}

export type CmsSaveStatus =
  | "idle"
  | "dirty"
  | "saving"
  | "saved"
  | "published"
  | "error";

export const CMS_DEVICE_SIZE: Record<
  CmsDevice,
  { width: number; height: number; label: string }
> = {
  mobile: { width: 390, height: 844, label: "手機" },
  tablet: { width: 768, height: 1024, label: "平板" },
  desktop: { width: 1440, height: 900, label: "桌機" },
};

export const CMS_SAVE_STATUS_LABEL: Record<CmsSaveStatus, string> = {
  idle: "已同步",
  dirty: "有未儲存變更",
  saving: "儲存中…",
  saved: "草稿已儲存",
  published: "已發布",
  error: "儲存失敗",
};

export const CMS_BRAND_COLORS = [
  { id: "sun", label: "陽光主黃", value: "#FFD454" },
  { id: "warm", label: "暖白", value: "#FFFEFA" },
  { id: "navy", label: "品牌深藍", value: "#153E73" },
  { id: "coral", label: "珊瑚紅", value: "#F16458" },
  { id: "sky", label: "天空藍", value: "#79C7E8" },
  { id: "skySoft", label: "淡天空藍", value: "#EEF8FC" },
  { id: "cream", label: "淡奶油黃", value: "#FFF5CC" },
  { id: "white", label: "白色", value: "#FFFFFF" },
] as const;
