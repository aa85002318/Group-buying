"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type HeroRow = {
  id: string;
  hero_key: string;
  name: string;
  title: string;
  subtitle: string | null;
  desktop_image_url: string | null;
  mobile_image_url: string | null;
  image_alt: string | null;
  search_placeholder: string | null;
  search_scope: string;
  enabled: boolean;
  status: string;
  updated_at: string;
};

export default function AdminBrandHeroesPage() {
  const [heroes, setHeroes] = useState<HeroRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<HeroRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/brand-system/heroes")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "載入失敗");
        setHeroes(d.heroes ?? []);
      })
      .catch((e) => setMessage(e instanceof Error ? e.message : "載入失敗"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (publish = false) => {
    if (!editing) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/brand-system/heroes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editing,
          status: publish ? "published" : editing.status,
          enabled: publish ? true : editing.enabled,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "儲存失敗");
      setMessage(publish ? "已發布" : "已儲存草稿");
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
        title="Brand Hero"
        description="管理各頁主視覺內容（標題、圖片、搜尋提示、熱門標籤）。樣式幾何固定不可改。"
        actions={
          <Link href="/admin/brand-system" className={buttonVariants({ size: "sm", variant: "outline" })}>
            返回總覽
          </Link>
        }
      />

      {message ? (
        <p className="rounded-lg bg-surface-soft px-3 py-2 text-sm text-coffee">{message}</p>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">載入中…</p>
      ) : (
        <ul className="space-y-3">
          {heroes.map((h) => (
            <li
              key={h.id}
              className="rounded-xl border border-border bg-white p-4 shadow-card"
            >
              <div className="flex flex-wrap items-center gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-coffee">
                    {h.name}{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      ({h.hero_key})
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground">{h.title}</p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                    h.status === "published"
                      ? "bg-success-soft text-success"
                      : "bg-disabled-soft text-disabled"
                  )}
                >
                  {h.status}
                </span>
                <Button size="sm" variant="outline" onClick={() => setEditing(h)}>
                  編輯
                </Button>
              </div>
            </li>
          ))}
          {!heroes.length ? (
            <li className="text-sm text-muted-foreground">
              尚無 Hero。請確認已套用 brand_experience_system migration。
            </li>
          ) : null}
        </ul>
      )}

      {editing ? (
        <div className="space-y-3 rounded-xl border border-border bg-white p-4 shadow-card">
          <p className="font-semibold text-coffee">編輯：{editing.name}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              value={editing.title}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              placeholder="主標題"
            />
            <Input
              value={editing.subtitle ?? ""}
              onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })}
              placeholder="副標題"
            />
            <Input
              value={editing.desktop_image_url ?? ""}
              onChange={(e) =>
                setEditing({ ...editing, desktop_image_url: e.target.value })
              }
              placeholder="桌機背景圖 URL"
            />
            <Input
              value={editing.mobile_image_url ?? ""}
              onChange={(e) =>
                setEditing({ ...editing, mobile_image_url: e.target.value })
              }
              placeholder="手機背景圖 URL"
            />
            <Input
              value={editing.search_placeholder ?? ""}
              onChange={(e) =>
                setEditing({ ...editing, search_placeholder: e.target.value })
              }
              placeholder="搜尋提示文字"
            />
            <select
              className="input-field"
              value={editing.search_scope}
              onChange={(e) => setEditing({ ...editing, search_scope: e.target.value })}
            >
              <option value="global">global</option>
              <option value="products">products</option>
              <option value="recipes">recipes</option>
              <option value="courses">courses</option>
              <option value="group_buy">group_buy</option>
              <option value="articles">articles</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button disabled={saving} onClick={() => void save(false)}>
              儲存草稿
            </Button>
            <Button disabled={saving} onClick={() => void save(true)}>
              立即發布
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
