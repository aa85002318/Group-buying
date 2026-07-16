"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import type { ProductCategory } from "@/lib/types/database";
import { getCategoryDisplayIcon } from "@/lib/home";
import { BRAND_NAME, BRAND_SUBTITLE } from "@/lib/env";

const PAGE_OPTIONS = [
  { key: "products", label: "全部商品" },
  { key: "group_buy", label: "熱門團購" },
  { key: "live", label: "直播專區" },
  { key: "videos", label: "影音專區" },
  { key: "articles", label: "文章專區" },
] as const;

type SiteHeaderSettingsForm = {
  brandTitle: string;
  brandSubtitle: string;
  pageKeys: string[];
  categoryIds: string[];
};

export default function AdminSiteHeaderPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SiteHeaderSettingsForm>({
    brandTitle: BRAND_NAME,
    brandSubtitle: BRAND_SUBTITLE,
    pageKeys: ["products", "group_buy", "live", "videos", "articles"],
    categoryIds: [],
  });
  const [categories, setCategories] = useState<ProductCategory[]>([]);

  useEffect(() => {
    Promise.all([fetch("/api/admin/site-header").then((r) => r.json()), fetch("/api/admin/categories").then((r) => r.json())])
      .then(([s, c]) => {
        setSettings((prev) => ({
          ...prev,
          brandTitle: s?.brandTitle ?? prev.brandTitle,
          brandSubtitle: s?.brandSubtitle ?? prev.brandSubtitle,
          pageKeys: Array.isArray(s?.pageKeys) ? s.pageKeys : prev.pageKeys,
          categoryIds: Array.isArray(s?.categoryIds) ? s.categoryIds : prev.categoryIds,
        }));
        setCategories(c?.categories ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  const pageKeySet = useMemo(() => new Set(settings.pageKeys), [settings.pageKeys]);
  const categoryIdSet = useMemo(() => new Set(settings.categoryIds), [settings.categoryIds]);

  const togglePageKey = (key: string) => {
    setSettings((prev) => {
      const next = new Set(prev.pageKeys);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return { ...prev, pageKeys: Array.from(next) };
    });
  };

  const toggleCategory = (id: string) => {
    setSettings((prev) => {
      const next = new Set(prev.categoryIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...prev, categoryIds: Array.from(next) };
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/site-header", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandTitle: settings.brandTitle,
          brandSubtitle: settings.brandSubtitle,
          pageKeys: settings.pageKeys,
          categoryIds: settings.categoryIds,
        }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.error ?? "儲存失敗");
      }
    } finally {
      setSaving(false);
    }
    // refresh for updated values
    const next = await fetch("/api/admin/site-header").then((r) => r.json()).catch(() => null);
    if (next) {
      setSettings((prev) => ({
        ...prev,
        brandTitle: next.brandTitle ?? prev.brandTitle,
        brandSubtitle: next.brandSubtitle ?? prev.brandSubtitle,
        pageKeys: Array.isArray(next.pageKeys) ? next.pageKeys : prev.pageKeys,
        categoryIds: Array.isArray(next.categoryIds) ? next.categoryIds : prev.categoryIds,
      }));
    }
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader title="頁首設定" description="設定頁首品牌文案與顯示的直播/影片/文章/商品分類入口" />

      {loading ? (
        <p>載入中…</p>
      ) : (
        <>
          <div className="rounded-xl bg-white p-4 shadow-card space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-medium text-coffee">品牌主標（主名稱）</p>
                <Input
                  value={settings.brandTitle}
                  onChange={(e) => setSettings((prev) => ({ ...prev, brandTitle: e.target.value }))}
                  placeholder="CHIMEIDIY 團購"
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-coffee">品牌副標（副名稱）</p>
                <Input
                  value={settings.brandSubtitle}
                  onChange={(e) => setSettings((prev) => ({ ...prev, brandSubtitle: e.target.value }))}
                  placeholder="棋美點心屋"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl bg-white p-4 shadow-card space-y-3">
              <h2 className="text-sm font-medium text-coffee">指定頁面（直播/影片/文章）</h2>
              <div className="flex flex-wrap gap-2">
                {PAGE_OPTIONS.map((p) => (
                  <label
                    key={p.key}
                    className="flex cursor-pointer items-center gap-2 rounded-full border border-border px-3 py-2 text-sm hover:bg-muted"
                  >
                    <input type="checkbox" checked={pageKeySet.has(p.key)} onChange={() => togglePageKey(p.key)} />
                    <span>{p.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-white p-4 shadow-card space-y-3">
              <h2 className="text-sm font-medium text-coffee">商品分類（可選多個）</h2>
              {categories.length === 0 ? (
                <p className="text-sm text-muted-foreground">尚未建立分類</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {categories.map((c) => {
                    const icon = getCategoryDisplayIcon(c);
                    return (
                      <label
                        key={c.id}
                        className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3 text-sm hover:bg-muted"
                      >
                        {icon.type === "image" ? (
                          <div className="relative h-8 w-8 shrink-0">
                            <Image src={icon.value} alt={c.name} fill className="object-contain" unoptimized />
                          </div>
                        ) : (
                          <span className="text-xl">{icon.value}</span>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium text-coffee">{c.name}</div>
                          <div className="truncate text-xs text-muted-foreground">{c.slug}</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={categoryIdSet.has(c.id)}
                          onChange={() => toggleCategory(c.id)}
                        />
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button onClick={save} disabled={saving}>
              {saving ? "儲存中…" : "儲存設定"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

