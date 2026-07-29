"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type NavRow = {
  id: string;
  navigation_type: string;
  label: string;
  icon_key: string | null;
  href: string;
  sort_order: number;
  enabled: boolean;
  requires_auth: boolean;
  mobile_visible: boolean;
  desktop_visible: boolean;
};

export default function AdminBrandNavigationPage() {
  const [items, setItems] = useState<NavRow[]>([]);
  const [type, setType] = useState("bottom");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<NavRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch(`/api/admin/brand-system/navigation?type=${encodeURIComponent(type)}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "載入失敗");
        setItems(d.items ?? []);
      })
      .catch((e) => setMessage(e instanceof Error ? e.message : "載入失敗"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/brand-system/navigation", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "儲存失敗");
      setMessage("已儲存");
      setEditing(null);
      load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="導覽管理"
        description="調整名稱、Icon、連結、排序與啟用。樣式幾何固定不可改。"
        actions={
          <div className="flex gap-2">
            <Link href="/admin/side-menu" className={buttonVariants({ size: "sm", variant: "outline" })}>
              既有側邊選單
            </Link>
            <Link href="/admin/brand-system" className={buttonVariants({ size: "sm", variant: "outline" })}>
              返回
            </Link>
          </div>
        }
      />

      {message ? (
        <p className="rounded-lg bg-surface-soft px-3 py-2 text-sm text-coffee">{message}</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {(["bottom", "header", "drawer"] as const).map((t) => (
          <button
            key={t}
            type="button"
            className={buttonVariants({ size: "sm", variant: type === t ? "default" : "outline" })}
            onClick={() => setType(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">載入中…</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-white px-4 py-3 text-sm shadow-card"
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-coffee">{item.label}</p>
                <p className="text-xs text-muted-foreground">
                  {item.icon_key} → {item.href}
                  {!item.enabled ? " · 停用" : ""}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setEditing(item)}>
                編輯
              </Button>
            </li>
          ))}
          {!items.length ? (
            <li className="text-sm text-muted-foreground">此類型尚無項目</li>
          ) : null}
        </ul>
      )}

      {editing ? (
        <div className="space-y-3 rounded-xl border border-border bg-white p-4 shadow-card">
          <p className="font-semibold text-coffee">編輯導覽項</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              value={editing.label}
              onChange={(e) => setEditing({ ...editing, label: e.target.value })}
              placeholder="顯示名稱"
            />
            <Input
              value={editing.icon_key ?? ""}
              onChange={(e) => setEditing({ ...editing, icon_key: e.target.value })}
              placeholder="icon_key"
            />
            <Input
              value={editing.href}
              onChange={(e) => setEditing({ ...editing, href: e.target.value })}
              placeholder="連結"
            />
            <Input
              type="number"
              value={editing.sort_order}
              onChange={(e) =>
                setEditing({ ...editing, sort_order: Number(e.target.value) || 0 })
              }
              placeholder="排序"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={editing.enabled}
              onChange={(e) => setEditing({ ...editing, enabled: e.target.checked })}
            />
            啟用
          </label>
          <div className="flex gap-2">
            <Button disabled={saving} onClick={() => void save()}>
              儲存
            </Button>
            <Button variant="outline" onClick={() => setEditing(null)}>
              取消
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
