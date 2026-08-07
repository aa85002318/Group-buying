"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ShopCmsLiveSaveNotice } from "@/components/admin/shop/ShopCmsLiveSaveNotice";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DEFAULT_SHOP_PAGE_SETTINGS,
  SHOP_HEADER_COLOR_PRESETS,
  normalizeShopHex,
  type ShopPageSettings,
} from "@/lib/shop/page-settings";
import {
  DEFAULT_SHOP_LAYOUT,
  mergeShopLayoutSettings,
  type ShopLayoutSettings,
} from "@/lib/shop/layout-settings";
import { cn } from "@/lib/utils";

export default function AdminShopAppearancePage() {
  const [layout, setLayout] = useState<ShopLayoutSettings>(DEFAULT_SHOP_LAYOUT);
  const [settings, setSettings] = useState<ShopPageSettings>(DEFAULT_SHOP_PAGE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [matchHero, setMatchHero] = useState(true);

  useEffect(() => {
    fetch("/api/admin/shop/layout")
      .then((r) => r.json())
      .then((d) => {
        const next = mergeShopLayoutSettings(d.settings ?? DEFAULT_SHOP_LAYOUT);
        setLayout(next);
        setSettings(next.appearance);
        setMatchHero(
          String(next.appearance.header_bg_color).toUpperCase() ===
            String(next.appearance.hero_bg_color).toUpperCase()
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const setHeader = (hex: string) => {
    const next = normalizeShopHex(hex, settings.header_bg_color);
    setSettings((s) => ({
      ...s,
      header_bg_color: next,
      hero_bg_color: matchHero ? next : s.hero_bg_color,
    }));
  };

  const save = async () => {
    const header = normalizeShopHex(settings.header_bg_color, "");
    const hero = normalizeShopHex(
      matchHero ? settings.header_bg_color : settings.hero_bg_color,
      ""
    );
    if (!header || !hero) {
      alert("顏色須為 #RRGGBB");
      return;
    }
    setSaving(true);
    try {
      const nextLayout = mergeShopLayoutSettings({
        ...layout,
        appearance: {
          header_bg_color: header,
          hero_bg_color: hero,
          header_border_color: settings.header_border_color,
        },
      });
      const res = await fetch("/api/admin/shop/layout", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: nextLayout }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "儲存失敗");
      const saved = mergeShopLayoutSettings(data.settings ?? nextLayout);
      setLayout(saved);
      setSettings(saved.appearance);
      alert("已寫入版面草稿（尚未上線）。請回商城 CMS 發布。");
    } catch (e) {
      alert(e instanceof Error ? e.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="商城頁首／Hero 外觀"
        description="設定商城 Header 底色（建議與 Hero 同色銜接）。寫入版面草稿，發布後才上線。"
        actions={
          <Link
            href="/admin/shop?section=appearance"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            返回商城 CMS
          </Link>
        }
      />

      <ShopCmsLiveSaveNotice section="appearance" draftMode />

      {loading ? (
        <p className="text-sm text-muted-foreground">載入中…</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4 rounded-xl bg-white p-4 shadow-card">
            <div>
              <p className="mb-2 text-sm font-medium text-coffee">頁首底色</p>
              <div className="mb-3 flex flex-wrap gap-2">
                {SHOP_HEADER_COLOR_PRESETS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    title={c.name}
                    aria-label={c.name}
                    className={cn(
                      "h-10 w-10 rounded-full border-2",
                      settings.header_bg_color.toUpperCase() === c.value
                        ? "border-[#153E73] ring-2 ring-[#153E73]/20"
                        : "border-white shadow-sm"
                    )}
                    style={{ backgroundColor: c.value }}
                    onClick={() => setHeader(c.value)}
                  />
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="color"
                  value={normalizeShopHex(settings.header_bg_color, "#FDE045")}
                  onChange={(e) => setHeader(e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded border border-border"
                  aria-label="頁首色盤"
                />
                <Input
                  value={settings.header_bg_color}
                  onChange={(e) => setHeader(e.target.value)}
                  className="max-w-[140px] font-mono uppercase"
                  placeholder="#FDE045"
                />
              </div>
            </div>

            <label className="inline-flex items-center gap-2 text-sm text-coffee">
              <input
                type="checkbox"
                checked={matchHero}
                onChange={(e) => {
                  const on = e.target.checked;
                  setMatchHero(on);
                  if (on) {
                    setSettings((s) => ({
                      ...s,
                      hero_bg_color: s.header_bg_color,
                    }));
                  }
                }}
              />
              Hero 底色與頁首相同（建議開啟，避免白邊／色差）
            </label>

            {!matchHero ? (
              <div>
                <p className="mb-2 text-sm font-medium text-coffee">Hero 底色</p>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="color"
                    value={normalizeShopHex(settings.hero_bg_color, "#FDE045")}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        hero_bg_color: normalizeShopHex(e.target.value, s.hero_bg_color),
                      }))
                    }
                    className="h-10 w-14 cursor-pointer rounded border border-border"
                  />
                  <Input
                    value={settings.hero_bg_color}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        hero_bg_color: e.target.value,
                      }))
                    }
                    className="max-w-[140px] font-mono uppercase"
                  />
                </div>
              </div>
            ) : null}

            <div>
              <p className="mb-2 text-sm font-medium text-coffee">頁首底部分隔線（選填）</p>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  value={settings.header_border_color ?? ""}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      header_border_color: e.target.value || null,
                    }))
                  }
                  className="max-w-[140px] font-mono uppercase"
                  placeholder="空白＝無分隔線"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setSettings((s) => ({ ...s, header_border_color: null }))
                  }
                >
                  清除
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => void save()} disabled={saving}>
                {saving ? "儲存中…" : "儲存至版面草稿"}
              </Button>
              <Link
                href="/admin/shop?section=appearance"
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                回 Hub 發布
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl bg-white shadow-card">
            <p className="border-b border-border px-4 py-2 text-sm font-medium text-coffee">
              草稿預覽色塊
            </p>
            <div
              className="px-4 py-3"
              style={{ backgroundColor: settings.header_bg_color }}
            >
              <p className="text-sm font-bold text-[#153E73]">CHIMEIDIY · Lifestyle</p>
              <p className="text-[11px] text-[#153E73]/70">頁首（透明 Logo 區）</p>
            </div>
            <div
              className="flex aspect-[5/2] items-center justify-center text-sm font-medium text-[#153E73]/80"
              style={{ backgroundColor: settings.hero_bg_color }}
            >
              Hero Banner 區域（無圓角）
            </div>
            <div className="bg-white px-4 py-3 text-xs text-muted-foreground">
              下方為搜尋欄／白底內容區
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
