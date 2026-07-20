"use client";

import { useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  GripVertical,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import {
  DEFAULT_SIDE_MENU_SECTIONS,
  type SideMenuColorKey,
  type SideMenuIconKey,
  type SideMenuItem,
  type SideMenuSection,
} from "@/lib/site-header";

const ICON_OPTIONS: Array<{ value: SideMenuIconKey; label: string }> = [
  { value: "flame", label: "火焰" },
  { value: "package", label: "新品包裹" },
  { value: "clock", label: "倒數時鐘" },
  { value: "star", label: "星星" },
  { value: "shopping-bag", label: "購物袋" },
  { value: "radio", label: "直播" },
  { value: "play", label: "播放" },
  { value: "video", label: "影音" },
  { value: "article", label: "文章" },
  { value: "sparkles", label: "精選" },
];

const COLOR_OPTIONS: Array<{ value: SideMenuColorKey; label: string }> = [
  { value: "berry", label: "莓果紅" },
  { value: "coral", label: "珊瑚紅" },
  { value: "orange", label: "橘色" },
  { value: "yellow", label: "黃色" },
  { value: "purple", label: "紫色" },
  { value: "blue", label: "藍色" },
  { value: "green", label: "綠色" },
  { value: "teal", label: "青綠色" },
  { value: "pink", label: "粉紅色" },
];

const COLOR_PREVIEW: Record<SideMenuColorKey, string> = {
  berry: "bg-[#FF4D6D]",
  coral: "bg-[#FF3B5C]",
  orange: "bg-[#FF9800]",
  yellow: "bg-[#F5B400]",
  purple: "bg-[#A93DDB]",
  blue: "bg-[#3B82F6]",
  green: "bg-[#23B26D]",
  teal: "bg-[#00AFC1]",
  pink: "bg-[#FF5A8A]",
};

function createItem(): SideMenuItem {
  return {
    id: `side-item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    label: "",
    description: "",
    href: "/",
    icon: "sparkles",
    color: "berry",
  };
}

function createSection(kind: SideMenuSection["kind"] = "links"): SideMenuSection {
  return {
    id: `side-section-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: kind === "categories" ? "商品分類" : "新選單區塊",
    icon: kind === "categories" ? "shopping-bag" : "sparkles",
    color: kind === "categories" ? "pink" : "berry",
    kind,
    items:
      kind === "categories"
        ? [
            {
              ...createItem(),
              label: "瀏覽所有分類",
              description: "點擊展開商品分類",
              href: "/categories",
              icon: "shopping-bag",
              color: "pink",
            },
          ]
        : [createItem()],
  };
}

export default function AdminSideMenuPage() {
  const [sections, setSections] = useState<SideMenuSection[]>(DEFAULT_SIDE_MENU_SECTIONS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/admin/side-menu")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error ?? "載入失敗");
        setSections(
          Array.isArray(data.sections) && data.sections.length > 0
            ? data.sections
            : DEFAULT_SIDE_MENU_SECTIONS
        );
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "載入失敗"))
      .finally(() => setLoading(false));
  }, []);

  const updateSection = (id: string, patch: Partial<SideMenuSection>) => {
    setSections((current) =>
      current.map((section) => (section.id === id ? { ...section, ...patch } : section))
    );
  };

  const updateItem = (sectionId: string, itemId: string, patch: Partial<SideMenuItem>) => {
    setSections((current) =>
      current.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              items: section.items.map((item) =>
                item.id === itemId ? { ...item, ...patch } : item
              ),
            }
          : section
      )
    );
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    setSections((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const moveItem = (sectionId: string, index: number, direction: -1 | 1) => {
    setSections((current) =>
      current.map((section) => {
        if (section.id !== sectionId) return section;
        const target = index + direction;
        if (target < 0 || target >= section.items.length) return section;
        const items = [...section.items];
        [items[index], items[target]] = [items[target], items[index]];
        return { ...section, items };
      })
    );
  };

  const addSection = (kind: SideMenuSection["kind"]) => {
    const section = createSection(kind);
    setSections((current) => [...current, section]);
    setCollapsedSections((current) => {
      const next = new Set(current);
      next.delete(section.id);
      return next;
    });
  };

  const toggleSection = (id: string) => {
    setCollapsedSections((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/admin/side-menu", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error ?? "儲存失敗");
      if (Array.isArray(data.sections)) setSections(data.sections);
      setMessage("Side Menu 已儲存，前台重新整理後立即套用");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Hamburger Side Menu"
        description="獨立管理首頁左上角側邊選單的區塊、文案、連結、圖示與顏色"
        actions={
          <Button onClick={save} disabled={loading || saving}>
            {saving ? "儲存中…" : "儲存側邊選單"}
          </Button>
        }
      />

      {message && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">{message}</p>
      )}
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}

      {loading ? (
        <p>載入中…</p>
      ) : (
        <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#F3D7DF] bg-white p-4 shadow-card">
              <div className="mb-3">
                <h2 className="text-base font-black text-coffee">新增選單內容</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  先選擇要新增的類型，新增後會出現在最下方並可立即編輯。
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => addSection("links")}
                  className="group flex min-h-[88px] items-center gap-3 rounded-2xl border-2 border-dashed border-[#F3B8C8] bg-[#FFF8FA] p-4 text-left transition hover:-translate-y-0.5 hover:border-[#E9285C] hover:bg-[#FFF0F4]"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FFE9EE] text-[#E9285C]">
                    <Plus className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block font-bold text-coffee">一般連結區塊</span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      適合購物入口、活動或影音連結
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => addSection("categories")}
                  className="group flex min-h-[88px] items-center gap-3 rounded-2xl border-2 border-dashed border-[#C9D8FF] bg-[#F8FAFF] p-4 text-left transition hover:-translate-y-0.5 hover:border-[#3B82F6] hover:bg-[#EEF3FF]"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EEF3FF] text-[#3B82F6]">
                    <ShoppingBag className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block font-bold text-coffee">商品分類區塊</span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      自動顯示後台現有商品分類
                    </span>
                  </span>
                </button>
              </div>
            </div>

            {sections.length === 0 && (
              <div className="rounded-2xl border-2 border-dashed border-border bg-white p-10 text-center">
                <p className="font-bold text-coffee">目前沒有選單區塊</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  請從上方選擇一種區塊開始新增。
                </p>
              </div>
            )}

            {sections.map((section, sectionIndex) => {
              const collapsed = collapsedSections.has(section.id);
              return (
            <article key={section.id} className="overflow-hidden rounded-2xl border border-border bg-white shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#FFF9FA] px-4 py-3">
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  aria-expanded={!collapsed}
                >
                  <GripVertical className="h-5 w-5 shrink-0 text-[#B8A1A7]" aria-hidden />
                  <span
                    className={`h-3 w-3 shrink-0 rounded-full ${COLOR_PREVIEW[section.color]}`}
                    aria-hidden
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-black text-coffee">
                      {section.title || `未命名區塊 ${sectionIndex + 1}`}
                    </span>
                    <span className="block text-xs font-medium text-muted-foreground">
                      {section.kind === "categories" ? "商品分類 Accordion" : `${section.items.length} 個連結項目`}
                    </span>
                  </span>
                  {collapsed ? (
                    <ChevronDown className="ml-auto h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronUp className="ml-auto h-5 w-5 text-muted-foreground" />
                  )}
                </button>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" disabled={sectionIndex === 0} onClick={() => moveSection(sectionIndex, -1)}>
                    上移
                  </Button>
                  <Button type="button" size="sm" variant="outline" disabled={sectionIndex === sections.length - 1} onClick={() => moveSection(sectionIndex, 1)}>
                    下移
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setSections((list) => list.filter((row) => row.id !== section.id))}>
                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                    刪除
                  </Button>
                </div>
              </div>

              {!collapsed && (
                <div className="space-y-4 p-4">
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <label className="space-y-2">
                  <span className="text-xs font-medium text-muted-foreground">區塊標題</span>
                  <Input value={section.title} onChange={(event) => updateSection(section.id, { title: event.target.value })} placeholder="例如：今日必逛" />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-medium text-muted-foreground">區塊圖示</span>
                  <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={section.icon} onChange={(event) => updateSection(section.id, { icon: event.target.value as SideMenuIconKey })}>
                    {ICON_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-medium text-muted-foreground">主題顏色</span>
                  <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={section.color} onChange={(event) => updateSection(section.id, { color: event.target.value as SideMenuColorKey })}>
                    {COLOR_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-medium text-muted-foreground">區塊類型</span>
                  <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={section.kind} onChange={(event) => updateSection(section.id, { kind: event.target.value as SideMenuSection["kind"] })}>
                    <option value="links">一般連結</option>
                    <option value="categories">商品分類 Accordion</option>
                  </select>
                </label>
              </div>

              {section.kind === "categories" && (
                <p className="rounded-lg bg-pink-50 px-3 py-2 text-xs text-pink-800">
                  商品分類內容會自動讀取「分類管理」資料；此處第一個項目用來設定 Accordion 的顯示文字與圖示。
                </p>
              )}

              <div className="space-y-3 border-t border-border pt-4">
                {section.items.map((item, itemIndex) => (
                  <div key={item.id} className="space-y-3 rounded-xl border border-border bg-[#FCFCFD] p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="flex items-center gap-2 text-sm font-bold text-coffee">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        {item.label || `未命名項目 ${itemIndex + 1}`}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" size="sm" variant="outline" disabled={itemIndex === 0} onClick={() => moveItem(section.id, itemIndex, -1)}>上移</Button>
                        <Button type="button" size="sm" variant="outline" disabled={itemIndex === section.items.length - 1} onClick={() => moveItem(section.id, itemIndex, 1)}>下移</Button>
                        <Button type="button" size="sm" variant="outline" disabled={section.items.length === 1} onClick={() => updateSection(section.id, { items: section.items.filter((row) => row.id !== item.id) })}>
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="sr-only">刪除</span>
                        </Button>
                      </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      <label className="space-y-2">
                        <span className="text-xs font-medium text-muted-foreground">顯示名稱</span>
                        <Input value={item.label} onChange={(event) => updateItem(section.id, item.id, { label: event.target.value })} placeholder="例如：本日上架" />
                      </label>
                      <label className="space-y-2">
                        <span className="text-xs font-medium text-muted-foreground">說明文字</span>
                        <Input value={item.description ?? ""} onChange={(event) => updateItem(section.id, item.id, { description: event.target.value })} placeholder="例如：今天最新上架商品" />
                      </label>
                      <label className="space-y-2">
                        <span className="text-xs font-medium text-muted-foreground">連結</span>
                        <Input value={item.href} onChange={(event) => updateItem(section.id, item.id, { href: event.target.value })} placeholder="/products" />
                      </label>
                      <label className="space-y-2">
                        <span className="text-xs font-medium text-muted-foreground">圖示</span>
                        <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={item.icon} onChange={(event) => updateItem(section.id, item.id, { icon: event.target.value as SideMenuIconKey })}>
                          {ICON_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                      </label>
                      <label className="space-y-2">
                        <span className="text-xs font-medium text-muted-foreground">圖示顏色</span>
                        <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={item.color} onChange={(event) => updateItem(section.id, item.id, { color: event.target.value as SideMenuColorKey })}>
                          {COLOR_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                      </label>
                    </div>
                  </div>
                ))}

                {section.kind === "links" && (
                  <button
                    type="button"
                    onClick={() => updateSection(section.id, { items: [...section.items, createItem()] })}
                    className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#F3B8C8] bg-[#FFF8FA] text-sm font-bold text-[#E9285C] transition hover:border-[#E9285C] hover:bg-[#FFF0F4]"
                  >
                    <Plus className="h-4 w-4" />
                    新增區塊項目
                  </button>
                )}
              </div>
                </div>
              )}
            </article>
              );
            })}
          </div>

          <aside className="sticky top-20 hidden overflow-hidden rounded-[24px] border border-border bg-white shadow-card xl:block">
            <div className="flex items-center gap-2 border-b border-border bg-[#FFF9FA] px-4 py-3">
              <Eye className="h-4 w-4 text-[#E9285C]" />
              <h2 className="font-black text-coffee">即時排版預覽</h2>
            </div>
            <div className="max-h-[calc(100vh-10rem)] overflow-y-auto p-3">
              {sections.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">尚無選單內容</p>
              ) : (
                sections.map((section, sectionIndex) => (
                  <div key={`preview-${section.id}`}>
                    {sectionIndex > 0 && <div className="mx-2 my-3 border-t border-border" />}
                    <div className="flex items-center gap-2 px-2 py-2">
                      <span className={`h-3 w-3 rounded-full ${COLOR_PREVIEW[section.color]}`} />
                      <p className="text-sm font-black text-coffee">
                        {section.title || "未命名區塊"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      {section.items.map((item) => (
                        <div
                          key={`preview-${item.id}`}
                          className="flex min-h-14 items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-[#FFF5F7]"
                        >
                          <span
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${COLOR_PREVIEW[item.color]} text-sm font-black text-white`}
                          >
                            {item.label.trim().slice(0, 1) || "＋"}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-bold text-coffee">
                              {item.label || "未命名項目"}
                            </span>
                            <span className="block truncate text-[11px] text-muted-foreground">
                              {item.description || "尚未填寫說明"}
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>
        </section>
      )}
    </div>
  );
}
