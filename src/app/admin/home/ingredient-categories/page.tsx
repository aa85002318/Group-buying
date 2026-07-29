"use client";

import { useEffect, useRef, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/* ─── Types ─── */
type CatRow = {
  id: string;
  display_name: string;
  category_id: string | null;
  desktop_icon: string | null;
  mobile_icon: string | null;
  alt: string | null;
  custom_url: string | null;
  sort_order: number;
  enabled: boolean;
  badge: "HOT" | "NEW" | "限時" | "推薦" | null;
  icon_mode: "ip" | "product" | "brand";
  start_at: string | null;
  end_at: string | null;
};

const ICON_SPEC = `建議尺寸：320×320px，透明背景，小於 150KB
格式：WebP、PNG、JPG
上傳後自動裁切 1:1，轉 WebP，移除 EXIF`;

const BADGE_OPTIONS = ["（不顯示）", "HOT", "NEW", "限時", "推薦"] as const;
const ICON_MODE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "ip",      label: "IP 插畫" },
  { value: "product", label: "商品圖片" },
  { value: "brand",   label: "品牌 Icon" },
];

function emptyRow(): CatRow {
  return {
    id: "",
    display_name: "",
    category_id: null,
    desktop_icon: null,
    mobile_icon: null,
    alt: null,
    custom_url: null,
    sort_order: 99,
    enabled: true,
    badge: null,
    icon_mode: "ip",
    start_at: null,
    end_at: null,
  };
}

/* ─── Drag-to-reorder row ─── */
function SortableRow({
  row,
  onEdit,
  onDelete,
  onToggle,
  dragHandleProps,
}: {
  row: CatRow;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  dragHandleProps?: React.HTMLAttributes<HTMLSpanElement>;
}) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-border bg-white p-3 shadow-card">
      <span
        {...dragHandleProps}
        className="cursor-grab touch-none select-none text-lg text-muted-foreground"
        title="拖曳排序"
      >
        ⠿
      </span>

      {/* Icon preview */}
      <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#F2E7DF] bg-[#FFF8F3]">
        {row.desktop_icon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={row.desktop_icon} alt="" className="h-full w-full object-contain p-1.5" />
        ) : (
          <span className="text-base font-bold text-[#c4a48e]">{row.display_name.charAt(0)}</span>
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-coffee">{row.display_name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {row.custom_url ?? (row.category_id ? `category=${row.category_id}` : "—")}
        </p>
      </div>

      {row.badge ? (
        <span className="rounded-full bg-[#FF6B5B] px-2 py-0.5 text-[10px] font-bold text-white">
          {row.badge}
        </span>
      ) : null}

      <span
        className={cn(
          "rounded-full px-2.5 py-0.5 text-[11px] font-bold",
          row.enabled ? "bg-success-soft text-success" : "bg-disabled-soft text-disabled"
        )}
      >
        {row.enabled ? "啟用" : "停用"}
      </span>

      <div className="flex gap-1.5 shrink-0">
        <Button size="sm" variant="outline" onClick={onEdit}>編輯</Button>
        <Button size="sm" variant="outline" onClick={onToggle}>
          {row.enabled ? "停用" : "啟用"}
        </Button>
        <Button size="sm" variant="destructive" onClick={onDelete}>刪除</Button>
      </div>
    </li>
  );
}

