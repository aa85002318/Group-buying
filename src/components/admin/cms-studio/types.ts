export type CmsDevice = "mobile" | "tablet" | "desktop";

export const CMS_DEVICE_SIZE: Record<
  CmsDevice,
  { width: number; height: number; label: string }
> = {
  mobile: { width: 390, height: 844, label: "手機" },
  tablet: { width: 768, height: 1024, label: "平板" },
  desktop: { width: 1440, height: 900, label: "桌機" },
};

export type CmsSaveStatus =
  | "idle"
  | "dirty"
  | "saving"
  | "saved"
  | "published"
  | "error";

export const CMS_SAVE_STATUS_LABEL: Record<CmsSaveStatus, string> = {
  idle: "已同步",
  dirty: "尚未儲存",
  saving: "自動儲存中…",
  saved: "草稿已儲存",
  published: "已發布",
  error: "儲存失敗",
};
