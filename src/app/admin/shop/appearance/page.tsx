"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DEFAULT_SHOP_PAGE_SETTINGS,
  SHOP_HEADER_COLOR_PRESETS,
  normalizeShopHex,
  type ShopPageSettings,
} from "@/lib/shop/page-settings";
import { cn } from "@/lib/utils";

export default function AdminShopAppearancePage() {
  const [settings, setSettings] = useState<ShopPageSettings>(DEFAULT_SHOP_PAGE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [matchHero, setMatchHero] = useState(true);

  useEffect(() => {
    fetch("/api/admin/shop/page-settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) {
          setSettings(d.settings);
          setMatchHero(
            String(d.settings.header_bg_color).toUpperCase() ===
              String(d.settings.hero_bg_color).toUpperCase()
          );
        }
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
      const res = await fetch("/api/admin/shop/page-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          header_bg_color: header,
          hero_bg_color: hero,
          header_border_color: settings.header_border_color,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "儲存失敗");
      setSettings(data.settings);
      alert("已儲存頁首／Hero 底色");
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
        description="設定商城 Header 底色（建議與 Hero 同色銜接）。Logo 使用透明底素材，Hero 無圓角、無白邊。"
        actions={
          <Link href="/admin/shop" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            返回商城 CMS
          </Link>
        }
      />

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
                  value={normalizeShopHex(settings.header_bg_color, "#FCCA30")}
                  onChange={(e) => setHeader(e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded border border-border"
                  aria-label="頁首色盤"
                />
                <Input
                  value={settings.header_bg_color}
                  onChange={(e) => setHeader(e.target.value)}
                  className="max-w-[140px] font-mono uppercase"
                  placeholder="#FCCA30"
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
                    value={normalizeShopHex(settings.hero_bg_color, "#FFD84D")}
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

            <Button onClick={() => void save()} disabled={saving}>
              {saving ? "儲存中…" : "儲存"}
            </Button>
          </div>

          <div className="overflow-hidden rounded-xl bg-white shadow-card">
            <p className="border-b border-border px-4 py-2 text-sm font-medium text-coffee">
              即時預覽
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
