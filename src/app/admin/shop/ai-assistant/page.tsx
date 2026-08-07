"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ShopCmsLiveSaveNotice } from "@/components/admin/shop/ShopCmsLiveSaveNotice";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DEFAULT_AI_ASSISTANT_SETTINGS,
  type ShopAiAssistantSettings,
  type ShopAiAssistantTag,
} from "@/lib/shop/ai-recipe-assistant";
import { cn } from "@/lib/utils";

function newTagId() {
  return `tag-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export default function AdminShopAiAssistantPage() {
  const [settings, setSettings] = useState<ShopAiAssistantSettings>(
    DEFAULT_AI_ASSISTANT_SETTINGS
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/shop/ai-assistant")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) setSettings(d.settings);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateTag = (id: string, patch: Partial<ShopAiAssistantTag>) => {
    setSettings((s) => ({
      ...s,
      popular_tags: s.popular_tags.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
  };

  const addTag = () => {
    setSettings((s) => ({
      ...s,
      popular_tags: [
        ...s.popular_tags,
        {
          id: newTagId(),
          label: "新標籤",
          prompt: "可以做什麼？",
          emoji: "✨",
          sort_order: s.popular_tags.length + 1,
          is_active: true,
        },
      ],
    }));
  };

  const removeTag = (id: string) => {
    setSettings((s) => ({
      ...s,
      popular_tags: s.popular_tags.filter((t) => t.id !== id),
    }));
  };

  const moveTag = (id: string, dir: -1 | 1) => {
    setSettings((s) => {
      const sorted = [...s.popular_tags].sort((a, b) => a.sort_order - b.sort_order);
      const idx = sorted.findIndex((t) => t.id === id);
      const next = idx + dir;
      if (idx < 0 || next < 0 || next >= sorted.length) return s;
      const swapped = [...sorted];
      [swapped[idx], swapped[next]] = [swapped[next], swapped[idx]];
      return {
        ...s,
        popular_tags: swapped.map((t, i) => ({ ...t, sort_order: i + 1 })),
      };
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/shop/ai-assistant", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "儲存失敗");
      setSettings(data.settings);
      alert("已儲存 AI 食譜助手設定");
    } catch (e) {
      alert(e instanceof Error ? e.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="p-6 text-sm text-muted-foreground">載入中…</p>;
  }

  const tags = [...settings.popular_tags].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="AI 食譜助手（Version A）"
        description="商城首頁暖黃功能卡：標題、搜尋、智慧 Prompt 標籤與 IP 圖。非聊天介面。"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/shop?section=ai-assistant" className={cn(buttonVariants({ size: "sm", variant: "outline" }))}>
              返回商城 CMS
            </Link>
            <Link href="/shop" className={cn(buttonVariants({ size: "sm", variant: "outline" }))}>
              前台預覽 /shop
            </Link>
            <Link
              href="/admin/shop/ai-chips"
              className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
            >
              舊版 AI Chip
            </Link>
          </div>
        }
      />

      <ShopCmsLiveSaveNotice section="ai-assistant" />

      <section className="space-y-3 rounded-xl border border-border bg-white p-4 shadow-card">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={settings.is_visible}
            onChange={(e) => setSettings({ ...settings, is_visible: e.target.checked })}
          />
          顯示於商城首頁
        </label>

        <label className="block text-xs font-medium text-muted-foreground">
          標題（可用換行）
          <textarea
            className="input-field mt-1 min-h-[72px]"
            value={settings.title}
            onChange={(e) => setSettings({ ...settings, title: e.target.value })}
          />
        </label>

        <label className="block text-xs font-medium text-muted-foreground">
          副標
          <textarea
            className="input-field mt-1 min-h-[64px]"
            value={settings.subtitle}
            onChange={(e) => setSettings({ ...settings, subtitle: e.target.value })}
          />
        </label>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="block text-xs font-medium text-muted-foreground">
            Placeholder
            <Input
              className="mt-1"
              value={settings.placeholder}
              onChange={(e) => setSettings({ ...settings, placeholder: e.target.value })}
            />
          </label>
          <label className="block text-xs font-medium text-muted-foreground">
            CTA 文字
            <Input
              className="mt-1"
              value={settings.cta_text}
              onChange={(e) => setSettings({ ...settings, cta_text: e.target.value })}
            />
          </label>
          <label className="block text-xs font-medium text-muted-foreground">
            CTA 連結
            <Input
              className="mt-1"
              value={settings.cta_href}
              onChange={(e) => setSettings({ ...settings, cta_href: e.target.value })}
            />
          </label>
          <label className="block text-xs font-medium text-muted-foreground">
            背景色
            <Input
              className="mt-1"
              value={settings.background_color}
              onChange={(e) => setSettings({ ...settings, background_color: e.target.value })}
            />
          </label>
          <label className="block text-xs font-medium text-muted-foreground">
            IP 圖片 URL
            <Input
              className="mt-1"
              value={settings.ip_image_url}
              onChange={(e) => setSettings({ ...settings, ip_image_url: e.target.value })}
            />
          </label>
          <label className="block text-xs font-medium text-muted-foreground">
            背景圖 URL（選填）
            <Input
              className="mt-1"
              value={settings.background_image_url ?? ""}
              onChange={(e) =>
                setSettings({ ...settings, background_image_url: e.target.value || null })
              }
            />
          </label>
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-border bg-white p-4 shadow-card">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-coffee">熱門／智慧 Prompt 標籤</h2>
          <Button type="button" size="sm" variant="outline" onClick={addTag}>
            新增標籤
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          點標籤會帶完整 prompt 導向 AI（例如「家裡只有雞蛋可以做什麼？」）。可排序、停用、刪除。
        </p>
        <div className="space-y-3">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="grid gap-2 rounded-lg border border-[#F0E6C8] bg-[#FFFDF6] p-3 md:grid-cols-[auto_1fr_1fr_auto]"
            >
              <Input
                className="w-16"
                value={tag.emoji ?? ""}
                onChange={(e) => updateTag(tag.id, { emoji: e.target.value })}
                placeholder="emoji"
              />
              <Input
                value={tag.label}
                onChange={(e) => updateTag(tag.id, { label: e.target.value })}
                placeholder="標籤文字"
              />
              <Input
                value={tag.prompt}
                onChange={(e) => updateTag(tag.id, { prompt: e.target.value })}
                placeholder="完整 prompt"
              />
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={tag.is_active}
                    onChange={(e) => updateTag(tag.id, { is_active: e.target.checked })}
                  />
                  啟用
                </label>
                <Button type="button" size="sm" variant="ghost" onClick={() => moveTag(tag.id, -1)}>
                  ↑
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => moveTag(tag.id, 1)}>
                  ↓
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => removeTag(tag.id)}>
                  刪
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Button onClick={save} disabled={saving}>
        {saving ? "儲存中…" : "儲存設定"}
      </Button>
    </div>
  );
}
