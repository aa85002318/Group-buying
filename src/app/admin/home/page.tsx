"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  GripVertical,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  HOME_ADMIN_SECTIONS,
  findBlock,
  parsePopularCategories,
  type HomeAdminSectionMeta,
  type PopularCategoryConfig,
} from "@/lib/home/admin-sections";
import {
  parseHotSearchKeywords,
  type HotSearchKeyword,
} from "@/lib/home/hot-search";
import type { HomepageBlock } from "@/lib/types/database";
import { cn } from "@/lib/utils";

type ProductOption = { id: string; name: string; image_url?: string | null };

function keywordsToLines(keywords: HotSearchKeyword[]): string {
  return keywords.map((k) => k.label).join("\n");
}

function linesToKeywords(text: string): string[] {
  return text
    .split("\n")
    .map((s) => s.trim().replace(/^#/, ""))
    .filter(Boolean);
}

export default function AdminHomeHubPage() {
  const [blocks, setBlocks] = useState<HomepageBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>("hot_search");
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch("/api/admin/cms?type=blocks")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "載入失敗");
        setBlocks(d.blocks ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "載入失敗"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => {
        const list = (d.products ?? []) as ProductOption[];
        setProducts(
          list.map((p) => ({
            id: p.id,
            name: p.name,
            image_url: p.image_url ?? null,
          }))
        );
      })
      .catch(() => {});
  }, []);

  const patch = async (id: string, updates: Record<string, unknown>) => {
    setSavingId(id);
    try {
      const res = await fetch("/api/admin/cms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "block", id, ...updates }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "儲存失敗");
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "儲存失敗");
    } finally {
      setSavingId(null);
    }
  };

  const moveSection = async (block: HomepageBlock, dir: -1 | 1) => {
    const ordered = HOME_ADMIN_SECTIONS.map((s) => findBlock(blocks, s.blockKey)).filter(
      Boolean
    ) as HomepageBlock[];
    const idx = ordered.findIndex((b) => b.id === block.id);
    const swap = ordered[idx + dir];
    if (!swap) return;
    await Promise.all([
      patch(block.id, { sort_order: swap.sort_order }),
      patch(swap.id, { sort_order: block.sort_order }),
    ]);
  };

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products.slice(0, 40);
    return products.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 40);
  }, [products, productSearch]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="首頁管理"
        description="統一管理首頁各區塊：顯示／隱藏、標題、數量，以及各區塊內容設定。"
      />

      <div className="rounded-xl border border-border bg-white p-4 text-sm text-muted-foreground shadow-card">
        <p className="font-semibold text-coffee">已整合的管理入口</p>
        <ul className="mt-2 grid gap-1 sm:grid-cols-2">
          <li>
            <Link className="text-primary underline" href="/admin/banners">
              Banner 管理
            </Link>
            （Hero／本週優惠）
          </li>
          <li>
            <Link className="text-primary underline" href="/admin/home/quick-menu">
              快捷入口
            </Link>
          </li>
          <li>
            <Link className="text-primary underline" href="/admin/articles">
              文章管理（最新資訊）
            </Link>
            ／
            <Link className="text-primary underline" href="/admin/recipes">
              食譜
            </Link>
            ／
            <Link className="text-primary underline" href="/admin/videos">
              影音
            </Link>
          </li>
        </ul>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">載入中…</p>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
          <button type="button" className="ml-2 underline" onClick={load}>
            重試
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {HOME_ADMIN_SECTIONS.map((section, index) => {
            const block = findBlock(blocks, section.blockKey);
            const open = expanded === section.id;
            return (
              <SectionCard
                key={section.id}
                section={section}
                block={block}
                index={index}
                open={open}
                saving={savingId === block?.id}
                onToggle={() => setExpanded(open ? null : section.id)}
                onPatch={patch}
                onMove={moveSection}
                products={filteredProducts}
                productSearch={productSearch}
                onProductSearch={setProductSearch}
                allProducts={products}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function SectionCard({
  section,
  block,
  index,
  open,
  saving,
  onToggle,
  onPatch,
  onMove,
  products,
  productSearch,
  onProductSearch,
  allProducts,
}: {
  section: HomeAdminSectionMeta;
  block?: HomepageBlock;
  index: number;
  open: boolean;
  saving: boolean;
  onToggle: () => void;
  onPatch: (id: string, updates: Record<string, unknown>) => Promise<void>;
  onMove: (block: HomepageBlock, dir: -1 | 1) => Promise<void>;
  products: ProductOption[];
  productSearch: string;
  onProductSearch: (v: string) => void;
  allProducts: ProductOption[];
}) {
  const [title, setTitle] = useState(block?.title ?? section.label);
  const [subtitle, setSubtitle] = useState(block?.subtitle ?? "");
  const [displayCount, setDisplayCount] = useState(String(block?.display_count ?? 6));
  const [keywordText, setKeywordText] = useState("");
  const [categories, setCategories] = useState<PopularCategoryConfig[]>([]);
  const [manualIds, setManualIds] = useState<string[]>([]);

  useEffect(() => {
    setTitle(block?.title ?? section.label);
    setSubtitle(block?.subtitle ?? "");
    setDisplayCount(String(block?.display_count ?? 6));
    if (section.hasKeywords) {
      const kws = parseHotSearchKeywords(block?.config ?? null);
      setKeywordText(keywordsToLines(kws));
    }
    if (section.hasCategories) {
      setCategories(parsePopularCategories(block?.config ?? null));
    }
    if (section.hasProductPicker) {
      setManualIds(Array.isArray(block?.manual_ids) ? block!.manual_ids! : []);
    }
  }, [block, section]);

  if (!block) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface-soft p-4 text-sm text-muted-foreground">
        {section.label}（區塊尚未建立，請套用 migration）
      </div>
    );
  }

  const saveBasics = async () => {
    await onPatch(block.id, {
      title: title.trim() || section.label,
      subtitle: subtitle.trim() || null,
      display_count: Number(displayCount) || 6,
    });
  };

  const saveKeywords = async () => {
    const keywords = linesToKeywords(keywordText);
    await onPatch(block.id, {
      config: { ...(block.config ?? {}), keywords },
      source_mode: "manual",
    });
  };

  const saveCategories = async () => {
    await onPatch(block.id, {
      config: { ...(block.config ?? {}), categories },
      source_mode: "manual",
    });
  };

  const saveManualProducts = async () => {
    await onPatch(block.id, {
      manual_ids: manualIds,
      source_mode: "manual",
    });
  };

  const selectedProducts = manualIds
    .map((id) => allProducts.find((p) => p.id === id))
    .filter(Boolean) as ProductOption[];

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-card">
      <div className="flex flex-wrap items-center gap-2 p-4">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-surface-soft text-xs font-bold text-caramel">
          {index + 1}
        </span>
        <button
          type="button"
          onClick={onToggle}
          className="min-w-0 flex-1 text-left"
        >
          <p className="font-semibold text-coffee">{section.label}</p>
          <p className="text-xs text-muted-foreground">{section.description}</p>
        </button>
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-[11px] font-bold",
            block.is_visible ? "bg-success-soft text-success" : "bg-disabled-soft text-disabled"
          )}
        >
          {block.is_visible ? "顯示中" : "已隱藏"}
        </span>
        <Button size="sm" variant="outline" onClick={() => onMove(block, -1)} aria-label="上移">
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={() => onMove(block, 1)} aria-label="下移">
          <ChevronDown className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={saving}
          onClick={() => onPatch(block.id, { is_visible: !block.is_visible })}
        >
          {block.is_visible ? "停用" : "啟用"}
        </Button>
        <Button size="sm" variant="outline" onClick={onToggle}>
          {open ? "收合" : "設定"}
        </Button>
      </div>

      {open ? (
        <div className="space-y-4 border-t border-border bg-surface-soft/40 p-4">
          <div className="grid gap-2 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">區塊標題</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} onBlur={saveBasics} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">副標</label>
              <Input
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                onBlur={saveBasics}
                placeholder="選填"
              />
            </div>
            {section.hasDisplayCount ? (
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  顯示數量
                </label>
                <Input
                  type="number"
                  value={displayCount}
                  onChange={(e) => setDisplayCount(e.target.value)}
                  onBlur={saveBasics}
                  min={1}
                />
              </div>
            ) : (
              <div className="flex items-end">
                <Button size="sm" onClick={saveBasics} disabled={saving}>
                  儲存標題
                </Button>
              </div>
            )}
          </div>

          {section.contentMode === "auto" ? (
            <p className="rounded-lg bg-white px-3 py-2 text-xs text-muted-foreground">
              內容模式：自動排序（依上傳／上架時間）。無需手動挑選。
            </p>
          ) : null}

          {section.hasKeywords ? (
            <div className="rounded-xl border border-border bg-white p-3">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                熱門關鍵字（每行一個，順序＝顯示順序）
              </label>
              <textarea
                className="min-h-[120px] w-full rounded-xl border border-border px-3 py-2 text-sm"
                value={keywordText}
                onChange={(e) => setKeywordText(e.target.value)}
              />
              <Button className="mt-2" size="sm" onClick={saveKeywords} disabled={saving}>
                儲存關鍵字
              </Button>
            </div>
          ) : null}

          {section.hasCategories ? (
            <div className="space-y-2 rounded-xl border border-border bg-white p-3">
              <p className="text-xs font-medium text-muted-foreground">分類項目</p>
              {categories.map((cat, i) => (
                <div key={cat.id} className="grid gap-2 rounded-lg border border-border-soft p-2 sm:grid-cols-4">
                  <Input
                    value={cat.name}
                    onChange={(e) => {
                      const next = [...categories];
                      next[i] = { ...cat, name: e.target.value };
                      setCategories(next);
                    }}
                    placeholder="名稱"
                  />
                  <Input
                    value={cat.href}
                    onChange={(e) => {
                      const next = [...categories];
                      next[i] = { ...cat, href: e.target.value };
                      setCategories(next);
                    }}
                    placeholder="連結"
                  />
                  <Input
                    value={cat.imageUrl ?? ""}
                    onChange={(e) => {
                      const next = [...categories];
                      next[i] = { ...cat, imageUrl: e.target.value };
                      setCategories(next);
                    }}
                    placeholder="圖片網址"
                  />
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      type="button"
                      onClick={() => {
                        if (i === 0) return;
                        const next = [...categories];
                        [next[i - 1], next[i]] = [next[i], next[i - 1]];
                        setCategories(next);
                      }}
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      type="button"
                      onClick={() => {
                        if (i >= categories.length - 1) return;
                        const next = [...categories];
                        [next[i + 1], next[i]] = [next[i], next[i + 1]];
                        setCategories(next);
                      }}
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      type="button"
                      onClick={() => setCategories(categories.filter((_, j) => j !== i))}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  onClick={() =>
                    setCategories([
                      ...categories,
                      {
                        id: `cat-${Date.now()}`,
                        name: "新分類",
                        href: "/baking-materials",
                        imageUrl: "/categories/food.png",
                      },
                    ])
                  }
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  新增分類
                </Button>
                <Button size="sm" onClick={saveCategories} disabled={saving}>
                  儲存分類
                </Button>
              </div>
            </div>
          ) : null}

          {section.hasProductPicker ? (
            <div className="space-y-3 rounded-xl border border-border bg-white p-3">
              <p className="text-xs font-medium text-muted-foreground">
                已選商品（順序＝前台顯示順序）
              </p>
              {selectedProducts.length === 0 ? (
                <p className="text-xs text-muted-foreground">尚未選取，將暫時顯示一般商品列表前幾筆。</p>
              ) : (
                <ul className="space-y-1">
                  {selectedProducts.map((p, i) => (
                    <li
                      key={p.id}
                      className="flex items-center gap-2 rounded-lg border border-border-soft px-2 py-1.5 text-sm"
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate">{p.name}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        type="button"
                        onClick={() => {
                          if (i === 0) return;
                          const next = [...manualIds];
                          [next[i - 1], next[i]] = [next[i], next[i - 1]];
                          setManualIds(next);
                        }}
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        type="button"
                        onClick={() => {
                          if (i >= manualIds.length - 1) return;
                          const next = [...manualIds];
                          [next[i + 1], next[i]] = [next[i], next[i + 1]];
                          setManualIds(next);
                        }}
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        type="button"
                        onClick={() => setManualIds(manualIds.filter((id) => id !== p.id))}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              <Input
                value={productSearch}
                onChange={(e) => onProductSearch(e.target.value)}
                placeholder="搜尋商品以加入…"
              />
              <div className="max-h-40 overflow-y-auto rounded-lg border border-border-soft">
                {products.map((p) => {
                  const selected = manualIds.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      disabled={selected}
                      className={cn(
                        "flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-surface-soft",
                        selected && "opacity-40"
                      )}
                      onClick={() => {
                        if (selected) return;
                        setManualIds([...manualIds, p.id]);
                      }}
                    >
                      <span className="truncate">{p.name}</span>
                      <Plus className="h-3.5 w-3.5 shrink-0" />
                    </button>
                  );
                })}
              </div>
              <Button size="sm" onClick={saveManualProducts} disabled={saving}>
                儲存熱門商品選取
              </Button>
            </div>
          ) : null}

          {section.manageHref ? (
            <Link
              href={section.manageHref}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-semibold text-caramel transition hover:bg-peach-light"
            >
              {section.manageLabel ?? "前往進階管理"}
              <ExternalLink className="h-4 w-4" />
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
