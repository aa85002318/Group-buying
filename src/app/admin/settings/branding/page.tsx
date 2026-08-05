"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminBrandFontPicker } from "@/components/admin/AdminBrandFontPicker";
import {
  BRAND_FONT_OPTIONS,
  DEFAULT_BRANDING,
  type BrandingSettings,
} from "@/lib/branding";

type FontStatus = {
  id: string;
  label: string;
  file: string;
  uploaded: boolean;
  url: string | null;
  googleFamily: string | null;
};

export default function AdminBrandingPage() {
  const [form, setForm] = useState<BrandingSettings>(DEFAULT_BRANDING);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fontStatus, setFontStatus] = useState<FontStatus[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const refreshFonts = () =>
    fetch("/api/admin/branding/fonts")
      .then((r) => r.json())
      .then((d) => setFontStatus(d.fonts ?? []))
      .catch(() => {});

  useEffect(() => {
    fetch("/api/admin/branding")
      .then((r) => r.json())
      .then((d) => {
        if (d.branding) setForm({ ...DEFAULT_BRANDING, ...d.branding });
      })
      .finally(() => setLoading(false));
    void refreshFonts();
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

  const onUploadFonts = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setUploadMsg(null);
    try {
      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append("file", f));
      const res = await fetch("/api/admin/branding/fonts", { method: "POST", body: fd });
      const data = await res.json();
      const results = (data.results ?? []) as Array<{
        file: string;
        ok: boolean;
        error?: string;
      }>;
      const ok = results.filter((r) => r.ok).length;
      const fail = results.filter((r) => !r.ok);
      setUploadMsg(
        fail.length
          ? `成功 ${ok} 個；失敗：${fail.map((f) => `${f.file}（${f.error}）`).join("；")}`
          : `已上傳 ${ok} 個字型檔至 brand-fonts（官網／APP／PWA 共用）`
      );
      await refreshFonts();
    } catch (e) {
      setUploadMsg(e instanceof Error ? e.message : "上傳失敗");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const expectedFiles = BRAND_FONT_OPTIONS.filter((f) => f.file)
    .map((f) => f.file)
    .join("、");

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="品牌設定"
        description="色票與字型會寫入 CSS Variables；官網、APP、PWA 共用同一份設定。"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/articles"
              className="inline-flex h-10 items-center rounded-xl border border-border bg-white px-4 text-sm font-semibold text-caramel"
            >
              文章字型編輯
            </Link>
            <Link
              href="/admin/home"
              className="inline-flex h-10 items-center rounded-xl border border-border bg-white px-4 text-sm font-semibold text-caramel"
            >
              返回首頁管理
            </Link>
          </div>
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
              單篇文章可在「文章管理」另設標題／內文字型。
            </p>
            <AdminBrandFontPicker
              label="內文／介面字型（body）"
              value={form.bodyFont ?? "noto-sans-tc"}
              onChange={(id) => setForm((f) => ({ ...f, bodyFont: id ?? "noto-sans-tc" }))}
            />
            <AdminBrandFontPicker
              label="標題字型（heading）"
              value={form.headingFont ?? "noto-sans-tc"}
              onChange={(id) => setForm((f) => ({ ...f, headingFont: id ?? "noto-sans-tc" }))}
            />
          </section>

          <section className="space-y-3 rounded-xl border border-[#E9DED4] bg-[#FFFCF7] p-4">
            <h2 className="text-base font-bold text-coffee">自架字型檔（Storage）</h2>
            <p className="text-sm text-foreground-secondary">
              將下載的 TTF 上傳至 <code className="text-xs">brand-fonts</code>
              ，官網／APP／PWA 與後台選擇共用。優先仍可用 Google Fonts CDN；自架檔作為備援。
            </p>
            <p className="text-xs text-foreground-secondary">檔名需為：{expectedFiles}</p>
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf"
                multiple
                className="hidden"
                onChange={(e) => void onUploadFonts(e.target.files)}
              />
              <Button
                type="button"
                variant="secondary"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                {uploading ? "上傳中…" : "選擇字型檔上傳"}
              </Button>
            </div>
            {uploadMsg && <p className="text-sm text-coffee">{uploadMsg}</p>}
            <ul className="grid gap-2 sm:grid-cols-2">
              {fontStatus.map((f) => (
                <li
                  key={f.id}
                  className="flex items-center justify-between rounded-lg border border-[#E9DED4] bg-white px-3 py-2 text-sm"
                >
                  <span className="text-coffee">{f.label}</span>
                  <span className={f.uploaded ? "text-green-700" : "text-foreground-secondary"}>
                    {f.uploaded ? "已上傳" : "未上傳（可用 CDN）"}
                  </span>
                </li>
              ))}
            </ul>
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
