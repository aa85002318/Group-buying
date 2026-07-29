export type ServiceShortcutItem = {
  id: string;
  title: string;
  subtitle?: string;
  icon?: string;
  href?: string;
  sortOrder: number;
  enabled: boolean;
};

export const DEFAULT_SERVICE_SHORTCUTS: ServiceShortcutItem[] = [
  {
    id: "quality",
    title: "嚴選安心食材",
    subtitle: "安心檢驗把關",
    icon: "ShieldCheck",
    href: "/support",
    sortOrder: 10,
    enabled: true,
  },
  {
    id: "shipping",
    title: "快速出貨",
    subtitle: "當日出貨更安心",
    icon: "Truck",
    href: "/support/shipping",
    sortOrder: 20,
    enabled: true,
  },
  {
    id: "pickup",
    title: "門市自取",
    subtitle: "線上下單門市取貨",
    icon: "Store",
    href: "/stores",
    sortOrder: 30,
    enabled: true,
  },
  {
    id: "support",
    title: "專業客服",
    subtitle: "一對一貼心服務",
    icon: "Headphones",
    href: "/support/contact",
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
      return {
        id: String(row.id ?? `svc-${index}`),
        title,
        subtitle: row.subtitle ? String(row.subtitle) : undefined,
        icon: row.icon ? String(row.icon) : "ShieldCheck",
        href: row.href ? String(row.href) : undefined,
        sortOrder: Number(row.sortOrder ?? row.sort_order ?? (index + 1) * 10),
        enabled: row.enabled !== false,
      };
    })
    .filter(Boolean)
    .filter((i) => i!.enabled) as ServiceShortcutItem[];
}
