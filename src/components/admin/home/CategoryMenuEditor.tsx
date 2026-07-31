"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { HomeCategoryMenuItem } from "@/lib/home/category-menu";

export function CategoryMenuEditor({
  items,
  onChange,
  onSave,
  saving,
  hint = "商品上方分類選單：可指定站內分類連結（如 /baking-materials/flour）。",
}: {
  items: HomeCategoryMenuItem[];
  onChange: (next: HomeCategoryMenuItem[]) => void;
  onSave: () => void;
  saving?: boolean;
  hint?: string;
}) {
  const update = (index: number, patch: Partial<HomeCategoryMenuItem>) => {
    const next = [...items];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  return (
    <div className="space-y-3 rounded-xl border border-border bg-white p-3">
      <p className="text-xs font-medium text-muted-foreground">{hint}</p>
      {items.map((item, index) => (
        <div
          key={item.id}
          className="grid gap-2 rounded-lg border border-border/70 p-2 sm:grid-cols-2"
        >
          <Input
            value={item.label}
            onChange={(e) => update(index, { label: e.target.value })}
            placeholder="顯示名稱"
          />
          <Input
            value={item.href}
            onChange={(e) => update(index, { href: e.target.value })}
            placeholder="分類連結"
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={item.enabled !== false}
              onChange={(e) => update(index, { enabled: e.target.checked })}
            />
            啟用
          </label>
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onChange(items.filter((_, i) => i !== index))}
            >
              <Trash2 className="h-4 w-4 text-danger" />
            </Button>
          </div>
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() =>
            onChange([
              ...items,
              {
                id: `cm-${Date.now()}`,
                label: "新分類",
                href: "/baking-materials",
                enabled: true,
                sortOrder: (items.length + 1) * 10,
              },
            ])
          }
        >
          <Plus className="mr-1 h-4 w-4" />
          新增分類
        </Button>
        <Button type="button" size="sm" disabled={saving} onClick={onSave}>
          儲存分類選單
        </Button>
      </div>
    </div>
  );
}
