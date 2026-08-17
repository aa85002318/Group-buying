"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ShopCmsLiveSaveNotice } from "@/components/admin/shop/ShopCmsLiveSaveNotice";
import { MediaUploader } from "@/components/admin/MediaUploader";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DEFAULT_SHOP_HOME_SETTINGS,
  DEFAULT_SHOP_POPULAR_KEYWORDS,
  SHOP_WELCOME_YELLOW,
  type ShopDecorationSlot,
  type ShopHomeSettings,
  type ShopPopularKeyword,
} from "@/lib/shop/home-settings";
import { cn } from "@/lib/utils";

function newKwId() {
  return `kw-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export default function AdminShopWelcomePage() {
  const [settings, setSettings] = useState<ShopHomeSettings>(DEFAULT_SHOP_HOME_SETTINGS);
  const [keywords, setKeywords] = useState<ShopPopularKeyword[]>(DEFAULT_SHOP_POPULAR_KEYWORDS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/shop/home-settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) setSettings(d.settings);
        if (Array.isArray(d.keywords) && d.keywords.length) setKeywords(d.keywords);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const patch = (partial: Partial<ShopHomeSettings>) => {
    setSettings((s) => ({ ...s, ...partial }));
  };

  const patchDeco = (index: 0 | 1 | 2, partial: Partial<ShopDecorationSlot>) => {
    setSettings((s) => {
      const next = s.decorations.map((d, i) => (i === index ? { ...d, ...partial } : d));
      return {
        ...s,
        decorations: next as ShopHomeSettings["decorations"],
      };
    });
  };

  const save = async () => {
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

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="IP 歡迎區"
        description="舊版 IP Welcome。版本 C 商城首頁已改為快捷入口，請改到「商城首頁設定」維護。"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/shop/home" className={buttonVariants({ variant: "default" })}>
              商城首頁設定
            </Link>
            <Link
              href="/admin/shop?section=welcome"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              返回商城 CMS
            </Link>
          </div>
        }
      />

      <ShopCmsLiveSaveNotice section="welcome" />

      {loading ? (
        <p className="text-sm text-muted-foreground">載入中…</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5 rounded-xl bg-white p-4 shadow-card">
            <label className="flex items-center justify-between gap-3 rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm text-[#153E73]">
              <span>顯示 IP 歡迎區</span>
              <input
                type="checkbox"
                checked={settings.show_welcome_section}
                onChange={(e) => patch({ show_welcome_section: e.target.checked })}
              />
            </label>

            <MediaUploader
              label="IP 主素材"
              hint="建議使用透明背景 PNG / WebP，尺寸 800 × 800 px 以上，2MB 以下。"
              folder="shop/mascot"
              url={settings.mascot_image_url}
              previewContain
              onChange={(next) =>
                patch({
                  mascot_image_url: next.url,
                  mascot_image_path: next.path,
                  mascot_width: next.width,
                  mascot_height: next.height,
                  mascot_file_size: next.fileSize,
                })
              }
            />

            <label className="block text-sm">
              <span className="mb-1 block font-medium text-coffee">IP Alt Text</span>
              <Input
                value={settings.mascot_alt}
                onChange={(e) => patch({ mascot_alt: e.target.value })}
                placeholder="CHIMEiDIY IP"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-coffee">IP 圖片尺寸</span>
                <select
                  className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
                  value={settings.mascot_size}
                  onChange={(e) =>
                    patch({ mascot_size: e.target.value as ShopHomeSettings["mascot_size"] })
                  }
                >
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-coffee">IP 位置</span>
                <select
                  className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
                  value={settings.mascot_position}
                  onChange={(e) =>
                    patch({
                      mascot_position: e.target.value as ShopHomeSettings["mascot_position"],
                    })
                  }
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </label>
            </div>

            <label className="block text-sm">
              <span className="mb-1 block font-medium text-coffee">歡迎小標</span>
              <Input
                value={settings.welcome_eyebrow}
                onChange={(e) => patch({ welcome_eyebrow: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-coffee">歡迎主標</span>
              <Input
                value={settings.welcome_title}
                onChange={(e) => patch({ welcome_title: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-coffee">歡迎副標</span>
              <textarea
                className="min-h-[72px] w-full rounded-md border border-border px-3 py-2 text-sm"
                value={settings.welcome_subtitle}
                onChange={(e) => patch({ welcome_subtitle: e.target.value })}
                maxLength={80}
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block font-medium text-coffee">背景色</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  className="h-10 w-14 cursor-pointer rounded border border-border"
                  value={settings.welcome_background_color}
                  onChange={(e) => patch({ welcome_background_color: e.target.value.toUpperCase() })}
                />
                <Input
                  className="max-w-[140px] font-mono uppercase"
                  value={settings.welcome_background_color}
                  onChange={(e) => patch({ welcome_background_color: e.target.value.toUpperCase() })}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => patch({ welcome_background_color: SHOP_WELCOME_YELLOW })}
                >
                  主黃
                </Button>
              </div>
            </label>

            <label className="block text-sm">
              <span className="mb-1 block font-medium text-coffee">搜尋框 Placeholder</span>
              <Input
                value={settings.search_placeholder}
                onChange={(e) => patch({ search_placeholder: e.target.value })}
              />
            </label>

            <label className="flex items-center justify-between gap-3 rounded-xl border border-[#E7EAF0] px-3 py-2.5 text-sm text-[#153E73]">
              <span>顯示熱門搜尋</span>
              <input
                type="checkbox"
                checked={settings.show_popular_keywords}
                onChange={(e) => patch({ show_popular_keywords: e.target.checked })}
              />
            </label>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-coffee">熱門搜尋內容（最多 5 個）</p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={keywords.length >= 5}
                  onClick={() =>
                    setKeywords((list) => [
                      ...list,
                      {
                        id: newKwId(),
                        keyword: "新關鍵字",
                        url: "/shop/search?q=新關鍵字",
                        sort_order: (list.length + 1) * 10,
                        is_active: true,
                      },
                    ])
                  }
                >
                  新增
                </Button>
              </div>
              {keywords.map((k, i) => (
                <div key={k.id} className="grid grid-cols-[1fr_1fr_auto_auto] items-center gap-2">
                  <Input
                    value={k.keyword}
                    placeholder="keyword"
                    onChange={(e) =>
                      setKeywords((list) =>
                        list.map((row) =>
                          row.id === k.id
                            ? {
                                ...row,
                                keyword: e.target.value,
                                url: `/shop/search?q=${encodeURIComponent(e.target.value)}`,
                              }
                            : row
                        )
                      )
                    }
                  />
                  <Input
                    value={k.url}
                    placeholder="link"
                    onChange={(e) =>
                      setKeywords((list) =>
                        list.map((row) => (row.id === k.id ? { ...row, url: e.target.value } : row))
                      )
                    }
                  />
                  <label className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={k.is_active}
                      onChange={(e) =>
                        setKeywords((list) =>
                          list.map((row) =>
                            row.id === k.id ? { ...row, is_active: e.target.checked } : row
                          )
                        )
                      }
                    />
                    啟用
                  </label>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={i === 0}
                      onClick={() =>
                        setKeywords((list) => {
                          const next = [...list];
                          [next[i - 1], next[i]] = [next[i], next[i - 1]];
                          return next.map((row, idx) => ({ ...row, sort_order: (idx + 1) * 10 }));
                        })
                      }
                    >
                      ↑
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={i === keywords.length - 1}
                      onClick={() =>
                        setKeywords((list) => {
                          const next = [...list];
                          [next[i + 1], next[i]] = [next[i], next[i + 1]];
                          return next.map((row, idx) => ({ ...row, sort_order: (idx + 1) * 10 }));
                        })
                      }
                    >
                      ↓
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setKeywords((list) => list.filter((row) => row.id !== k.id))}
                    >
                      刪
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4 border-t border-border pt-4">
              <p className="text-sm font-medium text-coffee">裝飾素材（最多 3 個，未上傳則不顯示）</p>
              {settings.decorations.map((d, i) => (
                <div key={i} className="rounded-xl border border-[#E7EAF0] p-3">
                  <MediaUploader
                    label={`Decoration ${i + 1}`}
                    hint="小愛心／星星／打蛋器等 PNG，勿擋住 IP 臉與搜尋框。"
                    folder="shop/decoration"
                    url={d.url}
                    previewContain
                    onChange={(next) =>
                      patchDeco(i as 0 | 1 | 2, {
                        url: next.url,
                        path: next.path,
                        enabled: Boolean(next.url),
                      })
                    }
                  />
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <label className="flex items-center gap-2 text-xs text-[#153E73]">
                      <input
                        type="checkbox"
                        checked={d.enabled && Boolean(d.url)}
                        disabled={!d.url}
                        onChange={(e) => patchDeco(i as 0 | 1 | 2, { enabled: e.target.checked })}
                      />
                      開啟
                    </label>
                    <label className="text-xs">
                      大小 {d.size}px
                      <input
                        type="range"
                        min={16}
                        max={48}
                        value={d.size}
                        className="w-full"
                        onChange={(e) =>
                          patchDeco(i as 0 | 1 | 2, { size: Number(e.target.value) })
                        }
                      />
                    </label>
                    <label className="text-xs">
                      位置 X {d.x}%
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={d.x}
                        className="w-full"
                        onChange={(e) => patchDeco(i as 0 | 1 | 2, { x: Number(e.target.value) })}
                      />
                    </label>
                    <label className="text-xs">
                      位置 Y {d.y}%
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={d.y}
                        className="w-full"
                        onChange={(e) => patchDeco(i as 0 | 1 | 2, { y: Number(e.target.value) })}
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <Button onClick={() => void save()} disabled={saving}>
              {saving ? "儲存中…" : "儲存"}
            </Button>
          </div>

          <div className="overflow-hidden rounded-xl bg-white shadow-card">
            <p className="border-b border-border px-4 py-2 text-sm font-medium text-coffee">
              預覽色塊
            </p>
            <div className="px-4 py-6" style={{ backgroundColor: settings.welcome_background_color }}>
              <p className="text-[13px] text-[#153E73]">{settings.welcome_eyebrow}</p>
              <p className="text-[22px] font-extrabold text-[#153E73]">{settings.welcome_title}</p>
              <p className="mt-1 whitespace-pre-line text-sm text-[#153E73]">
                {settings.welcome_subtitle}
              </p>
              {settings.mascot_image_url ? (
                <img
                  src={settings.mascot_image_url}
                  alt=""
                  className="mt-3 h-28 w-auto object-contain"
                />
              ) : (
                <p className="mt-3 text-xs text-[#153E73]/60">尚未上傳 IP（前台會隱藏角色）</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
