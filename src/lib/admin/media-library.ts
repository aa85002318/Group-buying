/** CMS media library — backed by media_assets (+ storage). */

export type MediaAsset = {
  id: string;
  uploaded_by: string | null;
  file_name: string;
  file_url: string;
  mime_type: string | null;
  file_size: number | null;
  folder: string;
  alt_text: string | null;
  created_at: string;
};

export const MEDIA_LIBRARY_FOLDERS = [
  { id: "cms/general", label: "一般" },
  { id: "cms/home", label: "首頁 CMS" },
  { id: "cms/shop", label: "商城 CMS" },
  { id: "cms/banners", label: "Banner" },
  { id: "cms/group-buy", label: "團購" },
  { id: "products", label: "商品" },
] as const;

export type MediaLibraryFolderId = (typeof MEDIA_LIBRARY_FOLDERS)[number]["id"];

export function normalizeMediaFolder(raw: unknown, fallback = "cms/general"): string {
  const v = String(raw ?? "").trim().replace(/^\/+|\/+$/g, "");
  if (!v) return fallback;
  // prevent path traversal into unexpected prefixes
  if (v.includes("..")) return fallback;
  return v.slice(0, 120);
}

export function folderLabel(folder: string): string {
  const hit = MEDIA_LIBRARY_FOLDERS.find((f) => f.id === folder);
  return hit?.label ?? folder;
}
