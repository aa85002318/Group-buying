"use client";

import { useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type RecipeOption = {
  id: string;
  title: string;
  cover_image?: string | null;
  slug?: string | null;
};

export function RecipePickerEditor({
  manualIds,
  sourceMode,
  onManualIdsChange,
  onSourceModeChange,
  onSave,
  saving,
}: {
  manualIds: string[];
  sourceMode: "auto" | "manual";
  onManualIdsChange: (ids: string[]) => void;
  onSourceModeChange: (mode: "auto" | "manual") => void;
  onSave: () => void;
  saving?: boolean;
}) {
  const [recipes, setRecipes] = useState<RecipeOption[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    fetch("/api/recipes")
      .then((r) => r.json())
      .then((d) => {
        const list = (d.recipes ?? []) as Array<Record<string, unknown>>;
        setRecipes(
          list.map((r) => ({
            id: String(r.id),
            title: String(r.title ?? r.name ?? "未命名食譜"),
            cover_image: (r.cover_image ?? r.coverImage ?? null) as string | null,
            slug: (r.slug ?? null) as string | null,
          }))
        );
      })
      .catch(() => {});
  }, []);

  const selected = useMemo(
    () =>
      manualIds
        .map((id) => recipes.find((r) => r.id === id))
        .filter(Boolean) as RecipeOption[],
    [manualIds, recipes]
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return recipes
      .filter((r) => !manualIds.includes(r.id))
      .filter((r) => !needle || r.title.toLowerCase().includes(needle))
      .slice(0, 20);
  }, [recipes, manualIds, q]);

  return (
    <div className="space-y-3 rounded-xl border border-border bg-white p-3">
      <p className="text-xs font-medium text-muted-foreground">
        精選食譜 — 從已上傳食譜新增或刪除。手動模式只顯示選取項目；自動模式依後台排序抓取。
      </p>
      <div className="flex flex-wrap gap-3 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            checked={sourceMode === "auto"}
            onChange={() => onSourceModeChange("auto")}
          />
          自動
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            checked={sourceMode === "manual"}
            onChange={() => onSourceModeChange("manual")}
          />
          手動精選
        </label>
      </div>

      {selected.length ? (
        <ul className="space-y-1.5">
          {selected.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-border/60 px-2 py-1.5 text-sm"
            >
              <span className="truncate font-medium text-coffee">{r.title}</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onManualIdsChange(manualIds.filter((id) => id !== r.id))}
              >
                <Trash2 className="h-4 w-4 text-danger" />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">尚未挑選食譜</p>
      )}

      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="搜尋食譜名稱…"
      />
      <ul className="max-h-48 space-y-1 overflow-y-auto">
        {filtered.map((r) => (
          <li key={r.id}>
            <button
              type="button"
              className="w-full rounded-lg px-2 py-1.5 text-left text-sm hover:bg-surface-soft"
              onClick={() => onManualIdsChange([...manualIds, r.id])}
            >
              {r.title}
            </button>
          </li>
        ))}
      </ul>

      <Button type="button" size="sm" disabled={saving} onClick={onSave}>
        儲存精選食譜
      </Button>
    </div>
  );
}
