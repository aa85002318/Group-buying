import type { ProductCategory } from "@/lib/types/database";

export type CategoryTreeNode = {
  category: ProductCategory;
  children: CategoryTreeNode[];
};

function sortCategories(a: ProductCategory, b: ProductCategory) {
  const ao = Number(a.sort_order ?? 0);
  const bo = Number(b.sort_order ?? 0);
  if (ao !== bo) return ao - bo;
  return a.name.localeCompare(b.name, "zh-TW");
}

/** Parent → children tree, sorted by sort_order then name. */
export function buildCategoryTree(categories: ProductCategory[]): CategoryTreeNode[] {
  const active = categories.filter((c) => c.is_active !== false);
  const ids = new Set(active.map((c) => c.id));
  const byParent = new Map<string | null, ProductCategory[]>();

  for (const c of active) {
    const parentId = c.parent_id && ids.has(c.parent_id) ? c.parent_id : null;
    const list = byParent.get(parentId) ?? [];
    list.push(c);
    byParent.set(parentId, list);
  }

  const walk = (parentId: string | null): CategoryTreeNode[] => {
    const list = (byParent.get(parentId) ?? []).slice().sort(sortCategories);
    return list.map((category) => ({
      category,
      children: walk(category.id),
    }));
  };

  return walk(null);
}

export type FlatCategoryRow = {
  category: ProductCategory;
  depth: number;
  label: string;
  parentName: string | null;
};

/** Depth-first rows: 大分類 then its 小分類, then 細分類. */
export function flattenCategoryTree(
  tree: CategoryTreeNode[],
  startDepth = 0
): FlatCategoryRow[] {
  const rows: FlatCategoryRow[] = [];

  const walk = (nodes: CategoryTreeNode[], depth: number, parentName: string | null) => {
    for (const node of nodes) {
      const prefix = depth === 0 ? "" : `${"　".repeat(Math.max(0, depth - 1))}└ `;
      rows.push({
        category: node.category,
        depth,
        label: `${prefix}${node.category.name}`,
        parentName,
      });
      walk(node.children, depth + 1, node.category.name);
    }
  };

  walk(tree, startDepth, null);
  return rows;
}

export function sortNamedOptions<T extends { name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name, "zh-TW"));
}
