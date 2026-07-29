"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminImageUpload } from "@/components/admin/AdminImageUpload";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AssetRow = {
  id: string;
  name: string;
  asset_type: string;
  file_url: string;
  alt_text: string | null;
  enabled: boolean;
  created_at: string;
};

const ASSET_TYPES = [
  "Logo",
  "IP 主形象",
  "IP 動作",
  "Hero 背景",
  "分類 Icon",
  "Placeholder",
  "社群圖片",
  "課程素材",
  "團購素材",
];

export default function AdminBrandAssetsPage() {
  const [assets, setAssets] = useState<AssetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", asset_type: "Hero 背景", alt_text: "", file_url: "" });

  const load = () => {
    setLoading(true);
    fetch("/api/admin/brand-system/assets")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "載入失敗");
        setAssets(d.assets ?? []);
      })
      .catch((e) => setMessage(e instanceof Error ? e.message : "載入失敗"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.name.trim() || !form.file_url.trim()) {
      setMessage("請填寫名稱並上傳圖片");
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/brand-system/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          asset_type: form.asset_type,
          file_url: form.file_url,
          alt_text: form.alt_text.trim() || null,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "儲存失敗");
      setMessage("已新增素材");
      setForm({ name: "", asset_type: "Hero 背景", alt_text: "", file_url: "" });
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
        title="素材中心"
        description="上傳 Logo、IP、Hero 背景等品牌素材，供各區塊引用。"
        actions={
          <Link href="/admin/brand-system" className={buttonVariants({ size: "sm", variant: "outline" })}>
            返回
          </Link>
        }
      />

      {message ? (
        <p className="rounded-lg bg-surface-soft px-3 py-2 text-sm text-coffee">{message}</p>
      ) : null}

      <div className="space-y-4 rounded-xl border border-border bg-white p-4 shadow-card">
        <p className="font-semibold text-coffee">新增素材</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="素材名稱"
          />
          <select
            className="h-10 rounded-md border border-input bg-white px-3 text-sm"
            value={form.asset_type}
            onChange={(e) => setForm({ ...form, asset_type: e.target.value })}
          >
            {ASSET_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <Input
            className="sm:col-span-2"
            value={form.alt_text}
            onChange={(e) => setForm({ ...form, alt_text: e.target.value })}
            placeholder="Alt 文字（選填）"
          />
        </div>
        <AdminImageUpload
          label="素材圖片"
          hint="建議 WebP／PNG，≤5MB"
          images={form.file_url ? [form.file_url] : []}
          onChange={(urls) => setForm({ ...form, file_url: urls[0] ?? "" })}
          uploadFolder="brand-assets"
          maxImages={1}
          multiple={false}
        />
        <Button disabled={saving} onClick={() => void save()}>新增素材</Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">載入中…</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {assets.map((a) => (
            <li
              key={a.id}
              className="overflow-hidden rounded-xl border border-border bg-white shadow-card"
            >
              <div className="relative aspect-video bg-surface-soft">
                {a.file_url ? (
                  <Image src={a.file_url} alt={a.alt_text ?? a.name} fill className="object-contain p-2" unoptimized />
                ) : null}
              </div>
              <div className="p-3 text-sm">
                <p className="font-semibold text-coffee">{a.name}</p>
                <p className="text-xs text-muted-foreground">{a.asset_type}</p>
              </div>
            </li>
          ))}
          {!assets.length ? (
            <li className="text-sm text-muted-foreground sm:col-span-2 lg:col-span-3">
              尚無素材，請使用上方表單上傳。
            </li>
          ) : null}
        </ul>
      )}
    </div>
  );
}
