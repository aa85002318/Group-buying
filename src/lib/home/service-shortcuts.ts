const ASSET = "/images/home/service-shortcuts";

/** Suggested CMS upload size for 1:1 shortcut buttons. */
export const SERVICE_SHORTCUT_IMAGE_SIZE = {
  width: 512,
  height: 512,
  retinaWidth: 1024,
  retinaHeight: 1024,
  label: "512×512 或 1024×1024（1:1，PNG／WebP／SVG，透明底）",
} as const;

export type ServiceShortcutItem = {
  id: string;
  title: string;
  subtitle?: string;
  /** Illustration / IP — always object-fit: contain inside 1:1 safe area */
  imageUrl?: string;
  /**
   * When true (default for full-art PNGs), title/subtitle are baked into the image
   * and not rendered again as HTML. Set false for icon-only uploads.
   */
  labelsInImage?: boolean;
  /** Legacy lucide key (fallback when imageUrl missing) */
  icon?: string;
  href?: string;
  backgroundColor?: string;
  sortOrder: number;
  enabled: boolean;
};

export const DEFAULT_SERVICE_SHORTCUTS: ServiceShortcutItem[] = [
  {
    id: "quality",
    title: "安心食材",
    subtitle: "安心檢驗把關",
    imageUrl: `${ASSET}/safe-food.png`,
    labelsInImage: true,
    icon: "ShieldCheck",
    href: "/products",
    backgroundColor: "#FFFFFF",
    sortOrder: 10,
    enabled: true,
  },
  {
    id: "shipping",
    title: "快速出貨",
    subtitle: "當日出貨更安心",
    imageUrl: `${ASSET}/fast-ship.png`,
    labelsInImage: true,
    icon: "Truck",
    href: "/support/shipping",
    backgroundColor: "#FFFFFF",
    sortOrder: 20,
    enabled: true,
  },
  {
    id: "pickup",
    title: "門市自取",
    subtitle: "線上下單門市取貨",
    imageUrl: `${ASSET}/store-pickup.png`,
    labelsInImage: true,
    icon: "Store",
    href: "/stores",
    backgroundColor: "#FFFFFF",
    sortOrder: 30,
    enabled: true,
  },
  {
    id: "support",
    title: "專業客服",
    subtitle: "一對一貼心服務",
    imageUrl: `${ASSET}/support.png`,
    labelsInImage: true,
    icon: "Headphones",
    href: "/support",
    backgroundColor: "#FFFFFF",
    sortOrder: 40,
    enabled: true,
  },
];

export function parseServiceShortcuts(
  config: Record<string, unknown> | null | undefined
): ServiceShortcutItem[] {
  const raw = config?.items;
  if (!Array.isArray(raw) || raw.length === 0) return DEFAULT_SERVICE_SHORTCUTS;
  return raw
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const title = String(row.title ?? "").trim();
      if (!title) return null;
      const fallback = DEFAULT_SERVICE_SHORTCUTS[index];
      return {
        id: String(row.id ?? fallback?.id ?? `svc-${index}`),
        title,
        subtitle: row.subtitle ? String(row.subtitle) : fallback?.subtitle,
        imageUrl: row.imageUrl
          ? String(row.imageUrl)
          : row.image_url
            ? String(row.image_url)
            : fallback?.imageUrl,
        labelsInImage:
          typeof row.labelsInImage === "boolean"
            ? row.labelsInImage
            : typeof row.labels_in_image === "boolean"
              ? row.labels_in_image
              : fallback?.labelsInImage ?? false,
        icon: row.icon ? String(row.icon) : fallback?.icon ?? "ShieldCheck",
        href: row.href ? String(row.href) : fallback?.href,
        backgroundColor: row.backgroundColor
          ? String(row.backgroundColor)
          : row.background_color
            ? String(row.background_color)
            : fallback?.backgroundColor ?? "#FFFFFF",
        sortOrder: Number(row.sortOrder ?? row.sort_order ?? (index + 1) * 10),
        enabled: row.enabled !== false,
      };
    })
    .filter(Boolean)
    .filter((i) => i!.enabled)
    .sort((a, b) => a!.sortOrder - b!.sortOrder) as ServiceShortcutItem[];
}
