"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ShopCmsLiveSaveNotice } from "@/components/admin/shop/ShopCmsLiveSaveNotice";
import { MediaUploader } from "@/components/admin/MediaUploader";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DEFAULT_SHOP_HOME_SETTINGS,
  DEFAULT_SHOP_POPULAR_KEYWORDS,
  DEFAULT_SHOP_PRODUCT_BLOCKS,
  SHOP_WELCOME_YELLOW,
  type ShopHomeSettings,
  type ShopPopularKeyword,
  type ShopProductBlockId,
} from "@/lib/shop/home-settings";
import {
  DEFAULT_SHOP_QUICK_LINKS,
  SHOP_QUICK_LINK_ICON_KEYS,
  type ShopQuickLink,
  type ShopQuickLinkIconKey,
  type ShopQuickLinkTargetType,
} from "@/lib/shop/quick-links";
import {
  CATEGORY_COLOR_PRESETS,
  normalizeCategoryHex,
} from "@/lib/shop/categories";
import {
  SHOP_PROMO_PLACEMENT,
  inferShopPromoLinkType,
  type ShopPromoLinkType,
} from "@/lib/shop/promo-banners";
import type { CmsBanner } from "@/lib/types/database";
import { cn } from "@/lib/utils";

type TabId = "basic" | "quick-links" | "categories" | "banners" | "products";

const TABS: { id: TabId; label: string }[] = [
  { id: "basic", label: "基本設定" },
  { id: "quick-links", label: "快捷入口" },
  { id: "categories", label: "首頁分類" },
  { id: "banners", label: "活動 Banner" },
  { id: "products", label: "商品區塊" },
];

const ICON_LABELS: Record<ShopQuickLinkIconKey, string> = {
  percent: "折扣 %",
  bag: "商品袋",
  flame: "火焰",
  gift: "禮物盒",
  star: "星星",
  tag: "標籤",
};

const TARGET_TYPES: { value: ShopQuickLinkTargetType; label: string }[] = [
  { value: "internal_page", label: "站內頁面" },
  { value: "category", label: "商品分類" },
  { value: "product", label: "商品" },
  { value: "article", label: "文章" },
  { value: "external_url", label: "外部網址" },
];

type CategoryRow = {
  id: string;
  name: string;
  shop_home_icon?: string | null;
  icon_url?: string | null;
  shop_home_bg_color?: string | null;
  shop_home_sort_order?: number | null;
  show_on_shop_home?: boolean;
  is_active?: boolean;
  custom_link?: string | null;
};

