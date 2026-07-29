"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  DEFAULT_BRANDING,
  type BrandingSettings,
} from "@/lib/branding";

export default function AdminBrandingPage() {
  const [form, setForm] = useState<BrandingSettings>(DEFAULT_BRANDING);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/branding")
      .then((r) => r.json())
      .then((d) => {
        if (d.branding) setForm({ ...DEFAULT_BRANDING, ...d.branding });
      })
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "儲存失敗");
      if (data.branding) setForm(data.branding);
      alert("已儲存品牌設定");
    } catch (e) {
      alert(e instanceof Error ? e.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  const set = (key: keyof BrandingSettings, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="品牌設定"
        description="前台會讀取這些色票寫入 CSS Variables；留空欄位會使用預設值。"
        actions={
          <Link
            href="/admin/home"
            className="inline-flex h-10 items-center rounded-xl border border-border bg-white px-4 text-sm font-semibold text-caramel"
          >
            返回首頁管理
          </Link>
        }
      />

      {loading ? (
        <p className="text-sm text-foreground-secondary">載入中…</p>
      ) : (
        <div className="space-y-3 rounded-xl bg-white p-4 shadow-card">
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["primary", "品牌主色"],
                ["primaryHover", "主色 Hover"],
                ["background", "頁面背景色"],
                ["surface", "卡片背景色"],
                ["title", "標題色"],
                ["text", "內文色"],
                ["border", "邊框色"],
                ["softCoral", "Soft Coral"],
                ["honey", "Honey"],
                ["mint", "Mint"],
                ["sky", "Sky"],
                ["pagePaddingX", "頁面左右間距"],
                ["cardRadius", "預設圓角"],
              ] as Array<[keyof BrandingSettings, string]>
            ).map(([key, label]) => (
              <label key={key} className="space-y-1 text-sm">
                <span className="font-medium text-coffee">{label}</span>
                <Input
                  value={String(form[key] ?? "")}
                  onChange={(e) => set(key, e.target.value)}
                />
              </label>
            ))}
          </div>
          <Button onClick={save} disabled={saving}>
            {saving ? "儲存中…" : "儲存品牌設定"}
          </Button>
        </div>
      )}
    </div>
  );
}
