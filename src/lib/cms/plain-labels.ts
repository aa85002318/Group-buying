/**
 * Plain-language labels for CMS layout jargon shown to editors.
 * Stored values (layout_type etc.) stay unchanged — only display text.
 */
export const LAYOUT_TYPE_LABELS: Record<string, string> = {
  grid: "格狀排列",
  carousel: "左右滑動",
  list: "清單",
  "1+2": "一大兩小",
  sidebar: "側欄＋內容",
  full_width: "滿版寬度",
  full_bleed: "滿版大圖",
  icon_row: "圖示列",
  feature_row: "特色說明列",
  search: "搜尋列",
  chip_row: "標籤列",
  comparison: "比較表",
  embed: "嵌入內容",
  footer: "頁尾",
  gallery: "圖片牆",
  split_image_text: "左圖右文",
  tabs: "分頁切換",
  timer: "倒數計時",
  video_lead: "影片開場",
  checkpoint: "步驟重點",
  "1col": "單欄",
  "2col": "雙欄",
  peek: "滑動（露出下一張）",
  bottom_sheet: "底部彈出面板",
};

export function layoutTypeLabel(value: unknown): string | null {
  if (typeof value !== "string" || !value) return null;
  return LAYOUT_TYPE_LABELS[value] ?? value;
}

/** e.g. "格狀排列・每列 5 個・顯示 10 筆" */
export function describeBlockLayout(settings: Record<string, unknown> | undefined): string | null {
  const parts: string[] = [];
  const layout = layoutTypeLabel(settings?.layout_type);
  if (layout) parts.push(layout);
  const cols = settings?.columns;
  if (typeof cols === "number" && cols > 1) parts.push(`每列 ${cols} 個`);
  const limit = settings?.display_limit ?? settings?.display_count;
  if (typeof limit === "number") parts.push(`顯示 ${limit} 筆`);
  return parts.length ? parts.join("・") : null;
}
