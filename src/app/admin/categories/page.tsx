"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  FolderPlus,
  Plus,
  Power,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminImageUpload } from "@/components/admin/AdminImageUpload";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { getCategoryDisplayIcon } from "@/lib/home";
import { cn } from "@/lib/utils";

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  is_active?: boolean;
  icon_emoji?: string | null;
  icon_url?: string | null;
  parent_id?: string | null;
  level?: number | null;
  path?: string | null;
  catalog_root_id?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  created_at: string;
  updated_at: string;
};

type CategoryTreeNode = CategoryRow & { children: CategoryTreeNode[] };

const EMOJI_OPTIONS = ["🍎", "🥐", "❄️", "🏠", "💊", "💄", "🛋️", "🍪", "🛒", "🥗", "🧴", "📦", "🌾", "🥖"];
const MAX_LEVEL = 4;

const LEVEL_LABELS: Record<number, string> = {
  1: "大分類",
  2: "中分類",
  3: "小分類",
  4: "細分類",
};

const emptyForm = {
  name: "",
  slug: "",
  icon_emoji: "",
  icon_url: "",
  seo_title: "",
  seo_description: "",
  is_active: true,
  /** 階梯選擇：level1 → level2 → level3 的 parent chain（最後一層為直接 parent） */
  stepL1: "",
  stepL2: "",
  stepL3: "",
};

function resolveLevel(c: CategoryRow): number {
  if (c.level && c.level >= 1) return c.level;
  if (!c.parent_id) return 1;
  return 2;
}

function levelLabel(level: number): string {
  return LEVEL_LABELS[level] ?? `第 ${level} 層`;
}

function buildTree(categories: CategoryRow[]): CategoryTreeNode[] {
  const map = new Map<string, CategoryTreeNode>();
  for (const c of categories) {
    map.set(c.id, { ...c, children: [] });
  }
  const roots: CategoryTreeNode[] = [];
  Array.from(map.values()).forEach((node) => {
    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  const sortNodes = (nodes: CategoryTreeNode[]) => {
    nodes.sort(
      (a, b) =>
        (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name, "zh-TW")
    );
    nodes.forEach((n) => sortNodes(n.children));
  };
  sortNodes(roots);
  return roots;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\u4e00-\u9fff-]/g, "");
}

