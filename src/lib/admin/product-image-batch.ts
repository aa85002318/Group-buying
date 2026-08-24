export const IMAGE_BATCH_MAX_BYTES = 10 * 1024 * 1024;
export const ZIP_MAX_BYTES = 32 * 1024 * 1024;
export const ZIP_MAX_FILES = 80;
export const ZIP_MAX_UNCOMPRESSED = 80 * 1024 * 1024;
export const IMAGE_MIN_EDGE = 200;
export const IMAGE_MAX_EDGE = 2000;
export const IMAGE_BATCH_ALLOWED = ["image/jpeg", "image/png", "image/webp"] as const;
export const IMAGE_NAME_RE = /^(.+)_(\d{2})\.(jpe?g|png|webp)$/i;
export const TEMP_PREFIX = "product-image-imports";

export type ImageUpdateMode = "fill_missing" | "main_only" | "append_gallery" | "replace_all";

export type ParsedImageName = {
  sku: string;
  sequence: number;
  isMain: boolean;
};

export function parseSkuImageName(fileName: string): ParsedImageName | null {
  const base = fileName.split(/[/\\]/).pop() ?? fileName;
  const m = base.match(IMAGE_NAME_RE);
  if (!m) return null;
  const sku = m[1];
  const sequence = Number(m[2]);
  if (!sku || !Number.isFinite(sequence) || sequence < 1) return null;
  return { sku, sequence, isMain: sequence === 1 };
}

export function isAllowedImageMime(mime: string, name: string): boolean {
  const lower = name.toLowerCase();
  if (/\.(svg|html?|js|mjs|exe|php|sh|bat|cmd)$/i.test(lower)) return false;
  return (IMAGE_BATCH_ALLOWED as readonly string[]).includes(mime) ||
    (mime === "application/octet-stream" && /\.(jpe?g|png|webp)$/i.test(name));
}

export function defaultAlt(productName: string, sequence: number): string {
  return sequence <= 1 ? `${productName}－商品圖片` : `${productName}－商品圖片 ${sequence}`;
}

function urlBaseName(url: string): string {
  try {
    return decodeURIComponent((url.split("?")[0] ?? "").split("/").pop() ?? "").toLowerCase();
  } catch {
    return "";
  }
}

export type ProductImageState = {
  image_url: string | null;
  images: string[];
};

export function planImageUpdate(
  current: ProductImageState,
  incoming: { url: string; sequence: number; fileName: string; alt?: string }[],
  mode: ImageUpdateMode
): { nextMain: string | null; nextGallery: string[]; addedMain: number; addedGallery: number; replaced: number } {
  const sorted = [...incoming].sort((a, b) => a.sequence - b.sequence);
  const mainIncoming = sorted.find((i) => i.sequence === 1)?.url ?? null;
  const galleryIncoming = sorted.filter((i) => i.sequence > 1).map((i) => i.url);
  const currentGallery = (current.images ?? []).filter((u) => u && u !== current.image_url);
  const existingNames = new Set(
    [current.image_url, ...currentGallery].filter(Boolean).map((u) => urlBaseName(String(u)))
  );

  if (mode === "replace_all") {
    return {
      nextMain: mainIncoming ?? galleryIncoming[0] ?? null,
      nextGallery: mainIncoming ? galleryIncoming : galleryIncoming.slice(1),
      addedMain: mainIncoming ? 1 : 0,
      addedGallery: galleryIncoming.length,
      replaced: (current.image_url ? 1 : 0) + currentGallery.length,
    };
  }

  if (mode === "main_only") {
    return {
      nextMain: mainIncoming ?? current.image_url,
      nextGallery: currentGallery,
      addedMain: mainIncoming && mainIncoming !== current.image_url ? 1 : 0,
      addedGallery: 0,
      replaced: mainIncoming && current.image_url && mainIncoming !== current.image_url ? 1 : 0,
    };
  }

  if (mode === "append_gallery") {
    const extra = sorted
      .filter((i) => i.sequence > 1 || (i.sequence === 1 && current.image_url))
      .map((i) => i.url)
      .filter((u) => u !== current.image_url && !currentGallery.includes(u));
    return {
      nextMain: current.image_url,
      nextGallery: [...currentGallery, ...extra],
      addedMain: 0,
      addedGallery: extra.length,
      replaced: 0,
    };
  }

  const nextMain = current.image_url || mainIncoming;
  const extra = sorted
    .filter((i) => i.sequence > 1)
    .filter((i) => i.url !== nextMain && !currentGallery.includes(i.url) && !existingNames.has(i.fileName.toLowerCase()))
    .map((i) => i.url);
  return {
    nextMain,
    nextGallery: [...currentGallery, ...extra],
    addedMain: !current.image_url && mainIncoming ? 1 : 0,
    addedGallery: extra.length,
    replaced: 0,
  };
}

export const JOB_STATUS_LABEL: Record<string, string> = {
  pending: "等待處理",
  uploading: "上傳中",
  processing: "圖片處理中",
  writing: "寫入資料中",
  previewed: "已預覽",
  completed: "完成",
  partial: "部分失敗",
  failed: "失敗",
  cancelled: "已取消",
};
