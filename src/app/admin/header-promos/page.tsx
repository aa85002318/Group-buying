"use client";

import { useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DEFAULT_HEADER_PROMO_ITEMS,
  type HeaderPromoFontSize,
  type HeaderPromoItem,
} from "@/lib/site-header";

function createEmptyItem(): HeaderPromoItem {
  return {
    id: `promo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    label: "",
    value: "",
    suffix: "",
    icon_emoji: "",
    href: "",
    font_size: "medium",
  };
}

export default function AdminHeaderPromosPage() {
  const [items, setItems] = useState<HeaderPromoItem[]>(DEFAULT_HEADER_PROMO_ITEMS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/header-promos")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error ?? "載入失敗");
        setItems(Array.isArray(data.promoItems) ? data.promoItems : DEFAULT_HEADER_PROMO_ITEMS);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "載入失敗"))
      .finally(() => setLoading(false));
  }, []);

  const updateItem = (id: string, patch: Partial<HeaderPromoItem>) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    setItems((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/admin/header-promos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promoItems: items.map((item) => ({
            ...item,
            label: item.label.trim(),
            value: item.value?.trim() || undefined,
            suffix: item.suffix?.trim() || undefined,
            icon_emoji: item.icon_emoji?.trim() || undefined,
            href: item.href?.trim() || undefined,
          })),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error ?? "儲存失敗");
      if (Array.isArray(data.promoItems)) setItems(data.promoItems);
      setMessage("快捷資訊已儲存，前台重新整理後立即套用");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="開團快捷資訊"
        description="管理今日開團、即將結團、滿額免運、邀請好友等欄位"
        actions={
          <Button onClick={save} disabled={loading || saving}>
            {saving ? "儲存中…" : "儲存快捷資訊"}
          </Button>
        }
      />

      {message && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">{message}</p>
      )}
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}

      {loading ? (
        <p>載入中…</p>
      ) : (
        <section className="space-y-4 rounded-xl bg-white p-4 shadow-card">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-bold text-coffee">下方開團快捷資訊</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                可自由新增、刪除、排序，並分別調整文字、數字、連結與文字大小。
              </p>
            </div>
            <Button type="button" variant="secondary" onClick={() => setItems((list) => [...list, createEmptyItem()])}>
              新增快捷資訊
            </Button>
          </div>

          {items.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              目前不顯示快捷資訊，可點右上方新增。
            </p>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => (
                <article key={item.id} className="space-y-3 rounded-xl border border-border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-bold text-coffee">快捷資訊 {index + 1}</p>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" size="sm" variant="outline" disabled={index === 0} onClick={() => moveItem(index, -1)}>
                        上移
                      </Button>
                      <Button type="button" size="sm" variant="outline" disabled={index === items.length - 1} onClick={() => moveItem(index, 1)}>
                        下移
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => setItems((list) => list.filter((row) => row.id !== item.id))}>
                        刪除
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    <label className="space-y-2">
                      <span className="text-xs font-medium text-muted-foreground">顯示文字</span>
                      <Input value={item.label} onChange={(event) => updateItem(item.id, { label: event.target.value })} placeholder="例如：今日開團" />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-medium text-muted-foreground">數值（選填）</span>
                      <Input value={item.value ?? ""} onChange={(event) => updateItem(item.id, { value: event.target.value })} placeholder="例如：12" />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-medium text-muted-foreground">單位（選填）</span>
                      <Input value={item.suffix ?? ""} onChange={(event) => updateItem(item.id, { suffix: event.target.value })} placeholder="例如：團" />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-medium text-muted-foreground">圖示 Emoji（選填）</span>
                      <Input value={item.icon_emoji ?? ""} onChange={(event) => updateItem(item.id, { icon_emoji: event.target.value })} placeholder="例如：✨" />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-medium text-muted-foreground">文字大小</span>
                      <select
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                        value={item.font_size ?? "medium"}
                        onChange={(event) =>
                          updateItem(item.id, {
                            font_size: event.target.value as HeaderPromoFontSize,
                          })
                        }
                      >
                        <option value="small">小</option>
                        <option value="medium">中</option>
                        <option value="large">大</option>
                      </select>
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-medium text-muted-foreground">點擊連結（選填）</span>
                      <Input value={item.href ?? ""} onChange={(event) => updateItem(item.id, { href: event.target.value })} placeholder="/products 或 https://..." />
                    </label>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