function newKwId() {
  return `kw-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function emptyQuickLink(sort: number): ShopQuickLink {
  return {
    ...DEFAULT_SHOP_QUICK_LINKS[0]!,
    id: `new-${Date.now()}`,
    title: "新快捷入口",
    badge_text: null,
    badge_color: null,
    sort_order: sort,
    is_active: true,
  };
}

function toLocalInput(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ShopHomeCms() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as TabId | null;
  const [tab, setTab] = useState<TabId>(
    tabParam && TABS.some((t) => t.id === tabParam) ? tabParam : "basic"
  );

  const [settings, setSettings] = useState<ShopHomeSettings>(DEFAULT_SHOP_HOME_SETTINGS);
  const [keywords, setKeywords] = useState<ShopPopularKeyword[]>(DEFAULT_SHOP_POPULAR_KEYWORDS);
  const [links, setLinks] = useState<ShopQuickLink[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [banners, setBanners] = useState<CmsBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingLink, setEditingLink] = useState<ShopQuickLink | null>(null);
  const [editingBanner, setEditingBanner] = useState<CmsBanner | null>(null);
  const [bannerForm, setBannerForm] = useState({
    title: "",
    image_url: "",
    mobile_image_url: "",
    link_url: "",
    link_type: "page" as ShopPromoLinkType,
    sort_order: "10",
    status: "active" as "active" | "inactive",
    starts_at: "",
    ends_at: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [homeRes, linkRes, catRes, banRes] = await Promise.all([
        fetch("/api/admin/shop/home-settings"),
        fetch("/api/admin/shop/quick-links"),
        fetch("/api/admin/shop/categories"),
        fetch("/api/admin/cms?type=banners"),
      ]);
      const home = await homeRes.json();
      const linkJson = await linkRes.json();
      const catJson = await catRes.json();
      const banJson = await banRes.json();
      if (home.settings) setSettings(home.settings);
      if (Array.isArray(home.keywords) && home.keywords.length) setKeywords(home.keywords);
      setLinks(Array.isArray(linkJson.links) ? linkJson.links : []);
      setCategories(Array.isArray(catJson.categories) ? catJson.categories : []);
      const list = ((banJson.banners ?? []) as CmsBanner[])
        .filter((b) => (b.placement ?? "") === SHOP_PROMO_PLACEMENT)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      setBanners(list);
    } catch {
      /* keep defaults */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const patch = (partial: Partial<ShopHomeSettings>) => {
    setSettings((s) => ({ ...s, ...partial }));
  };

  const saveBasic = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/shop/home-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings, keywords }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "儲存失敗");
      if (d.settings) setSettings(d.settings);
      if (Array.isArray(d.keywords)) setKeywords(d.keywords);
      alert("已儲存（即時上線）");
    } catch (e) {
      alert(e instanceof Error ? e.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  const saveLink = async (link: ShopQuickLink) => {
    setSaving(true);
    try {
      const isNew = link.id.startsWith("new-");
      const res = await fetch(
        isNew ? "/api/admin/shop/quick-links" : `/api/admin/shop/quick-links/${link.id}`,
        {
          method: isNew ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(link),
        }
      );
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "儲存失敗");
      setEditingLink(null);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  const deleteLink = async (id: string) => {
    if (!confirm("確定刪除此快捷入口？")) return;
    await fetch(`/api/admin/shop/quick-links/${id}`, { method: "DELETE" });
    setEditingLink(null);
    await load();
  };

  const saveCategoryHome = async (row: CategoryRow, patchRow: Partial<CategoryRow>) => {
    const res = await fetch(`/api/admin/shop/categories/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        show_on_shop_home: patchRow.show_on_shop_home ?? row.show_on_shop_home,
        shop_home_sort_order: patchRow.shop_home_sort_order ?? row.shop_home_sort_order,
        shop_home_icon: patchRow.shop_home_icon ?? row.shop_home_icon,
        shop_home_bg_color: patchRow.shop_home_bg_color ?? row.shop_home_bg_color,
        custom_link: patchRow.custom_link ?? row.custom_link,
      }),
    });
    const d = await res.json();
    if (!res.ok) {
      alert(d.error ?? "儲存失敗");
      return;
    }
    await load();
  };

  const saveBanner = async () => {
    if (!bannerForm.title.trim() || !bannerForm.image_url.trim()) {
      alert("請填寫標題並上傳桌面圖片（建議 1500×600）");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        kind: "banner" as const,
        title: bannerForm.title.trim(),
        image_url: bannerForm.image_url,
        mobile_image_url: bannerForm.mobile_image_url || null,
        link_url: bannerForm.link_url.trim() || null,
        link_type: bannerForm.link_type,
        placement: SHOP_PROMO_PLACEMENT,
        banner_type: SHOP_PROMO_PLACEMENT,
        sort_order: Number(bannerForm.sort_order) || 0,
        status: bannerForm.status,
        is_active: bannerForm.status === "active",
        starts_at: bannerForm.starts_at ? new Date(bannerForm.starts_at).toISOString() : null,
        ends_at: bannerForm.ends_at ? new Date(bannerForm.ends_at).toISOString() : null,
      };
      const res = await fetch("/api/admin/cms", {
        method: editingBanner ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingBanner ? { ...payload, id: editingBanner.id } : payload),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "儲存失敗");
      setEditingBanner(null);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  const deleteBanner = async (id: string) => {
    if (!confirm("確定刪除此 Banner？")) return;
    await fetch(`/api/admin/banners/${id}`, { method: "DELETE" });
    setEditingBanner(null);
    await load();
  };

  const liveLinks = useMemo(
    () => links.filter((l) => l.is_active).sort((a, b) => a.sort_order - b.sort_order).slice(0, 4),
    [links]
  );
  const liveCats = useMemo(
    () =>
      categories
        .filter((c) => c.show_on_shop_home && c.is_active !== false)
        .sort((a, b) => (a.shop_home_sort_order ?? 100) - (b.shop_home_sort_order ?? 100))
        .slice(0, 5),
    [categories]
  );
  const liveBanner = banners.find((b) => b.is_active !== false);

  const openNewBanner = () => {
    setEditingBanner({} as CmsBanner);
    setBannerForm({
      title: "",
      image_url: "",
      mobile_image_url: "",
      link_url: "",
      link_type: "page",
      sort_order: String((banners.at(-1)?.sort_order ?? 0) + 10),
      status: "active",
      starts_at: "",
      ends_at: "",
    });
  };

  const openEditBanner = (b: CmsBanner) => {
    setEditingBanner(b);
    setBannerForm({
      title: b.title ?? "",
      image_url: b.image_url ?? "",
      mobile_image_url: b.mobile_image_url ?? "",
      link_url: b.link_url ?? "",
      link_type: (b.link_type as ShopPromoLinkType) || inferShopPromoLinkType(b.link_url),
      sort_order: String(b.sort_order ?? 10),
      status: b.is_active === false || b.status === "inactive" ? "inactive" : "active",
      starts_at: toLocalInput(b.starts_at),
      ends_at: toLocalInput(b.ends_at),
    });
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="商城首頁設定"
        description="快捷入口型商城首頁：搜尋、快捷入口、首頁分類、活動 Banner、商品區塊集中維護。"
        actions={
          <Link href="/admin/shop" className={buttonVariants({ variant: "outline" })}>
            回商城 CMS
          </Link>
        }
      />
      <ShopCmsLiveSaveNotice section="home" />

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold",
              tab === t.id
                ? "bg-[#153E73] text-white"
                : "bg-white text-[#153E73] ring-1 ring-[#E5EAF1]"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-[#687386]">載入中…</p>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="space-y-4">
            {tab === "basic" ? (
              <section className="space-y-4 rounded-2xl border border-[#E5EAF1] bg-white p-4">
                <label className="block space-y-1 text-sm">
                  <span className="font-medium text-[#153E73]">商城標題</span>
                  <Input
                    value={settings.shop_title}
                    onChange={(e) => patch({ shop_title: e.target.value })}
                  />
                </label>
                <label className="block space-y-1 text-sm">
                  <span className="font-medium text-[#153E73]">搜尋 Placeholder</span>
                  <Input
                    value={settings.search_placeholder}
                    onChange={(e) => patch({ search_placeholder: e.target.value })}
                  />
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={settings.show_popular_keywords}
                    onChange={(e) => patch({ show_popular_keywords: e.target.checked })}
                  />
                  顯示熱門搜尋關鍵字
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-[#153E73]">背景色</span>
                  <input
                    type="color"
                    value={settings.welcome_background_color}
                    onChange={(e) =>
                      patch({ welcome_background_color: e.target.value.toUpperCase() })
                    }
                    className="h-10 w-14 cursor-pointer rounded border"
                  />
                  <Input
                    value={settings.welcome_background_color}
                    onChange={(e) =>
                      patch({ welcome_background_color: e.target.value.toUpperCase() })
                    }
                    className="max-w-[140px] font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => patch({ welcome_background_color: SHOP_WELCOME_YELLOW })}
                  >
                    還原品牌黃
                  </Button>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-[#153E73]">熱門搜尋關鍵字</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setKeywords((ks) => [
                          ...ks,
                          {
                            id: newKwId(),
                            keyword: "",
                            url: "",
                            sort_order: (ks.length + 1) * 10,
                            is_active: true,
                          },
                        ])
                      }
                    >
                      新增
                    </Button>
                  </div>
                  {keywords.map((k, i) => (
                    <div key={k.id} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                      <Input
                        placeholder="關鍵字"
                        value={k.keyword}
                        onChange={(e) =>
                          setKeywords((ks) =>
                            ks.map((x, idx) =>
                              idx === i ? { ...x, keyword: e.target.value } : x
                            )
                          )
                        }
                      />
                      <Input
                        placeholder="/shop/search?q=…"
                        value={k.url}
                        onChange={(e) =>
                          setKeywords((ks) =>
                            ks.map((x, idx) => (idx === i ? { ...x, url: e.target.value } : x))
                          )
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setKeywords((ks) => ks.filter((_, idx) => idx !== i))}
                      >
                        刪
                      </Button>
                    </div>
                  ))}
                </div>
                <Button type="button" onClick={() => void saveBasic()} disabled={saving}>
                  {saving ? "儲存中…" : "儲存基本設定"}
                </Button>
              </section>
            ) : null}

            {tab === "quick-links" ? (
              <section className="space-y-3 rounded-2xl border border-[#E5EAF1] bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[#687386]">前台最多顯示 4 個（依排序）。沒有資料則整區隱藏。</p>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() =>
                      setEditingLink(
                        emptyQuickLink((links.at(-1)?.sort_order ?? 0) + 10)
                      )
                    }
                  >
                    新增
                  </Button>
                </div>
                {links.map((link) => (
                  <button
                    key={link.id}
                    type="button"
                    onClick={() => setEditingLink(link)}
                    className="flex w-full items-center justify-between rounded-xl border border-[#EEF1F6] px-3 py-2 text-left"
                  >
                    <span className="font-semibold text-[#153E73]">
                      {link.title}
                      {!link.is_active ? (
                        <span className="ml-2 text-xs font-normal text-[#687386]">停用</span>
                      ) : null}
                    </span>
                    <span className="text-xs text-[#687386]">#{link.sort_order}</span>
                  </button>
                ))}
                {editingLink ? (
                  <QuickLinkForm
                    link={editingLink}
                    saving={saving}
                    onChange={setEditingLink}
                    onSave={() => void saveLink(editingLink)}
                    onDelete={() => void deleteLink(editingLink.id)}
                    onCancel={() => setEditingLink(null)}
                  />
                ) : null}
              </section>
            ) : null}

            {tab === "categories" ? (
              <section className="space-y-3 rounded-2xl border border-[#E5EAF1] bg-white p-4">
                <p className="text-sm text-[#687386]">
                  沿用商品分類主檔，不另建資料。最多 5 個 + 固定「全部分類」。完整分類請至{" "}
                  <Link href="/admin/shop/categories" className="underline">
                    商品分類
                  </Link>
                  。
                </p>
                {categories.map((c) => (
                  <div
                    key={c.id}
                    className="grid gap-2 rounded-xl border border-[#EEF1F6] p-3 sm:grid-cols-[auto_1fr_90px_110px]"
                  >
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={Boolean(c.show_on_shop_home)}
                        onChange={(e) =>
                          void saveCategoryHome(c, { show_on_shop_home: e.target.checked })
                        }
                      />
                      <span className="font-semibold text-[#153E73]">{c.name}</span>
                    </label>
                    <MediaUploader
                      url={c.shop_home_icon || c.icon_url || null}
                      folder="shop/categories"
                      label="首頁 Icon"
                      hint="建議 256×256 透明 PNG／WebP"
                      onChange={(next) =>
                        void saveCategoryHome(c, { shop_home_icon: next.url })
                      }
                    />
                    <Input
                      type="number"
                      value={c.shop_home_sort_order ?? 100}
                      onBlur={(e) =>
                        void saveCategoryHome(c, {
                          shop_home_sort_order: Number(e.target.value) || 100,
                        })
                      }
                      onChange={(e) =>
                        setCategories((rows) =>
                          rows.map((r) =>
                            r.id === c.id
                              ? { ...r, shop_home_sort_order: Number(e.target.value) }
                              : r
                          )
                        )
                      }
                    />
                    <div className="flex flex-wrap gap-1">
                      {CATEGORY_COLOR_PRESETS.slice(0, 6).map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          title={color.name}
                          className={cn(
                            "h-6 w-6 rounded-full border",
                            (c.shop_home_bg_color || "").toUpperCase() === color.value
                              ? "ring-2 ring-[#153E73]"
                              : ""
                          )}
                          style={{ backgroundColor: color.value }}
                          onClick={() =>
                            void saveCategoryHome(c, {
                              shop_home_bg_color: normalizeCategoryHex(color.value) ?? color.value,
                            })
                          }
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </section>
            ) : null}

            {tab === "banners" ? (
              <section className="space-y-3 rounded-2xl border border-[#E5EAF1] bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[#687386]">小型 5:2 活動 Banner。無資料則前台跳過。</p>
                  <Button type="button" size="sm" onClick={openNewBanner}>
                    新增
                  </Button>
                </div>
                {banners.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => openEditBanner(b)}
                    className="flex w-full items-center justify-between rounded-xl border border-[#EEF1F6] px-3 py-2 text-left"
                  >
                    <span className="font-semibold text-[#153E73]">{b.title}</span>
                    <span className="text-xs text-[#687386]">
                      {b.is_active === false ? "停用" : "啟用"} · #{b.sort_order}
                    </span>
                  </button>
                ))}
                {editingBanner !== null ? (
                  <div className="space-y-3 rounded-xl bg-[#F8FAFC] p-3">
                    <Input
                      placeholder="標題"
                      value={bannerForm.title}
                      onChange={(e) => setBannerForm((f) => ({ ...f, title: e.target.value }))}
                    />
                    <MediaUploader
                      url={bannerForm.image_url || null}
                      folder="shop/banners"
                      label="Desktop 圖"
                      hint="建議 1500×600 px、PNG／JPG／WebP、5MB 以下"
                      aspect="banner52"
                      onChange={(next) =>
                        setBannerForm((f) => ({ ...f, image_url: next.url ?? "" }))
                      }
                    />
                    <MediaUploader
                      url={bannerForm.mobile_image_url || null}
                      folder="shop/banners"
                      label="Mobile 圖（選填）"
                      hint="建議 1080×900 px"
                      onChange={(next) =>
                        setBannerForm((f) => ({ ...f, mobile_image_url: next.url ?? "" }))
                      }
                    />
                    <Input
                      placeholder="連結 URL"
                      value={bannerForm.link_url}
                      onChange={(e) => setBannerForm((f) => ({ ...f, link_url: e.target.value }))}
                    />
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Input
                        type="datetime-local"
                        value={bannerForm.starts_at}
                        onChange={(e) =>
                          setBannerForm((f) => ({ ...f, starts_at: e.target.value }))
                        }
                      />
                      <Input
                        type="datetime-local"
                        value={bannerForm.ends_at}
                        onChange={(e) =>
                          setBannerForm((f) => ({ ...f, ends_at: e.target.value }))
                        }
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Input
                        type="number"
                        className="w-24"
                        value={bannerForm.sort_order}
                        onChange={(e) =>
                          setBannerForm((f) => ({ ...f, sort_order: e.target.value }))
                        }
                      />
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={bannerForm.status === "active"}
                          onChange={(e) =>
                            setBannerForm((f) => ({
                              ...f,
                              status: e.target.checked ? "active" : "inactive",
                            }))
                          }
                        />
                        啟用
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" onClick={() => void saveBanner()} disabled={saving}>
                        儲存 Banner
                      </Button>
                      {editingBanner.id ? (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => void deleteBanner(editingBanner.id)}
                        >
                          刪除
                        </Button>
                      ) : null}
                      <Button type="button" variant="ghost" onClick={() => setEditingBanner(null)}>
                        取消
                      </Button>
                    </div>
                  </div>
                ) : null}
              </section>
            ) : null}

            {tab === "products" ? (
              <section className="space-y-4 rounded-2xl border border-[#E5EAF1] bg-white p-4">
                {(["popular", "new", "featured"] as ShopProductBlockId[]).map((id) => {
                  const block = settings.product_blocks?.[id] ?? DEFAULT_SHOP_PRODUCT_BLOCKS[id];
                  const labels = { popular: "熱門商品", new: "新品上架", featured: "精選商品" };
                  return (
                    <div key={id} className="space-y-2 rounded-xl border border-[#EEF1F6] p-3">
                      <label className="flex items-center gap-2 font-semibold text-[#153E73]">
                        <input
                          type="checkbox"
                          checked={block.visible}
                          onChange={(e) =>
                            patch({
                              product_blocks: {
                                ...settings.product_blocks,
                                [id]: { ...block, visible: e.target.checked },
                              },
                            })
                          }
                        />
                        {labels[id]}
                      </label>
                      <Input
                        value={block.title}
                        onChange={(e) =>
                          patch({
                            product_blocks: {
                              ...settings.product_blocks,
                              [id]: { ...block, title: e.target.value },
                            },
                          })
                        }
                      />
                      <label className="block text-sm text-[#687386]">
                        最大顯示數量
                        <Input
                          type="number"
                          min={4}
                          max={12}
                          value={block.limit}
                          onChange={(e) =>
                            patch({
                              product_blocks: {
                                ...settings.product_blocks,
                                [id]: {
                                  ...block,
                                  limit: Number(e.target.value) || block.limit,
                                },
                              },
                            })
                          }
                        />
                      </label>
                    </div>
                  );
                })}
                <p className="text-sm text-[#687386]">
                  熱門＝商品主檔 HOT；新品＝NEW，可設 new_until 到期自動取消；精選＝首頁推薦。無資料則前台隱藏該區。
                </p>
                <Button type="button" onClick={() => void saveBasic()} disabled={saving}>
                  {saving ? "儲存中…" : "儲存商品區塊"}
                </Button>
              </section>
            ) : null}
          </div>

          <aside className="xl:sticky xl:top-4">
            <p className="mb-2 text-sm font-semibold text-[#153E73]">手機版預覽（390px）</p>
            <div
              className="mx-auto overflow-hidden rounded-[28px] border-[8px] border-[#153E73] bg-[#FFFEFA] shadow-lg"
              style={{ width: 390 }}
            >
              <div
                className="px-4 pb-3 pt-8"
                style={{ backgroundColor: settings.welcome_background_color }}
              >
                <div className="mb-3 flex items-center justify-between text-[#153E73]">
                  <span className="h-8 w-8 rounded-full bg-white" />
                  <span className="text-[17px] font-bold">{settings.shop_title || "商城"}</span>
                  <span className="flex gap-1">
                    <span className="h-8 w-8 rounded-full bg-white" />
                    <span className="h-8 w-8 rounded-full bg-white" />
                  </span>
                </div>
                <div className="flex h-[52px] items-center rounded-full border border-[#E9EDF2] bg-white px-4 text-[13px] text-[#6B7280]">
                  {settings.search_placeholder}
                </div>
                {liveLinks.length ? (
                  <div className="mt-3 flex gap-1.5">
                    {liveLinks.map((l) => (
                      <div
                        key={l.id}
                        className="relative flex min-h-[64px] flex-1 flex-col items-center justify-center rounded-[12px] border border-[#F3E7B8] bg-white px-1 text-[11px] font-semibold text-[#153E73]"
                      >
                        {l.badge_text ? (
                          <span className="absolute right-1 top-1 rounded bg-[#F16458] px-1 text-[8px] text-white">
                            {l.badge_text}
                          </span>
                        ) : null}
                        {l.title}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="grid grid-cols-6 gap-1 px-4 py-4">
                {liveCats.map((c) => (
                  <div key={c.id} className="flex flex-col items-center gap-1">
                    <div
                      className="h-12 w-12 rounded-full"
                      style={{ backgroundColor: c.shop_home_bg_color || "#FFF5CC" }}
                    />
                    <span className="truncate text-[10px] text-[#153E73]">{c.name}</span>
                  </div>
                ))}
                <div className="flex flex-col items-center gap-1">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F1F4F8] text-[10px] text-[#153E73]">
                    全
                  </div>
                  <span className="text-[10px] text-[#153E73]">全部分類</span>
                </div>
              </div>
              {liveBanner?.image_url || liveBanner?.mobile_image_url ? (
                <div className="px-4 pb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={liveBanner.mobile_image_url || liveBanner.image_url || ""}
                    alt=""
                    className="h-[120px] w-full rounded-[16px] object-cover"
                  />
                </div>
              ) : (
                <p className="px-4 pb-4 text-center text-[11px] text-[#687386]">（無活動 Banner）</p>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function QuickLinkForm({
  link,
  saving,
  onChange,
  onSave,
  onDelete,
  onCancel,
}: {
  link: ShopQuickLink;
  saving: boolean;
  onChange: (next: ShopQuickLink) => void;
  onSave: () => void;
  onDelete: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-3 rounded-xl bg-[#F8FAFC] p-3">
      <Input
        value={link.title}
        onChange={(e) => onChange({ ...link, title: e.target.value })}
        placeholder="標題"
      />
      <Input
        value={link.subtitle ?? ""}
        onChange={(e) => onChange({ ...link, subtitle: e.target.value || null })}
        placeholder="副標（選填）"
      />
      <label className="block text-sm">
        圖示類型
        <select
          className="mt-1 w-full rounded-md border px-3 py-2"
          value={link.icon_type}
          onChange={(e) =>
            onChange({
              ...link,
              icon_type: e.target.value === "custom_image" ? "custom_image" : "system_icon",
            })
          }
        >
          <option value="system_icon">系統圖示</option>
          <option value="custom_image">自訂圖片</option>
        </select>
      </label>
      {link.icon_type === "system_icon" ? (
        <select
          className="w-full rounded-md border px-3 py-2"
          value={link.icon_key}
          onChange={(e) =>
            onChange({ ...link, icon_key: e.target.value as ShopQuickLinkIconKey })
          }
        >
          {SHOP_QUICK_LINK_ICON_KEYS.map((k) => (
            <option key={k} value={k}>
              {ICON_LABELS[k]}
            </option>
          ))}
        </select>
      ) : (
        <MediaUploader
          url={link.icon_image_url}
          folder="shop/quick-links"
          label="快捷入口圖"
          hint="建議 256×256 透明 PNG／WebP"
          onChange={(next) =>
            onChange({
              ...link,
              icon_image_url: next.url,
              icon_image_path: next.path,
            })
          }
        />
      )}
      <Input
        value={link.target_url}
        onChange={(e) => onChange({ ...link, target_url: e.target.value })}
        placeholder="連結 /shop/… 或 https://…"
      />
      <select
        className="w-full rounded-md border px-3 py-2"
        value={link.target_type}
        onChange={(e) =>
          onChange({ ...link, target_type: e.target.value as ShopQuickLinkTargetType })
        }
      >
        {TARGET_TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
      <div className="grid grid-cols-2 gap-2">
        <Input
          placeholder="Badge（如 HOT）"
          value={link.badge_text ?? ""}
          onChange={(e) => onChange({ ...link, badge_text: e.target.value || null })}
        />
        <Input
          type="number"
          value={link.sort_order}
          onChange={(e) => onChange({ ...link, sort_order: Number(e.target.value) || 0 })}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={link.is_active}
          onChange={(e) => onChange({ ...link, is_active: e.target.checked })}
        />
        啟用
      </label>
      <div className="flex gap-2">
        <Button type="button" onClick={onSave} disabled={saving}>
          儲存
        </Button>
        {!link.id.startsWith("new-") ? (
          <Button type="button" variant="outline" onClick={onDelete}>
            刪除
          </Button>
        ) : null}
        <Button type="button" variant="ghost" onClick={onCancel}>
          取消
        </Button>
      </div>
    </div>
  );
}
