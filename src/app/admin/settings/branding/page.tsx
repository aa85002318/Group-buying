"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  BRAND_FONT_OPTIONS,
  DEFAULT_BRANDING,
  type BrandFontId,
  type BrandingSettings,
} from "@/lib/branding";
import { cn } from "@/lib/utils";

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

  // Load Google Fonts preview for picker
  useEffect(() => {
    const families = BRAND_FONT_OPTIONS.map((f) => f.googleFamily).filter(Boolean) as string[];
    if (!families.length) return;
    const href = `https://fonts.googleapis.com/css2?${families
      .map((f) => `family=${f}`)
      .join("&")}&display=swap`;
    let link = document.getElementById("admin-brand-font-preview") as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = "admin-brand-font-preview";
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    link.href = href;
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
      alert("已儲存品牌設定（官網／APP／PWA 共用）");
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
        description="色票與字型會寫入 CSS Variables；官網、APP、PWA 共用同一份設定。"
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
        <div className="space-y-6 rounded-xl bg-white p-4 shadow-card">
          <section className="space-y-3">
            <h2 className="text-base font-bold text-coffee">字型選擇</h2>
            <p className="text-sm text-foreground-secondary">
              已匯入下載字型清單（Noto／昭源／霞鶩／古典等）。內文與標題可分開選，儲存後全站同步。
            </p>
            <FontPicker
              label="內文／介面字型（body）"
              value={(form.bodyFont as BrandFontId) ?? "noto-sans-tc"}
              onChange={(id) => setForm((f) => ({ ...f, bodyFont: id }))}
            />
            <FontPicker
              label="標題字型（heading）"
              value={(form.headingFont as BrandFontId) ?? "noto-sans-tc"}
              onChange={(id) => setForm((f) => ({ ...f, headingFont: id }))}
            />
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-coffee">色票</h2>
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
          </section>

          <Button onClick={() => void save()} disabled={saving}>
            {saving ? "儲存中…" : "儲存品牌設定"}
          </Button>
        </div>
      )}
    </div>
  );
}

function FontPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: BrandFontId;
  onChange: (id: BrandFontId) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-coffee">{label}</p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {BRAND_FONT_OPTIONS.map((opt) => {
          const selected = opt.id === value;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className={cn(
                "rounded-[14px] border p-3 text-left transition",
                selected
                  ? "border-[#FFE149] bg-[#FFF5C7]"
                  : "border-[#E9DED4] bg-white hover:bg-[#FFFBEA]"
              )}
            >
              <p className="text-xs font-semibold text-[#153E73]">{opt.label}</p>
              <p className="mt-2 text-base text-[#2F2925]" style={{ fontFamily: opt.family }}>
                {opt.sample}
              </p>
              <p className="mt-1 text-[11px] text-[#756B64]">{opt.category}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
