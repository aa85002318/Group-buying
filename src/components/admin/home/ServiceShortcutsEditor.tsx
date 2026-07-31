"use client";

import { Plus, Trash2 } from "lucide-react";
import { AdminImageUpload } from "@/components/admin/AdminImageUpload";
import { ColorSwatchPicker } from "@/components/admin/home/ColorSwatchPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DEFAULT_SERVICE_SHORTCUTS,
  SERVICE_SHORTCUT_IMAGE_SIZE,
  type ServiceShortcutItem,
} from "@/lib/home/service-shortcuts";

export function ServiceShortcutsEditor({
  items,
  onChange,
  onSave,
  saving,
}: {
  items: ServiceShortcutItem[];
  onChange: (next: ServiceShortcutItem[]) => void;
  onSave: () => void;
  saving?: boolean;
}) {
  const list = items.length ? items : DEFAULT_SERVICE_SHORTCUTS;

  const update = (index: number, patch: Partial<ServiceShortcutItem>) => {
    const next = [...list];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  return (
    <div className="space-y-3 rounded-xl border border-border bg-white p-3">
      <p className="text-xs font-medium text-muted-foreground">
        服務快捷入口 — 可指定連結、上傳素材、更換底色。圖片建議{" "}
        {SERVICE_SHORTCUT_IMAGE_SIZE.label}。
      </p>
      {list.map((item, index) => (
        <div key={item.id} className="space-y-2 rounded-lg border border-border/70 p-2">
          <div className="flex justify-between">
            <p className="text-xs font-semibold">快捷 {index + 1}</p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onChange(list.filter((_, i) => i !== index))}
            >
              <Trash2 className="h-4 w-4 text-danger" />
            </Button>
          </div>
          <Input
            value={item.title}
            onChange={(e) => update(index, { title: e.target.value })}
            placeholder="標題"
          />
          <Input
            value={item.subtitle ?? ""}
            onChange={(e) => update(index, { subtitle: e.target.value })}
            placeholder="副標"
          />
          <Input
            value={item.href ?? ""}
            onChange={(e) => update(index, { href: e.target.value })}
            placeholder="指定連結"
          />
          <AdminImageUpload
            label={`素材（建議 ${SERVICE_SHORTCUT_IMAGE_SIZE.label}）`}
            images={item.imageUrl ? [item.imageUrl] : []}
            onChange={(imgs) => update(index, { imageUrl: imgs[0] })}
            uploadFolder="home/service-shortcuts"
            maxImages={1}
            multiple={false}
          />
          <ColorSwatchPicker
            value={item.backgroundColor}
            onChange={(c) => update(index, { backgroundColor: c })}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={item.enabled !== false}
              onChange={(e) => update(index, { enabled: e.target.checked })}
            />
            啟用
          </label>
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() =>
            onChange([
              ...list,
              {
                id: `ss-${Date.now()}`,
                title: "新快捷",
                subtitle: "",
                imageUrl: "",
                href: "/",
                backgroundColor: "#FFFFFF",
                sortOrder: (list.length + 1) * 10,
                enabled: true,
                labelsInImage: true,
              },
            ])
          }
        >
          <Plus className="mr-1 h-4 w-4" />
          新增快捷
        </Button>
        <Button type="button" size="sm" disabled={saving} onClick={onSave}>
          儲存服務快捷入口
        </Button>
      </div>
    </div>
  );
}
