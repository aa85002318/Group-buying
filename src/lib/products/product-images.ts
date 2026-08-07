export type ProductImageType = "main" | "gallery" | "content";
export type ProductImageWidthMode = "full" | "three_quarters" | "half";

export type ProductImageItem = {
  id?: string;
  url: string;
  alt_text: string;
  caption?: string;
  width_mode?: ProductImageWidthMode;
  sort_order: number;
  image_type: ProductImageType;
};

export const PRODUCT_IMAGE_FALLBACK = "/images/product-placeholder.svg";

export const MAIN_IMAGE_MAX_BYTES = 2 * 1024 * 1024;
export const GALLERY_IMAGE_MAX_BYTES = 2 * 1024 * 1024;
export const CONTENT_IMAGE_MAX_BYTES = 3 * 1024 * 1024;
export const GALLERY_MAX_COUNT = 8;
export const CONTENT_MAX_COUNT = 20;

export function isAllowedProductImageType(mime: string) {
  return ["image/jpeg", "image/png", "image/webp"].includes(mime);
}

export function widthModeClass(mode?: ProductImageWidthMode) {
  switch (mode) {
    case "half":
      return "w-full md:w-1/2 md:mx-auto";
    case "three_quarters":
      return "w-full md:w-3/4 md:mx-auto";
    default:
      return "w-full";
  }
}

/** Build display gallery: main first, then gallery URLs (deduped). */
export function resolveProductGallery(input: {
  image_url?: string | null;
  images?: unknown;
  product_images?: Array<{
    image_url?: string;
    url?: string;
    image_type?: string;
    alt_text?: string | null;
    sort_order?: number;
    is_active?: boolean;
  }> | null;
}): { url: string; alt: string }[] {
  const fromTable = (input.product_images ?? [])
    .filter((r) => r.is_active !== false)
    .filter((r) => r.image_type === "main" || r.image_type === "gallery" || !r.image_type)
    .sort((a, b) => {
      const typeRank = (t?: string) => (t === "main" ? 0 : 1);
      const tr = typeRank(a.image_type) - typeRank(b.image_type);
      if (tr !== 0) return tr;
      return (a.sort_order ?? 0) - (b.sort_order ?? 0);
    })
    .map((r) => ({
      url: String(r.image_url || r.url || "").trim(),
      alt: String(r.alt_text ?? "").trim(),
    }))
    .filter((r) => r.url);

  if (fromTable.length > 0) {
    const seen = new Set<string>();
    return fromTable.filter((r) => {
      if (seen.has(r.url)) return false;
      seen.add(r.url);
      return true;
    });
  }

  const list: string[] = [];
  if (input.image_url) list.push(String(input.image_url));
  if (Array.isArray(input.images)) {
    for (const item of input.images) {
      if (typeof item === "string" && item.trim()) list.push(item.trim());
      else if (item && typeof item === "object" && "url" in item) {
        const u = String((item as { url?: string }).url ?? "").trim();
        if (u) list.push(u);
      }
    }
  }
  const seen = new Set<string>();
  return list
    .filter((u) => {
      if (seen.has(u)) return false;
      seen.add(u);
      return true;
    })
    .map((url) => ({ url, alt: "" }));
}

export function resolveContentImages(input: {
  content_images?: unknown;
  product_images?: Array<{
    image_url?: string;
    url?: string;
    image_type?: string;
    alt_text?: string | null;
    caption?: string | null;
    width_mode?: string | null;
    sort_order?: number;
    is_active?: boolean;
  }> | null;
}): ProductImageItem[] {
  const fromTable = (input.product_images ?? [])
    .filter((r) => r.is_active !== false && r.image_type === "content")
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((r, i) => ({
      url: String(r.image_url || r.url || "").trim(),
      alt_text: String(r.alt_text ?? "").trim(),
      caption: String(r.caption ?? "").trim(),
      width_mode: (r.width_mode as ProductImageWidthMode) || "full",
      sort_order: r.sort_order ?? i,
      image_type: "content" as const,
    }))
    .filter((r) => r.url);

  if (fromTable.length > 0) return fromTable;

  if (!Array.isArray(input.content_images)) return [];
  return input.content_images
    .map((item, i) => {
      if (typeof item === "string") {
        return {
          url: item.trim(),
          alt_text: "",
          caption: "",
          width_mode: "full" as const,
          sort_order: i,
          image_type: "content" as const,
        };
      }
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const url = String(row.url ?? row.image_url ?? "").trim();
      if (!url) return null;
      return {
        url,
        alt_text: String(row.alt_text ?? "").trim(),
        caption: String(row.caption ?? "").trim(),
        width_mode: (String(row.width_mode ?? "full") as ProductImageWidthMode) || "full",
        sort_order: Number(row.sort_order) || i,
        image_type: "content" as const,
      };
    })
    .filter(Boolean) as ProductImageItem[];
}

/** Split flat URL list (legacy form.images) into main + gallery. */
export function splitLegacyImages(images: string[]): {
  main: ProductImageItem | null;
  gallery: ProductImageItem[];
} {
  const cleaned = images.map((u) => u.trim()).filter(Boolean);
  if (cleaned.length === 0) return { main: null, gallery: [] };
  const [first, ...rest] = cleaned;
  return {
    main: {
      url: first,
      alt_text: "",
      sort_order: 0,
      image_type: "main",
    },
    gallery: rest.slice(0, GALLERY_MAX_COUNT).map((url, i) => ({
      url,
      alt_text: "",
      sort_order: i,
      image_type: "gallery" as const,
    })),
  };
}

export function mergeMainGalleryToImages(
  main: ProductImageItem | null,
  gallery: ProductImageItem[]
): string[] {
  const urls: string[] = [];
  if (main?.url) urls.push(main.url);
  for (const g of gallery) {
    if (g.url && !urls.includes(g.url)) urls.push(g.url);
  }
  return urls;
}