/* ─── Edit form ─── */
function EditForm({
  row,
  onChange,
  onSave,
  onCancel,
  saving,
}: {
  row: CatRow;
  onChange: (r: CatRow) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  return (
    <div className="space-y-5 rounded-xl border border-border bg-white p-5 shadow-card">
      <p className="font-semibold text-coffee">
        {row.id ? `編輯：${row.display_name}` : "新增分類"}
      </p>

      {/* Name + badge + icon_mode */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">前台顯示名稱</label>
          <Input
            value={row.display_name}
            onChange={(e) => onChange({ ...row, display_name: e.target.value })}
            placeholder="麵粉"
            maxLength={10}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">小標籤 Badge</label>
          <select
            className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm"
            value={row.badge ?? "（不顯示）"}
            onChange={(e) =>
              onChange({
                ...row,
                badge: e.target.value === "（不顯示）" ? null : (e.target.value as CatRow["badge"]),
              })
            }
          >
            {BADGE_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Icon 顯示模式</label>
          <select
            className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm"
            value={row.icon_mode}
            onChange={(e) => onChange({ ...row, icon_mode: e.target.value as CatRow["icon_mode"] })}
          >
            {ICON_MODE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Icons */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Icon 圖片（桌機）URL</label>
          <Input
            value={row.desktop_icon ?? ""}
            onChange={(e) => onChange({ ...row, desktop_icon: e.target.value || null })}
            placeholder="https://…"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Icon 圖片（手機）URL</label>
          <Input
            value={row.mobile_icon ?? ""}
            onChange={(e) => onChange({ ...row, mobile_icon: e.target.value || null })}
            placeholder="https://… （省略則使用桌機圖）"
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <label className="text-xs text-muted-foreground">圖片 Alt</label>
          <Input
            value={row.alt ?? ""}
            onChange={(e) => onChange({ ...row, alt: e.target.value || null })}
            placeholder="麵粉分類圖示"
          />
        </div>
      </div>
      <p className="whitespace-pre-line rounded-lg bg-surface-soft px-3 py-2 text-xs text-muted-foreground">
        {ICON_SPEC}
      </p>

      {/* Link settings */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">綁定商品分類 ID（選填）</label>
          <Input
            value={row.category_id ?? ""}
            onChange={(e) => onChange({ ...row, category_id: e.target.value || null })}
            placeholder="category UUID 或 slug"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">自訂網址（優先於分類）</label>
          <Input
            value={row.custom_url ?? ""}
            onChange={(e) => onChange({ ...row, custom_url: e.target.value || null })}
            placeholder="/products?category=flour"
          />
        </div>
      </div>

      {/* Timing + Sort + Enable */}
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">排序</label>
          <Input
            type="number"
            value={row.sort_order}
            onChange={(e) => onChange({ ...row, sort_order: Number(e.target.value) })}
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={row.enabled}
            onChange={(e) => onChange({ ...row, enabled: e.target.checked })}
          />
          啟用
        </label>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">開始時間</label>
          <Input
            type="datetime-local"
            value={row.start_at?.slice(0, 16) ?? ""}
            onChange={(e) => onChange({ ...row, start_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">結束時間</label>
          <Input
            type="datetime-local"
            value={row.end_at?.slice(0, 16) ?? ""}
            onChange={(e) => onChange({ ...row, end_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button disabled={saving} onClick={onSave}>儲存</Button>
        <Button variant="outline" onClick={onCancel}>取消</Button>
      </div>
    </div>
  );
}

/* ─── Page ─── */
export default function AdminIngredientCategoriesPage() {
  const [items, setItems] = useState<CatRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<CatRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const dragItem = useRef<number | null>(null);
  const dragOver = useRef<number | null>(null);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/home/ingredient-categories")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "載入失敗");
        setItems(d.items ?? []);
      })
      .catch((e) => setMessage(String(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    setMessage(null);
    try {
      const method = editing.id ? "PUT" : "POST";
      const body = editing.id
        ? editing
        : { ...editing, id: undefined };
      const res = await fetch("/api/admin/home/ingredient-categories", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "儲存失敗");
      setMessage("已儲存");
      setEditing(null);
      load();
    } catch (e) {
      setMessage(String(e));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string, name: string) => {
    if (!confirm(`確定刪除「${name}」？`)) return;
    const res = await fetch(`/api/admin/home/ingredient-categories?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (res.ok) { setMessage("已刪除"); load(); }
    else setMessage("刪除失敗");
  };

  const toggle = async (row: CatRow) => {
    const res = await fetch("/api/admin/home/ingredient-categories", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...row, enabled: !row.enabled }),
    });
    if (res.ok) load();
  };

  /* Drag-to-reorder */
  const handleDragStart = (idx: number) => { dragItem.current = idx; };
  const handleDragEnter = (idx: number) => { dragOver.current = idx; };
  const handleDragEnd   = async () => {
    if (dragItem.current === null || dragOver.current === null) return;
    const next = [...items];
    const [moved] = next.splice(dragItem.current, 1);
    next.splice(dragOver.current, 0, moved);
    const reordered = next.map((r, i) => ({ ...r, sort_order: (i + 1) * 10 }));
    setItems(reordered);
    dragItem.current = null;
    dragOver.current = null;
    await fetch("/api/admin/home/ingredient-categories/reorder", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: reordered.map((r) => ({ id: r.id, sort_order: r.sort_order })) }),
    });
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="找材料分類"
        description="管理首頁「找材料」區塊的圓形 Icon 分類。圖片、名稱、排序、連結皆可管理，發布後立即生效。"
        actions={
          <Button onClick={() => setEditing(emptyRow())}>+ 新增分類</Button>
        }
      />

      {message ? (
        <p className="rounded-lg bg-surface-soft px-3 py-2 text-sm text-coffee">{message}</p>
      ) : null}

      {editing ? (
        <EditForm
          row={editing}
          onChange={setEditing}
          onSave={() => void save()}
          onCancel={() => setEditing(null)}
          saving={saving}
        />
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">載入中…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">尚無分類。點上方「新增分類」開始建立。</p>
      ) : (
        <ul className="space-y-2">
          {items.map((row, idx) => (
            <SortableRow
              key={row.id}
              row={row}
              onEdit={() => setEditing(row)}
              onDelete={() => void remove(row.id, row.display_name)}
              onToggle={() => void toggle(row)}
              dragHandleProps={{
                draggable: true,
                onDragStart: () => handleDragStart(idx),
                onDragEnter: () => handleDragEnter(idx),
                onDragEnd: () => void handleDragEnd(),
                onDragOver: (e) => e.preventDefault(),
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
