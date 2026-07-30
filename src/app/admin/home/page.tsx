"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  GripVertical,
  Plus,
  Trash2,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  HOME_ADMIN_SECTIONS,
  getSectionMeta,
  parseBrandHeadline,
  parseBrandStatementTags,
  parsePopularCategories,
  type BrandStatementTag,
  type HomeAdminSectionMeta,
  type PopularCategoryConfig,
} from "@/lib/home/admin-sections";
import {
  parseHotSearchKeywords,
  type HotSearchKeyword,
} from "@/lib/home/hot-search";
import {
  isHomeSectionKey,
  isSingletonHomeSection,
  type HomeSectionKey,
} from "@/lib/home/section-keys";
import type { HomepageBlock } from "@/lib/types/database";
import { cn } from "@/lib/utils";
import { HomeLayoutPublishBar } from "@/components/admin/HomeLayoutPublishBar";

type ProductOption = {
  id: string;
  name: string;
  image_url?: string | null;
  product_scope?: string | null;
};

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
  const [expanded, setExpanded] = useState<string | null>("hot_searches");
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [cmsPages, setCmsPages] = useState<
    Array<{ id: string; slug: string; title: string; is_published: boolean }>
  >([]);
  const [pageForm, setPageForm] = useState({ slug: "", title: "", content: "" });
  const [pageSaving, setPageSaving] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);
  const [catalogBusy, setCatalogBusy] = useState(false);

  useEffect(() => {
    const section = new URLSearchParams(window.location.search).get("section");
    if (section) setExpanded(section);
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch("/api/admin/cms?source=draft")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "載入失敗");
        setBlocks(d.blocks ?? []);
        setCmsPages(d.pages ?? []);
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
            product_scope: p.product_scope ?? "baking",
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
        body: JSON.stringify({ kind: "block", id, target: "draft", ...updates }),
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

  const createCmsPage = async () => {
    if (!pageForm.slug.trim() || !pageForm.title.trim()) {
      alert("請填寫 slug 與標題");
      return;
    }
    setPageSaving(true);
    try {
      const res = await fetch("/api/admin/cms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "page",
          slug: pageForm.slug.trim(),
          title: pageForm.title.trim(),
          content: pageForm.content.trim() || null,
          is_published: false,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "新增失敗");
      setPageForm({ slug: "", title: "", content: "" });
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "新增失敗");
    } finally {
      setPageSaving(false);
    }
  };

  const toggleCmsPage = async (page: { id: string; is_published: boolean }) => {
    await fetch("/api/admin/cms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "page",
        id: page.id,
        is_published: !page.is_published,
      }),
    });
    load();
  };

  const moveSection = async (block: HomepageBlock, dir: -1 | 1) => {
    const ordered = [...blocks].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    const idx = ordered.findIndex((b) => b.id === block.id);
    const swap = ordered[idx + dir];
    if (!swap) return;
    await patch(block.id, { sort_order: swap.sort_order });
    await patch(swap.id, { sort_order: block.sort_order });
  };

  const addBlock = async (blockKey: HomeSectionKey) => {
    setCatalogBusy(true);
    try {
      const res = await fetch("/api/admin/home/layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_block",
          block_key: blockKey,
          instance_label:
            blockKey === "product_series"
              ? "新系列"
              : blockKey === "banner_strip"
                ? "新 Banner 帶"
                : undefined,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "加入失敗");
      setShowCatalog(false);
      setExpanded(d.block?.id ?? null);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "加入失敗");
    } finally {
      setCatalogBusy(false);
    }
  };

  const removeBlock = async (block: HomepageBlock) => {
    const meta = getSectionMeta(block.block_key);
    if (
      !confirm(
        `確定從草稿移除「${block.instance_label || block.title || meta?.label || block.block_key}」？發布後線上也會刪除。`
      )
    ) {
      return;
    }
    setSavingId(block.id);
    try {
      const res = await fetch("/api/admin/home/layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove_block", block_id: block.id }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "刪除失敗");
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "刪除失敗");
    } finally {
      setSavingId(null);
    }
  };

  const orderedBlocks = [...blocks].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  );

  const catalogItems = HOME_ADMIN_SECTIONS.filter((s) => s.catalog !== false);

  const filterProductsForScope = useCallback(
    (scope: string | undefined) => {
      const q = productSearch.trim().toLowerCase();
      let list = products;
      if (scope) {
        list = list.filter((p) => (p.product_scope ?? "baking") === scope);
      }
      if (!q) return list.slice(0, 40);
      return list.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 40);
    },
    [products, productSearch]
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="首頁／CMS 管理"
        description="編輯草稿版面（不影響線上）。預覽確認後再發布；亦可排程或還原歷史版本。"
      />

      <HomeLayoutPublishBar onChanged={load} />

      <div className="rounded-xl border border-border bg-white p-4 text-sm text-muted-foreground shadow-card">
        <p className="font-semibold text-coffee">相關內容管理</p>
        <ul className="mt-2 grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
          <li>
            <Link className="text-primary underline" href="/admin/home/banners">
              Banner 管理
            </Link>
          </li>
          <li>
            <Link className="text-primary underline" href="/admin/home/search-tags">
              熱門搜尋
            </Link>
          </li>
          <li>
            <Link className="text-primary underline" href="/admin/home/featured-recipes">
              精選食譜
            </Link>
          </li>
          <li>
            <Link className="text-primary underline" href="/admin/home/recipe-kits">
              材料包
            </Link>
          </li>
          <li>
            <Link className="text-primary underline" href="/admin/home/ingredient-categories">
              找材料分類
            </Link>
          </li>
          <li>
            <Link className="text-primary underline" href="/admin/home/featured-products">
              熱賣商品
            </Link>
          </li>
          <li>
            <Link className="text-primary underline" href="/admin/home/featured-courses">
              最新課程
            </Link>
          </li>
          <li>
            <Link className="text-primary underline" href="/admin/home/group-buy-section">
              團購區塊
            </Link>
          </li>
          <li>
            <Link className="text-primary underline" href="/admin/home/quick-menu">
              快捷入口
            </Link>
          </li>
          <li>
            <Link className="text-primary underline" href="/admin/navigation">
              收縮選單
            </Link>
          </li>
          <li>
            <Link className="text-primary underline" href="/admin/settings/branding">
              品牌設定
            </Link>
          </li>
          <li>
            <Link className="text-primary underline" href="/admin/products">
              商品管理
            </Link>
          </li>
          <li>
            <Link className="text-primary underline" href="/admin/group-buy">
              團購活動
            </Link>
          </li>
          <li>
            <Link className="text-primary underline" href="/admin/recipes">
              食譜
            </Link>
          </li>
          <li>
            <Link className="text-primary underline" href="/admin/videos">
              影音
            </Link>
          </li>
          <li>
            <Link className="text-primary underline" href="/admin/articles">
              文章
            </Link>
          </li>
          <li>
            <Link className="text-primary underline" href="/admin/home/inspirations">
              烘焙靈感
            </Link>
          </li>
          <li>
            <Link className="text-primary underline" href="/admin/home/ai-prompts">
              AI 提問
            </Link>
          </li>
        </ul>
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-coffee">首頁區塊（草稿）</h2>
            <p className="text-xs text-muted-foreground">
              可新增多列「系列商品曝光」「Banner 帶」。儲存僅更新草稿，需按上方「發布」才會上線。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowCatalog(true)}>
              <Plus className="mr-1 h-4 w-4" />
              加入區塊
            </Button>
            <Link
              href="/admin/home/preview"
              className={buttonVariants({ size: "sm", variant: "outline" })}
            >
              預覽草稿
            </Link>
          </div>
        </div>

        {showCatalog ? (
          <div className="rounded-xl border border-border bg-white p-4 shadow-card">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="font-semibold text-coffee">區塊庫</p>
              <Button size="sm" variant="ghost" onClick={() => setShowCatalog(false)}>
                關閉
              </Button>
            </div>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {catalogItems.map((item) => {
                const singleton = isSingletonHomeSection(item.id);
                const exists = blocks.some((b) => b.block_key === item.id);
                const disabled = catalogBusy || (singleton && exists);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => void addBlock(item.id)}
                      className={cn(
                        "w-full rounded-xl border border-border-soft p-3 text-left transition hover:bg-surface-soft",
                        disabled && "cursor-not-allowed opacity-40"
                      )}
                    >
                      <p className="text-sm font-semibold text-coffee">{item.label}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                      {singleton ? (
                        <p className="mt-1 text-[11px] font-medium text-caramel">最多一個</p>
                      ) : (
                        <p className="mt-1 text-[11px] font-medium text-success">可重複加入</p>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

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
            {orderedBlocks.map((block, index) => {
              const section =
                getSectionMeta(block.block_key) ??
                ({
                  id: (isHomeSectionKey(block.block_key)
                    ? block.block_key
                    : "popular_baking_products") as HomeSectionKey,
                  label: block.title || block.block_key,
                  description: block.block_key,
                  contentMode: "manual" as const,
                } satisfies HomeAdminSectionMeta);
              const open = expanded === block.id || expanded === block.block_key;
              const pickerScope =
                section.hasProductSeriesSettings
                  ? String(block.config?.product_scope ?? "baking")
                  : section.productScope;
              const pickerProducts = section.hasProductPicker
                ? filterProductsForScope(
                    pickerScope === "chime_select" || pickerScope === "baking"
                      ? pickerScope
                      : undefined
                  )
                : [];
              return (
                <SectionCard
                  key={block.id}
                  section={section}
                  block={block}
                  index={index}
                  open={open}
                  saving={savingId === block.id}
                  onToggle={() => setExpanded(open ? null : block.id)}
                  onPatch={patch}
                  onMove={moveSection}
                  onRemove={removeBlock}
                  products={pickerProducts}
                  productSearch={productSearch}
                  onProductSearch={setProductSearch}
                  allProducts={products}
                />
              );
            })}
            {!loading && orderedBlocks.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                草稿尚無區塊。請按「加入區塊」從區塊庫新增。
              </p>
            ) : null}
          </div>
        )}
      </section>

      <section className="space-y-3 rounded-xl border border-border bg-white p-4 shadow-card">
        <div>
          <h2 className="text-base font-bold text-coffee">CMS 靜態頁面</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            建立草稿頁（slug／標題），可發布或改回草稿。
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <Input
            placeholder="slug（例如 about）"
            value={pageForm.slug}
            onChange={(e) => setPageForm({ ...pageForm, slug: e.target.value })}
          />
          <Input
            placeholder="標題"
            value={pageForm.title}
            onChange={(e) => setPageForm({ ...pageForm, title: e.target.value })}
          />
          <Button onClick={() => void createCmsPage()} disabled={pageSaving}>
            {pageSaving ? "新增中…" : "新增草稿"}
          </Button>
        </div>
        <Input
          placeholder="內容（選填，可之後再編）"
          value={pageForm.content}
          onChange={(e) => setPageForm({ ...pageForm, content: e.target.value })}
        />
        <ul className="space-y-2">
          {cmsPages.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center gap-2 rounded-xl border border-border-soft px-4 py-3 text-sm"
            >
              <span className="min-w-0 flex-1 font-medium text-coffee">
                /{p.slug} — {p.title}
              </span>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                  p.is_published
                    ? "bg-success-soft text-success"
                    : "bg-disabled-soft text-disabled"
                )}
              >
                {p.is_published ? "已發布" : "草稿"}
              </span>
              <Button size="sm" variant="secondary" onClick={() => void toggleCmsPage(p)}>
                {p.is_published ? "改草稿" : "發布"}
              </Button>
            </li>
          ))}
          {!loading && cmsPages.length === 0 ? (
            <li className="text-sm text-muted-foreground">尚無 CMS 頁面</li>
          ) : null}
        </ul>
      </section>
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
  onRemove,
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
  onRemove: (block: HomepageBlock) => Promise<void>;
  products: ProductOption[];
  productSearch: string;
  onProductSearch: (v: string) => void;
  allProducts: ProductOption[];
}) {
  const [title, setTitle] = useState(block?.title ?? section.label);
  const [subtitle, setSubtitle] = useState(block?.subtitle ?? "");
  const [displayCount, setDisplayCount] = useState(String(block?.display_count ?? 6));
  const [viewAllUrl, setViewAllUrl] = useState(block?.view_all_url ?? "");
  const [dataSource, setDataSource] = useState(block?.data_source ?? "");
  const [sourceMode, setSourceMode] = useState<"auto" | "manual">(
    block?.source_mode === "manual" ? "manual" : "auto"
  );
  const [keywordText, setKeywordText] = useState("");
  const [categories, setCategories] = useState<PopularCategoryConfig[]>([]);
  const [brandHeadline, setBrandHeadline] = useState("");
  const [brandTags, setBrandTags] = useState<BrandStatementTag[]>([]);
  const [aiPlaceholder, setAiPlaceholder] = useState("");
  const [aiTargetPath, setAiTargetPath] = useState("/ai");
  const [newDays, setNewDays] = useState("7");
  const [manualIds, setManualIds] = useState<string[]>([]);
  const [instanceLabel, setInstanceLabel] = useState(block?.instance_label ?? "");
  const [seriesScope, setSeriesScope] = useState("baking");
  const [seriesCategoryId, setSeriesCategoryId] = useState("");
  const [seriesBadge, setSeriesBadge] = useState("");
  const [bannerPlacement, setBannerPlacement] = useState("home_custom");
  const [shopEnabled, setShopEnabled] = useState(true);
  const [shopSource, setShopSource] = useState("automatic");
  const [shopSort, setShopSort] = useState("hot");
  const [moreCardTitle, setMoreCardTitle] = useState("更多商品");
  const [moreCardSubtitle, setMoreCardSubtitle] = useState("查看更多烘焙材料");
  const [moreCardLink, setMoreCardLink] = useState("/baking-materials");

  useEffect(() => {
    setTitle(block?.title ?? section.label);
    setSubtitle(block?.subtitle ?? "");
    setDisplayCount(String(block?.display_count ?? 6));
    setViewAllUrl(block?.view_all_url ?? "");
    setDataSource(block?.data_source ?? "");
    setSourceMode(block?.source_mode === "manual" ? "manual" : "auto");
    setInstanceLabel(block?.instance_label ?? "");
    if (section.hasKeywords) {
      const kws = parseHotSearchKeywords(block?.config ?? null);
      setKeywordText(keywordsToLines(kws));
    }
    if (section.hasCategories) {
      setCategories(parsePopularCategories(block?.config ?? null));
    }
    if (section.hasBrandTags) {
      setBrandHeadline(parseBrandHeadline(block?.config ?? null));
      setBrandTags(parseBrandStatementTags(block?.config ?? null));
    }
    if (section.hasAiSettings) {
      const cfg = block?.config ?? {};
      setAiPlaceholder(String(cfg.placeholder ?? ""));
      setAiTargetPath(String(cfg.target_path ?? "/ai"));
    }
    if (section.hasNewDays) {
      const cfg = block?.config ?? {};
      setNewDays(String(cfg.new_days ?? 7));
    }
    if (section.hasProductPicker) {
      setManualIds(Array.isArray(block?.manual_ids) ? block!.manual_ids! : []);
    }
    if (section.hasProductSeriesSettings) {
      const cfg = block?.config ?? {};
      setSeriesScope(String(cfg.product_scope ?? "baking"));
      setSeriesCategoryId(String(cfg.category_id ?? ""));
      setSeriesBadge(String(cfg.badge ?? ""));
    }
    if (section.hasBannerPlacement) {
      const cfg = block?.config ?? {};
      setBannerPlacement(String(cfg.placement ?? "home_custom"));
    }
    if (section.hasIngredientShopSettings) {
      const cfg = block?.config ?? {};
      setShopEnabled(cfg.enabled !== false);
      setShopSource(String(cfg.product_source ?? "automatic"));
      setShopSort(String(cfg.sort_type ?? "hot"));
      setMoreCardTitle(String(cfg.more_card_title ?? "更多商品"));
      setMoreCardSubtitle(String(cfg.more_card_subtitle ?? "查看更多烘焙材料"));
      setMoreCardLink(String(cfg.more_card_link ?? "/baking-materials"));
    }
  }, [block, section]);

  if (!block) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface-soft p-4 text-sm text-muted-foreground">
        {section.label}（區塊尚未建立，請從區塊庫加入）
      </div>
    );
  }

  const saveBasics = async () => {
    await onPatch(block.id, {
      title: title.trim() || section.label,
      subtitle: subtitle.trim() || null,
      display_count: Number(displayCount) || 6,
      view_all_url: viewAllUrl.trim() || null,
      data_source: dataSource.trim() || null,
      source_mode: sourceMode,
      instance_label: instanceLabel.trim() || null,
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

  const saveBrandStatement = async () => {
    await onPatch(block.id, {
      config: {
        ...(block.config ?? {}),
        headline: brandHeadline.trim(),
        tags: brandTags,
      },
      source_mode: "manual",
    });
  };

  const saveAiSettings = async () => {
    await onPatch(block.id, {
      config: {
        ...(block.config ?? {}),
        placeholder: aiPlaceholder.trim(),
        target_path: aiTargetPath.trim() || "/ai",
      },
      source_mode: "manual",
    });
  };

  const saveNewDays = async () => {
    await onPatch(block.id, {
      config: {
        ...(block.config ?? {}),
        new_days: Number(newDays) || 7,
      },
    });
  };

  const saveManualProducts = async () => {
    await onPatch(block.id, {
      manual_ids: manualIds,
      source_mode: "manual",
    });
  };

  const scopeFilteredAll = section.hasProductSeriesSettings
    ? allProducts.filter((p) => (p.product_scope ?? "baking") === seriesScope)
    : section.productScope
      ? allProducts.filter((p) => (p.product_scope ?? "baking") === section.productScope)
      : allProducts;

  const selectedProducts = manualIds
    .map((id) => scopeFilteredAll.find((p) => p.id === id) ?? allProducts.find((p) => p.id === id))
    .filter(Boolean) as ProductOption[];

  const displayName =
    instanceLabel.trim() || title.trim() || section.label;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-card">
      <div className="flex flex-wrap items-center gap-2 p-4">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-surface-soft text-xs font-bold text-caramel">
          {index + 1}
        </span>
        <button type="button" onClick={onToggle} className="min-w-0 flex-1 text-left">
          <p className="font-semibold text-coffee">{displayName}</p>
          <p className="text-xs text-muted-foreground">
            {section.label}
            {block.instance_label ? ` · ${block.block_key}` : ` · ${section.description}`}
          </p>
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
        <Button
          size="sm"
          variant="outline"
          disabled={saving}
          onClick={() => void onRemove(block)}
          aria-label="刪除區塊"
        >
          <Trash2 className="h-4 w-4 text-danger" />
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
              <label className="mb-1 block text-xs font-medium text-muted-foreground">後台別名</label>
              <Input
                value={instanceLabel}
                onChange={(e) => setInstanceLabel(e.target.value)}
                onBlur={saveBasics}
                placeholder="例如：端午麵粉系列"
              />
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
                <label className="mb-1 block text-xs font-medium text-muted-foreground">顯示數量</label>
                <Input
                  type="number"
                  value={displayCount}
                  onChange={(e) => setDisplayCount(e.target.value)}
                  onBlur={saveBasics}
                  min={1}
                />
              </div>
            ) : null}
          </div>

          {section.hasBannerPlacement ? (
            <div className="space-y-2 rounded-xl border border-border bg-white p-3">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Banner placement（對應 Banner 管理版位）
              </label>
              <Input
                value={bannerPlacement}
                onChange={(e) => setBannerPlacement(e.target.value)}
                placeholder="home_strip_xxx"
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  disabled={saving}
                  onClick={() =>
                    onPatch(block.id, {
                      config: { ...(block.config ?? {}), placement: bannerPlacement.trim() },
                      data_source: "banners",
                    })
                  }
                >
                  儲存 placement
                </Button>
                {bannerPlacement.trim() ? (
                  <Link
                    href={`/admin/home/banners?placement=${encodeURIComponent(bannerPlacement.trim())}`}
                    className={buttonVariants({ size: "sm", variant: "outline" })}
                  >
                    管理此版位 Banner
                    <ExternalLink className="ml-1 h-3.5 w-3.5" />
                  </Link>
                ) : null}
              </div>
            </div>
          ) : null}

          {section.hasProductSeriesSettings ? (
            <div className="space-y-2 rounded-xl border border-border bg-white p-3">
              <p className="text-xs font-medium text-muted-foreground">系列商品曝光設定</p>
              <div className="grid gap-2 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">商品範圍</label>
                  <select
                    className="input-field w-full"
                    value={seriesScope}
                    onChange={(e) => setSeriesScope(e.target.value)}
                  >
                    <option value="baking">烘焙材料</option>
                    <option value="chime_select">CHIME 精選</option>
                    <option value="all">全部</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">分類 ID（選填）</label>
                  <Input
                    value={seriesCategoryId}
                    onChange={(e) => setSeriesCategoryId(e.target.value)}
                    placeholder="product_categories.id"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">角標</label>
                  <select
                    className="input-field w-full"
                    value={seriesBadge}
                    onChange={(e) => setSeriesBadge(e.target.value)}
                  >
                    <option value="">無</option>
                    <option value="hot">熱賣</option>
                    <option value="new">新品</option>
                  </select>
                </div>
              </div>
              <Button
                size="sm"
                disabled={saving}
                onClick={() =>
                  onPatch(block.id, {
                    config: {
                      ...(block.config ?? {}),
                      product_scope: seriesScope === "all" ? null : seriesScope,
                      category_id: seriesCategoryId.trim() || null,
                      badge: seriesBadge || null,
                    },
                    source_mode: sourceMode,
                  })
                }
              >
                儲存系列設定
              </Button>
            </div>
          ) : null}

          {section.hasIngredientShopSettings ? (
            <div className="space-y-2 rounded-xl border border-border bg-white p-3">
              <p className="text-xs font-medium text-muted-foreground">一鍵買齊材料區塊設定</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={shopEnabled}
                    onChange={(e) => setShopEnabled(e.target.checked)}
                  />
                  啟用區塊
                </label>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">商品來源</label>
                  <select
                    className="input-field w-full"
                    value={shopSource}
                    onChange={(e) => setShopSource(e.target.value)}
                  >
                    <option value="automatic">automatic</option>
                    <option value="manual">manual</option>
                    <option value="category">category</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">排序</label>
                  <select
                    className="input-field w-full"
                    value={shopSort}
                    onChange={(e) => setShopSort(e.target.value)}
                  >
                    <option value="hot">hot</option>
                    <option value="newest">newest</option>
                    <option value="sales">sales</option>
                    <option value="custom">custom</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">更多商品卡標題</label>
                  <Input value={moreCardTitle} onChange={(e) => setMoreCardTitle(e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">更多商品卡副標</label>
                  <Input value={moreCardSubtitle} onChange={(e) => setMoreCardSubtitle(e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs text-muted-foreground">更多商品卡連結</label>
                  <Input value={moreCardLink} onChange={(e) => setMoreCardLink(e.target.value)} />
                </div>
              </div>
              <Button
                size="sm"
                disabled={saving}
                onClick={() =>
                  onPatch(block.id, {
                    config: {
                      ...(block.config ?? {}),
                      enabled: shopEnabled,
                      product_source: shopSource,
                      sort_type: shopSort,
                      more_card_title: moreCardTitle.trim(),
                      more_card_subtitle: moreCardSubtitle.trim(),
                      more_card_link: moreCardLink.trim(),
                      subtitle: subtitle.trim() || null,
                    },
                    manual_ids: manualIds,
                    source_mode: sourceMode,
                  })
                }
              >
                儲存商品區設定
              </Button>
            </div>
          ) : null}

          {(section.hasViewAllUrl || section.hasDataSource) && (
            <div className="grid gap-2 sm:grid-cols-3">
              {section.hasViewAllUrl ? (
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    查看全部連結
                  </label>
                  <Input
                    value={viewAllUrl}
                    onChange={(e) => setViewAllUrl(e.target.value)}
                    onBlur={saveBasics}
                    placeholder="/recipes"
                  />
                </div>
              ) : null}
              {section.hasDataSource ? (
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    資料來源
                  </label>
                  <select
                    className="input-field w-full"
                    value={dataSource}
                    onChange={(e) => {
                      setDataSource(e.target.value);
                    }}
                    onBlur={saveBasics}
                  >
                    <option value="">預設</option>
                    <option value="auto">auto</option>
                    <option value="manual">manual</option>
                    <option value="mixed">mixed</option>
                    <option value="banners">banners</option>
                    <option value="cms_items">cms_items</option>
                  </select>
                </div>
              ) : null}
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  來源模式
                </label>
                <select
                  className="input-field w-full"
                  value={sourceMode}
                  onChange={(e) => {
                    setSourceMode(e.target.value as "auto" | "manual");
                  }}
                  onBlur={saveBasics}
                >
                  <option value="auto">自動</option>
                  <option value="manual">手動</option>
                </select>
              </div>
            </div>
          )}

          {section.contentMode === "auto" || section.contentMode === "mixed" ? (
            <p className="rounded-lg bg-white px-3 py-2 text-xs text-muted-foreground">
              內容模式：{section.contentMode === "mixed" ? "混合（自動＋手動置頂）" : "自動排序"}。
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

          {section.hasBrandTags ? (
            <div className="space-y-2 rounded-xl border border-border bg-white p-3">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">品牌主標</label>
              <Input
                value={brandHeadline}
                onChange={(e) => setBrandHeadline(e.target.value)}
                placeholder="從靈感到成品，一站完成你的烘焙生活。"
              />
              <p className="text-xs font-medium text-muted-foreground">快捷標籤</p>
              {brandTags.map((tag, i) => (
                <div key={tag.id} className="grid gap-2 rounded-lg border border-border-soft p-2 sm:grid-cols-4">
                  <Input
                    value={tag.label}
                    onChange={(e) => {
                      const next = [...brandTags];
                      next[i] = { ...tag, label: e.target.value };
                      setBrandTags(next);
                    }}
                    placeholder="標籤名稱"
                  />
                  <Input
                    value={tag.href}
                    onChange={(e) => {
                      const next = [...brandTags];
                      next[i] = { ...tag, href: e.target.value };
                      setBrandTags(next);
                    }}
                    placeholder="連結"
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={tag.active}
                      onChange={(e) => {
                        const next = [...brandTags];
                        next[i] = { ...tag, active: e.target.checked };
                        setBrandTags(next);
                      }}
                    />
                    啟用
                  </label>
                  <Button
                    size="sm"
                    variant="outline"
                    type="button"
                    onClick={() => setBrandTags(brandTags.filter((_, j) => j !== i))}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  onClick={() =>
                    setBrandTags([
                      ...brandTags,
                      {
                        id: `tag-${Date.now()}`,
                        label: "新標籤",
                        href: "/",
                        sortOrder: (brandTags.length + 1) * 10,
                        active: true,
                      },
                    ])
                  }
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  新增標籤
                </Button>
                <Button size="sm" onClick={saveBrandStatement} disabled={saving}>
                  儲存品牌定位
                </Button>
              </div>
            </div>
          ) : null}

          {section.hasAiSettings ? (
            <div className="space-y-2 rounded-xl border border-border bg-white p-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    輸入框提示文字
                  </label>
                  <Input
                    value={aiPlaceholder}
                    onChange={(e) => setAiPlaceholder(e.target.value)}
                    placeholder="輸入材料、問題或想做的甜點……"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    目標路徑
                  </label>
                  <Input
                    value={aiTargetPath}
                    onChange={(e) => setAiTargetPath(e.target.value)}
                    placeholder="/ai"
                  />
                </div>
              </div>
              <Button size="sm" onClick={saveAiSettings} disabled={saving}>
                儲存 AI 區塊設定
              </Button>
            </div>
          ) : null}

          {section.hasNewDays ? (
            <div className="rounded-xl border border-border bg-white p-3">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                新品天數（預設 7）
              </label>
              <Input
                type="number"
                min={1}
                value={newDays}
                onChange={(e) => setNewDays(e.target.value)}
                className="max-w-[120px]"
              />
              <Button className="mt-2" size="sm" onClick={saveNewDays} disabled={saving}>
                儲存新品天數
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
                {section.productScope === "baking"
                  ? " — 僅烘焙材料"
                  : section.productScope === "chime_select"
                    ? " — 僅 CHIME 精選"
                    : ""}
              </p>
              {selectedProducts.length === 0 ? (
                <p className="text-xs text-muted-foreground">尚未選取商品。</p>
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
                儲存商品選取
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
