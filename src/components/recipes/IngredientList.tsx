import type { RecipeIngredient } from "@/lib/types/database";
import Link from "next/link";

export function IngredientList({ ingredients }: { ingredients: RecipeIngredient[] }) {
  if (!ingredients.length) {
    return <p className="text-sm text-foreground-secondary">尚無材料清單</p>;
  }

  const groups = new Map<string, RecipeIngredient[]>();
  for (const ing of ingredients) {
    const key = ing.group_name?.trim() || "材料";
    const list = groups.get(key) ?? [];
    list.push(ing);
    groups.set(key, list);
  }

  return (
    <div className="space-y-4">
      {Array.from(groups.entries()).map(([group, items]) => (
        <div key={group}>
          <h3 className="mb-2 text-sm font-semibold text-caramel">{group}</h3>
          <ul className="divide-y divide-border-soft overflow-hidden rounded-[16px] border border-border-soft bg-surface">
            {items.map((ing: RecipeIngredient) => (
              <li key={ing.id} className="px-4 py-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-foreground">{ing.name}</span>
                  <span className="shrink-0 text-foreground-secondary">
                    {[ing.amount, ing.unit].filter(Boolean).join(" ") || "—"}
                  </span>
                </div>
                {ing.product_id && (
                  <Link
                    href={`/products/${ing.product_id}`}
                    className="mt-1 inline-block text-xs font-medium text-primary hover:underline"
                  >
                    查看相關商品 →
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
