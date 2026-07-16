"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { BRAND_NAME, BRAND_SUBTITLE } from "@/lib/env";
import {
  DEFAULT_HEADER_NAV_ITEMS,
  type HeaderNavBadge,
  type HeaderNavItem,
} from "@/lib/site-header";

function createEmptyItem(): HeaderNavItem {
  return {
    id: `nav-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    label: "",
    href: "/",
    icon_emoji: "",
  };
}

export default function AdminSiteHeaderPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [brandTitle, setBrandTitle] = useState(BRAND_NAME);
  const [brandSubtitle, setBrandSubtitle] = useState(BRAND_SUBTITLE);
  const [navItems, setNavItems] = useState<HeaderNavItem[]>(DEFAULT_HEADER_NAV_ITEMS);

  useEffect(() => {
    fetch("/api/admin/site-header")
      .then((r) => r.json())
      .then((d) => {
        setBrandTitle(d?.brandTitle ?? BRAND_NAME);
        setBrandSubtitle(d?.brandSubtitle ?? BRAND_SUBTITLE);
        setNavItems(Array.isArray(d?.navItems) && d.navItems.length > 0 ? d.navItems : DEFAULT_HEADER_NAV_ITEMS);
      })
      .catch(() => setError("載入失敗"))
      .finally(() => setLoading(false));
  }, []);

  const updateItem = (id: string, patch: Partial<HeaderNavItem>) => {
    setNavItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    setNavItems((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      const tmp = next[index];
      next[index] = next[target];
      next[target] = tmp;
      return next;
    });
  };

  const removeItem = (id: string) => {
    setNavItems((prev) => prev.filter((item) => item.id !== id));
  };

  const addItem = () => {
    setNavItems((prev) => [...prev, createEmptyItem()]);
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/site-header", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandTitle,
          brandSubtitle,
          navItems: navItems.map((item) => ({
            ...item,
            label: item.label.trim(),
            href: item.href.trim(),
            icon_emoji: item.icon_emoji?.trim() || undefined,
            badge: item.badge || undefined,
          })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "儲存失敗");

      if (Array.isArray(data.navItems)) setNavItems(data.navItems);
      setBrandTitle(data.brandTitle ?? brandTitle);
      setBrandSubtitle(data.brandSubtitle ?? brandSubtitle);
      setMessage("已儲存，前台頁首會立即更新");
    } catch (e) {
      setError(e instanceof Error ? e.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="頁首設定"
        description="設定品牌文案，並自由新增頁首項目與連結（站內路徑或外部網址）"
        actions={
          <Button onClick={save} disabled={saving || loading}>
            {saving ? "儲存中…" : "儲存設定"}
          </Button>
        }
      />

      {loading ? (
        <p>載入中…</p>
      ) : (
        <>
          {message && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">{message}</p>}
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}

          <div className="space-y-4 rounded-xl bg-white p-4 shadow-card">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-medium text-coffee">品牌主標</p>
                <Input value={brandTitle} onChange={(e) => setBrandTitle(e.target.value)} placeholder="CHIMEIDIY 團購" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-coffee">品牌副標</p>
                <Input
                  value={brandSubtitle}
                  onChange={(e) => setBrandSubtitle(e.target.value)}
                  placeholder="棋美點心屋"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-xl bg-white p-4 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-medium text-coffee">頁首導覽項目</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  可新增項目，並設定名稱與連結。連結可用站內路徑（如 `/live`）或完整網址（如 `https://...`）。
                </p>
              </div>
              <Button type="button" variant="secondary" onClick={addItem}>
                新增項目
              </Button>
            </div>

            {navItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">尚未新增項目，請點「新增項目」。</p>
            ) : (
              <div className="space-y-3">
                {navItems.map((item, index) => (
                  <div key={item.id} className="space-y-3 rounded-xl border border-border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-coffee">項目 {index + 1}</p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={index === 0}
                          onClick={() => moveItem(index, -1)}
                        >
                          上移
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={index === navItems.length - 1}
                          onClick={() => moveItem(index, 1)}
                        >
                          下移
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => removeItem(item.id)}>
                          刪除
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">顯示名稱</p>
                        <Input
                          value={item.label}
                          onChange={(e) => updateItem(item.id, { label: e.target.value })}
                          placeholder="例如：直播專區"
                        />
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">連結</p>
                        <Input
                          value={item.href}
                          onChange={(e) => updateItem(item.id, { href: e.target.value })}
                          placeholder="/live 或 https://line.me/..."
                        />
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">圖示（emoji，選填）</p>
                        <Input
                          value={item.icon_emoji ?? ""}
                          onChange={(e) => updateItem(item.id, { icon_emoji: e.target.value })}
                          placeholder="例如：📡"
                        />
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">標記（選填）</p>
                        <select
                          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                          value={item.badge ?? ""}
                          onChange={(e) =>
                            updateItem(item.id, {
                              badge: (e.target.value || undefined) as HeaderNavBadge | undefined,
                            })
                          }
                        >
                          <option value="">無</option>
                          <option value="hot">HOT</option>
                          <option value="live">LIVE</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end">
              <Button type="button" variant="secondary" onClick={addItem}>
                新增項目
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
