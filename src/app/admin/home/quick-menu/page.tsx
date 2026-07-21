"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { AdminImageUpload } from "@/components/admin/AdminImageUpload";
import { HomeQuickMenuCarousel } from "@/components/home/HomeQuickMenuCarousel";
import {
  DEFAULT_HOME_QUICK_MENU_ITEMS,
  QUICK_MENU_ICON_MAP,
  resolveQuickMenuIcon,
  type HomeQuickMenuItem,
  type QuickMenuLinkTarget,
} from "@/lib/home/quick-menu";
import { cn } from "@/lib/utils";

const ICON_KEY_OPTIONS = Object.keys(QUICK_MENU_ICON_MAP);

const emptyForm = {
  title: "",
  icon_url: "",
  icon_key: "package",
  link_url: "/",
  link_target: "_self" as QuickMenuLinkTarget,
  alt_text: "",
  notes: "",
  sort_order: "0",
  is_active: true,
};

type PreviewDevice = 390 | 768 | 1440;

export default function AdminHomeQuickMenuPage() {
  const [items, setItems] = useState<HomeQuickMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>(390);
  const [dragId, setDragId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/home-quick-menu")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "載入失敗");
        setItems(d.items?.length ? d.items : DEFAULT_HOME_QUICK_MENU_ITEMS);
      })
      .catch(() => setItems(DEFAULT_HOME_QUICK_MENU_ITEMS))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      sort_order: String((items.length + 1) * 10),
    });
    setShowForm(true);
  };

  const openEdit = (item: HomeQuickMenuItem) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      icon_url: item.icon_url ?? "",
      icon_key: item.icon_key ?? "package",
      link_url: item.link_url,
      link_target: item.link_target,
      alt_text: item.alt_text ?? "",
      notes: item.notes ?? "",
      sort_order: String(item.sort_order),
      is_active: item.is_active,
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.title.trim()) {
      alert("請填寫選單標題");
      return;
    }
    if (form.title.trim().length > 20) {
      alert("標題最多 20 個字元");
      return;
    }
    if (!form.link_url.trim()) {
      alert("請填寫連結網址");
      return;
    }
    if (!form.icon_url && !form.icon_key) {
      alert("請上傳圖示或選擇內建圖示");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        icon_url: form.icon_url || null,
        icon_key: form.icon_key || null,
        link_url: form.link_url.trim(),
        link_target: form.link_target,
        alt_text: form.alt_text.trim() || null,
        notes: form.notes.trim() || null,
        sort_order: Number(form.sort_order) || 0,
        is_active: form.is_active,
      };

      const res = await fetch("/api/admin/home-quick-menu", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { ...payload, id: editingId } : payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "儲存失敗");
      setShowForm(false);
      setEditingId(null);
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (item: HomeQuickMenuItem) => {
    await fetch("/api/admin/home-quick-menu", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, is_active: !item.is_active }),
    });
    load();
  };

  const remove = async (item: HomeQuickMenuItem) => {
    if (!confirm(`確定刪除「${item.title}」？`)) return;
    await fetch(`/api/admin/home-quick-menu?id=${encodeURIComponent(item.id)}`, {
      method: "DELETE",
    });
    load();
  };

  const move = async (item: HomeQuickMenuItem, dir: -1 | 1) => {
    const idx = items.findIndex((i) => i.id === item.id);
    const swap = items[idx + dir];
    if (!swap) return;
    const next = [...items];
    next[idx] = swap;
    next[idx + dir] = item;
    setItems(next);
    await fetch("/api/admin/home-quick-menu", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: next.map((i) => i.id) }),
    });
    load();
  };

  const onDropReorder = async (targetId: string) => {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      return;
    }
    const from = items.findIndex((i) => i.id === dragId);
    const to = items.findIndex((i) => i.id === targetId);
    if (from < 0 || to < 0) {
      setDragId(null);
      return;
    }
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setItems(next);
    setDragId(null);
    await fetch("/api/admin/home-quick-menu", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: next.map((i) => i.id) }),
    });
    load();
  };

  const previewItems = useMemo(
    () => items.filter((i) => i.is_active).sort((a, b) => a.sort_order - b.sort_order),
    [items]
  );

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="首頁快捷選單管理"
        description="管理首頁 Banner 下方的橫向快捷選單。圖示建議 96×96 px，PNG／JPG／WEBP／SVG，最大 2MB。"
        actions={<Button onClick={openCreate}><Plus className="mr-1 h-4 w-4" />新增項目</Button>}
      />

      {showForm && (
        <div className="space-y-3 rounded-xl bg-white p-4 shadow-card">
          <p className="text-sm font-medium text-coffee">
            {editingId ? "編輯選單項目" : "新增選單項目"}
          </p>
          <AdminImageUpload
            label="圖示圖片（建議 96×96，保留透明背景）"
            hint="可改用下方內建圖示；若已上傳圖片則優先顯示圖片"
            images={form.icon_url ? [form.icon_url] : []}
            onChange={(images) => setForm({ ...form, icon_url: images[0] ?? "" })}
            uploadFolder="home-quick-menu"
            maxImages={1}
            multiple={false}
            aspectRatio="square"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              placeholder="選單標題（必填，最多 20 字）"
              value={form.title}
              maxLength={20}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <Input
              placeholder="連結網址（/shop 或 https://…）"
              value={form.link_url}
              onChange={(e) => setForm({ ...form, link_url: e.target.value })}
            />
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">內建圖示（無上傳圖時使用）</span>
              <select
                className="input-field"
                value={form.icon_key}
                onChange={(e) => setForm({ ...form, icon_key: e.target.value })}
              >
                {ICON_KEY_OPTIONS.map((key) => (
                  <option key={key} value={key}>{key}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">開啟方式</span>
              <select
                className="input-field"
                value={form.link_target}
                onChange={(e) =>
                  setForm({ ...form, link_target: e.target.value as QuickMenuLinkTarget })
                }
              >
                <option value="_self">同頁</option>
                <option value="_blank">新分頁</option>
              </select>
            </label>
            <Input
              type="number"
              placeholder="排序"
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
            />
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">狀態</span>
              <select
                className="input-field"
                value={form.is_active ? "active" : "inactive"}
                onChange={(e) => setForm({ ...form, is_active: e.target.value === "active" })}
              >
                <option value="active">啟用</option>
                <option value="inactive">停用</option>
              </select>
            </label>
            <Input
              placeholder="替代文字 alt"
              value={form.alt_text}
              onChange={(e) => setForm({ ...form, alt_text: e.target.value })}
            />
            <Input
              placeholder="備註（僅後台）"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={save} disabled={saving}>{saving ? "儲存中…" : "儲存"}</Button>
            <Button variant="secondary" onClick={() => { setShowForm(false); setEditingId(null); }}>
              取消
            </Button>
          </div>
        </div>
      )}

      <AdminTable
        columns={[
          {
            key: "drag",
            header: "排序",
            render: (item) => (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  draggable
                  onDragStart={() => setDragId(item.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onDropReorder(item.id)}
                  className="cursor-grab rounded p-1 text-muted-foreground hover:bg-surface-soft"
                  aria-label="拖曳排序"
                >
                  <GripVertical className="h-4 w-4" />
                </button>
                <span className="text-xs tabular-nums text-muted-foreground">{item.sort_order}</span>
              </div>
            ),
          },
          {
            key: "icon",
            header: "圖示",
            render: (item) => {
              const Icon = resolveQuickMenuIcon(item);
              return item.icon_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.icon_url} alt="" className="h-10 w-10 object-contain" />
              ) : (
                <Icon className="h-8 w-8 text-brand-caramel" aria-hidden />
              );
            },
          },
          { key: "title", header: "標題", render: (item) => item.title },
          {
            key: "link",
            header: "連結",
            render: (item) => (
              <span className="max-w-[180px] truncate text-xs text-muted-foreground">{item.link_url}</span>
            ),
          },
          {
            key: "target",
            header: "開啟方式",
            render: (item) => (item.link_target === "_blank" ? "新分頁" : "同頁"),
          },
          {
            key: "status",
            header: "狀態",
            render: (item) => (
              <StatusBadge
                label={item.is_active ? "啟用" : "停用"}
                variant={item.is_active ? "success" : "secondary"}
              />
            ),
          },
          {
            key: "actions",
            header: "操作",
            render: (item) => (
              <div className="flex flex-wrap gap-1">
                <Button size="sm" variant="outline" onClick={() => openEdit(item)}>
                  <Pencil className="mr-1 h-3 w-3" />編輯
                </Button>
                <Button size="sm" variant="outline" onClick={() => move(item, -1)}>
                  <ChevronUp className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => move(item, 1)}>
                  <ChevronDown className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="secondary" onClick={() => toggle(item)}>
                  {item.is_active ? "停用" : "啟用"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => remove(item)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ),
          },
        ]}
        rows={items}
        loading={loading}
        emptyText="尚無快捷選單項目"
      />

      <div className="space-y-3 rounded-xl border border-border bg-white p-4 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-coffee">即時預覽</p>
          <div className="flex gap-1">
            {([390, 768, 1440] as PreviewDevice[]).map((w) => (
              <Button
                key={w}
                size="sm"
                variant={previewDevice === w ? "default" : "outline"}
                onClick={() => setPreviewDevice(w)}
              >
                {w === 390 ? "手機 390" : w === 768 ? "平板 768" : "桌機 1440"}
              </Button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto rounded-xl bg-surface-soft p-4">
          <div
            className={cn("mx-auto transition-all", previewDevice === 390 && "max-w-[390px]", previewDevice === 768 && "max-w-[768px]", previewDevice === 1440 && "max-w-[1400px]")}
          >
            <HomeQuickMenuCarousel items={previewItems} hideArrowsWhenFit={false} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          預覽僅顯示啟用項目，依排序呈現。整區為單一外框，項目無獨立卡片邊框。
        </p>
      </div>
    </div>
  );
}
