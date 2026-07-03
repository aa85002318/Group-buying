"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminImageUpload } from "@/components/admin/AdminImageUpload";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { getCategoryDisplayIcon } from "@/lib/home";
import type { ProductCategory } from "@/lib/types/database";

const EMOJI_OPTIONS = ["🍎", "🥐", "❄️", "🏠", "💊", "💄", "🛋️", "🍪", "🛒", "🥗", "🧴", "📦"];

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ProductCategory | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", icon_emoji: "", icon_url: "" });

  const load = () => {
    setLoading(true);
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openEdit = (c: ProductCategory) => {
    setEditing(c);
    setForm({
      name: c.name,
      icon_emoji: c.icon_emoji ?? "",
      icon_url: c.icon_url ?? "",
    });
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await fetch(`/api/admin/categories/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          icon_emoji: form.icon_emoji || null,
          icon_url: form.icon_url || null,
        }),
      });
      setEditing(null);
      load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader title="分類管理" description="編輯分類名稱與圖示" />

      {editing && (
        <div className="rounded-xl bg-white p-4 shadow-card space-y-4">
          <h2 className="font-medium text-coffee">編輯：{editing.name}</h2>
          <Input placeholder="分類名稱" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />

          <div>
            <p className="mb-2 text-sm font-medium text-coffee">選擇 Emoji 圖示</p>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setForm({ ...form, icon_emoji: emoji, icon_url: "" })}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg border text-xl ${
                    form.icon_emoji === emoji ? "border-primary bg-primary/10" : "border-border"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <AdminImageUpload
            label="或上傳圖片圖示"
            hint="上傳後將優先於 emoji 顯示"
            images={form.icon_url ? [form.icon_url] : []}
            onChange={(images) => setForm({ ...form, icon_url: images[0] ?? "", icon_emoji: "" })}
            uploadFolder="categories"
            maxImages={1}
          />

          <div className="flex gap-2">
            <Button onClick={save} disabled={saving || !form.name}>{saving ? "儲存中…" : "儲存"}</Button>
            <Button variant="secondary" onClick={() => setEditing(null)}>取消</Button>
          </div>
        </div>
      )}

      {loading ? (
        <p>載入中…</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => {
            const icon = getCategoryDisplayIcon(c);
            return (
              <div key={c.id} className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-card">
                {icon.type === "image" ? (
                  <div className="relative h-10 w-10 shrink-0">
                    <Image src={icon.value} alt={c.name} fill className="object-contain" unoptimized />
                  </div>
                ) : (
                  <span className="text-3xl">{icon.value}</span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-coffee">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.slug}</p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => openEdit(c)}>
                  編輯
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