function AdminCategoriesClient() {
  const searchParams = useSearchParams();
  const catalogFilter = searchParams.get("catalog") ?? "baking-materials";

  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (catalogFilter === "baking-materials") params.set("catalog", "baking-materials");
    fetch(`/api/admin/categories?${params}`)
      .then((r) => r.json())
      .then((d) => {
        const rows = (d.categories ?? []) as CategoryRow[];
        setCategories(rows);
        // 預設展開大分類
        setExpanded(new Set(rows.filter((c) => resolveLevel(c) === 1).map((c) => c.id)));
      })
      .finally(() => setLoading(false));
  }, [catalogFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const tree = useMemo(() => buildTree(categories), [categories]);

  const byParent = useMemo(() => {
    const map = new Map<string | null, CategoryRow[]>();
    for (const c of categories) {
      const key = c.parent_id ?? null;
      const list = map.get(key) ?? [];
      list.push(c);
      map.set(key, list);
    }
    Array.from(map.values()).forEach((list) => {
      list.sort(
        (a: CategoryRow, b: CategoryRow) =>
          (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name, "zh-TW")
      );
    });
    return map;
  }, [categories]);

  const level1Options = byParent.get(null) ?? [];
  const level2Options = form.stepL1
    ? (byParent.get(form.stepL1) ?? []).filter((c) => !editing || c.id !== editing.id)
    : [];
  const level3Options = form.stepL2
    ? (byParent.get(form.stepL2) ?? []).filter((c) => !editing || c.id !== editing.id)
    : [];

  /** 依階梯選擇推導 parent_id 與即將建立的層級 */
  const resolvedParentId = form.stepL3 || form.stepL2 || form.stepL1 || "";
  const parentCategory = resolvedParentId
    ? categories.find((c) => c.id === resolvedParentId)
    : undefined;
  const creatingLevel = parentCategory ? resolveLevel(parentCategory) + 1 : 1;

  const openCreateRoot = () => {
    setCreating(true);
    setEditing(null);
    setError(null);
    setForm({ ...emptyForm });
  };

  const openCreateChild = (parent: CategoryRow) => {
    const parentLevel = resolveLevel(parent);
    if (parentLevel >= MAX_LEVEL) {
      setError(`已達最大層級（${MAX_LEVEL}），無法再新增子分類`);
      return;
    }
    setCreating(true);
    setEditing(null);
    setError(null);

    // 依 parent 的 path 回填階梯
    const chain: string[] = [];
    let cur: CategoryRow | undefined = parent;
    while (cur) {
      chain.unshift(cur.id);
      cur = cur.parent_id ? categories.find((c) => c.id === cur!.parent_id) : undefined;
    }

    setForm({
      ...emptyForm,
      stepL1: chain[0] ?? "",
      stepL2: chain[1] ?? "",
      stepL3: chain[2] ?? "",
    });
  };

  const openEdit = (c: CategoryRow) => {
    setEditing(c);
    setCreating(false);
    setError(null);

    const chain: string[] = [];
    let cur: CategoryRow | undefined = c.parent_id
      ? categories.find((x) => x.id === c.parent_id)
      : undefined;
    while (cur) {
      chain.unshift(cur.id);
      cur = cur.parent_id ? categories.find((x) => x.id === cur!.parent_id) : undefined;
    }

    setForm({
      name: c.name,
      slug: c.slug ?? "",
      icon_emoji: c.icon_emoji ?? "",
      icon_url: c.icon_url ?? "",
      seo_title: c.seo_title ?? "",
      seo_description: c.seo_description ?? "",
      is_active: c.is_active !== false,
      stepL1: chain[0] ?? "",
      stepL2: chain[1] ?? "",
      stepL3: chain[2] ?? "",
    });
  };

  const closeForm = () => {
    setEditing(null);
    setCreating(false);
    setForm(emptyForm);
    setError(null);
  };

  const save = async () => {
    if (!form.name.trim()) {
      setError("請填寫分類名稱");
      return;
    }
    if (creating && creatingLevel > MAX_LEVEL) {
      setError(`分類層級不得超過 ${MAX_LEVEL} 層`);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const parent_id = resolvedParentId || null;
      if (editing && parent_id === editing.id) {
        setError("上層分類不可選擇自己");
        return;
      }

      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim() || slugify(form.name),
        icon_emoji: form.icon_emoji || null,
        icon_url: form.icon_url || null,
        seo_title: form.seo_title.trim() || null,
        seo_description: form.seo_description.trim() || null,
        is_active: form.is_active,
        parent_id,
        ...(catalogFilter === "baking-materials" && creating
          ? { catalog: "baking-materials" }
          : {}),
      };

      const res = creating
        ? await fetch("/api/admin/categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch(`/api/admin/categories/${editing!.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "儲存失敗");
        return;
      }
      closeForm();
      load();
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (c: CategoryRow) => {
    await fetch(`/api/admin/categories/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !(c.is_active !== false) }),
    });
    load();
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    setExpanded(new Set(categories.map((c) => c.id)));
  };

  const collapseAll = () => {
    setExpanded(new Set());
  };

  const formTitle = creating
    ? `新增${levelLabel(Math.min(creatingLevel, MAX_LEVEL))}`
    : `編輯：${editing?.name}`;

  const renderNode = (node: CategoryTreeNode, depth = 0) => {
    const level = resolveLevel(node);
    const hasChildren = node.children.length > 0;
    const isOpen = expanded.has(node.id);
    const icon = getCategoryDisplayIcon(node);
    const canAddChild = level < MAX_LEVEL;

    return (
      <div key={node.id} className="min-w-0">
        <div
          className={cn(
            "flex items-center gap-2 rounded-xl border border-border bg-white p-3 shadow-card",
            node.is_active === false && "opacity-60"
          )}
          style={{ marginLeft: depth * 20 }}
        >
          <button
            type="button"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg hover:bg-muted disabled:opacity-30"
            onClick={() => hasChildren && toggleExpand(node.id)}
            disabled={!hasChildren}
            aria-label={isOpen ? "收合" : "展開"}
            aria-expanded={hasChildren ? isOpen : undefined}
          >
            {hasChildren ? (
              isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )
            ) : (
              <span className="h-4 w-4" />
            )}
          </button>

          {icon.type === "image" ? (
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-muted">
              <Image src={icon.value} alt="" fill className="object-contain" unoptimized />
            </div>
          ) : (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center text-2xl">
              {icon.value}
            </span>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  level === 1 && "bg-primary/10 text-primary",
                  level === 2 && "bg-amber-100 text-amber-800",
                  level === 3 && "bg-sky-100 text-sky-800",
                  level >= 4 && "bg-muted text-muted-foreground"
                )}
              >
                {levelLabel(level)}
              </span>
              <p className="truncate font-medium text-coffee">{node.name}</p>
              {node.is_active === false && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  停用
                </span>
              )}
              {hasChildren && (
                <span className="text-xs text-muted-foreground">{node.children.length} 個子分類</span>
              )}
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {node.slug}
              {node.path ? ` · ${node.path}` : ""}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap justify-end gap-1">
            {canAddChild && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => openCreateChild(node)}
                title={`新增${levelLabel(level + 1)}`}
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                子分類
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => toggleActive(node)}
              title={node.is_active !== false ? "停用" : "啟用"}
            >
              <Power className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="secondary" onClick={() => openEdit(node)}>
              <Pencil className="mr-1 h-3.5 w-3.5" />
              編輯
            </Button>
          </div>
        </div>

        {hasChildren && isOpen && (
          <div className="mt-2 space-y-2">
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="分類管理"
        description="階梯式設定：大分類 → 中分類 → 小分類（最多四層）"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/categories?catalog=baking-materials">
              <Button
                variant={catalogFilter === "baking-materials" ? "default" : "outline"}
                size="sm"
              >
                烘焙材料
              </Button>
            </Link>
            <Link href="/admin/categories?catalog=all">
              <Button variant={catalogFilter === "all" ? "default" : "outline"} size="sm">
                全部分類
              </Button>
            </Link>
            <Button size="sm" variant="outline" onClick={expandAll}>
              全部展開
            </Button>
            <Button size="sm" variant="outline" onClick={collapseAll}>
              全部收合
            </Button>
            <Button size="sm" onClick={openCreateRoot}>
              <FolderPlus className="mr-1.5 h-4 w-4" />
              新增大分類
            </Button>
          </div>
        }
      />

      {/* 層級說明 */}
      <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-white p-3 text-xs text-muted-foreground shadow-card">
        <span className="font-medium text-coffee">層級說明：</span>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary">1 大分類</span>
        <span>→</span>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-800">2 中分類</span>
        <span>→</span>
        <span className="rounded-full bg-sky-100 px-2 py-0.5 font-semibold text-sky-800">3 小分類</span>
        <span>→</span>
        <span className="rounded-full bg-muted px-2 py-0.5 font-semibold">4 細分類</span>
      </div>

      {(creating || editing) && (
        <div className="space-y-4 rounded-xl border border-border bg-white p-4 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-medium text-coffee">{formTitle}</h2>
            {creating && (
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                即將建立：{levelLabel(Math.min(creatingLevel, MAX_LEVEL))}
              </span>
            )}
          </div>

          {/* 階梯式上層選擇 */}
          <div className="space-y-3 rounded-xl bg-[#FFF9EA] p-4">
            <p className="text-sm font-semibold text-coffee">上層分類（階梯選擇）</p>
            <p className="text-xs text-muted-foreground">
              不選任何上層＝大分類；選到第 N 層後，新分類會成為下一層子分類。
            </p>

            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block space-y-1.5 text-sm">
                <span className="font-medium text-coffee">① 大分類</span>
                <select
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
                  value={form.stepL1}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      stepL1: e.target.value,
                      stepL2: "",
                      stepL3: "",
                    })
                  }
                >
                  <option value="">— 無（此分類即為大分類）—</option>
                  {level1Options
                    .filter((c) => !editing || c.id !== editing.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </label>

              <label className="block space-y-1.5 text-sm">
                <span className="font-medium text-coffee">② 中分類</span>
                <select
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm disabled:opacity-50"
                  value={form.stepL2}
                  disabled={!form.stepL1}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      stepL2: e.target.value,
                      stepL3: "",
                    })
                  }
                >
                  <option value="">— 不選（掛在大分類下）—</option>
                  {level2Options.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1.5 text-sm">
                <span className="font-medium text-coffee">③ 小分類</span>
                <select
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm disabled:opacity-50"
                  value={form.stepL3}
                  disabled={!form.stepL2}
                  onChange={(e) => setForm({ ...form, stepL3: e.target.value })}
                >
                  <option value="">— 不選（掛在中分類下）—</option>
                  {level3Options.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <p className="text-xs text-coffee">
              目前掛載位置：
              <strong className="ml-1">
                {!resolvedParentId
                  ? "根層（大分類）"
                  : [
                      form.stepL1 && level1Options.find((c) => c.id === form.stepL1)?.name,
                      form.stepL2 && level2Options.find((c) => c.id === form.stepL2)?.name,
                      form.stepL3 && level3Options.find((c) => c.id === form.stepL3)?.name,
                    ]
                      .filter(Boolean)
                      .join(" › ")}
              </strong>
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              placeholder="分類名稱 *"
              value={form.name}
              onChange={(e) => {
                const name = e.target.value;
                setForm((prev) => ({
                  ...prev,
                  name,
                  slug: prev.slug && editing ? prev.slug : slugify(name),
                }));
              }}
            />
            <Input
              placeholder="Slug（網址用）"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />
            <Input
              placeholder="SEO 標題"
              value={form.seo_title}
              onChange={(e) => setForm({ ...form, seo_title: e.target.value })}
              className="sm:col-span-2"
            />
            <Input
              placeholder="SEO 描述"
              value={form.seo_description}
              onChange={(e) => setForm({ ...form, seo_description: e.target.value })}
              className="sm:col-span-2"
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-coffee">Emoji 圖示</p>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setForm({ ...form, icon_emoji: emoji, icon_url: "" })}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg border text-xl",
                    form.icon_emoji === emoji ? "border-primary bg-primary/10" : "border-border"
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <AdminImageUpload
            label="或上傳圖片圖示"
            hint="上傳後將優先於 emoji 顯示"
            images={form.icon_url ? [form.icon_url] : []}
            onChange={(images) => setForm({ ...form, icon_url: images[0] ?? "", icon_emoji: "" })}
            uploadFolder="categories"
            maxImages={1}
          />

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            啟用中
          </label>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2">
            <Button onClick={save} disabled={saving || !form.name.trim()}>
              {saving ? "儲存中…" : "儲存"}
            </Button>
            <Button variant="secondary" onClick={closeForm}>
              取消
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">載入中…</p>
      ) : tree.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-white p-8 text-center">
          <p className="text-sm text-muted-foreground">尚無分類</p>
          <Button className="mt-3" size="sm" onClick={openCreateRoot}>
            新增大分類
          </Button>
        </div>
      ) : (
        <div className="space-y-2">{tree.map((node) => renderNode(node))}</div>
      )}
    </div>
  );
}

export default function AdminCategoriesPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 p-4">
          <p className="text-sm text-muted-foreground">載入分類管理…</p>
        </div>
      }
    >
      <AdminCategoriesClient />
    </Suspense>
  );
}
