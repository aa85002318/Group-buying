/** Category chip menu above product / group-buy rails. */

export type HomeCategoryMenuItem = {
  id: string;
  label: string;
  href: string;
  categoryId?: string | null;
  enabled: boolean;
  sortOrder: number;
};

export function parseCategoryMenu(
  config: Record<string, unknown> | null | undefined,
  key = "category_menu"
): HomeCategoryMenuItem[] {
  const raw = config?.[key];
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const label = String(row.label ?? "").trim();
      const href = String(row.href ?? "").trim();
      if (!label || !href) return null;
      return {
        id: String(row.id ?? `cat-menu-${index}`).trim() || `cat-menu-${index}`,
        label,
        href,
        categoryId: row.categoryId
          ? String(row.categoryId)
          : row.category_id
            ? String(row.category_id)
            : null,
        enabled: row.enabled !== false,
        sortOrder:
          Number(row.sortOrder ?? row.sort_order ?? (index + 1) * 10) ||
          (index + 1) * 10,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a!.sortOrder - b!.sortOrder) as HomeCategoryMenuItem[];
}

export function enabledCategoryMenu(
  items: HomeCategoryMenuItem[]
): HomeCategoryMenuItem[] {
  return items.filter((i) => i.enabled);
}
