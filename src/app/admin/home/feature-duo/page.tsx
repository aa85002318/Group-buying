"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminImageUpload } from "@/components/admin/AdminImageUpload";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { FeatureDuoCards } from "@/components/home/FeatureDuoCards";
import {
  DEFAULT_HOME_FEATURE_DUO_ITEMS,
  FEATURE_DUO_IMAGE_SPEC,
  type FeatureDuoLinkTarget,
  type HomeFeatureDuoItem,
} from "@/lib/home/feature-duo";

const emptyForm = {
  slot_key: "",
  title: "",
  image_url: "",
  link_url: "/",
  link_target: "_self" as FeatureDuoLinkTarget,
  alt_text: "",
  notes: "",
  sort_order: "0",
  is_active: true,
};

export default function AdminHomeFeatureDuoPage() {
  const [items, setItems] = useState<HomeFeatureDuoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/home-feature-duo")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "載入失敗");
        setItems(d.items?.length ? d.items : DEFAULT_HOME_FEATURE_DUO_ITEMS);
      })
      .catch(() => setItems(DEFAULT_HOME_FEATURE_DUO_ITEMS))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openEdit = (item: HomeFeatureDuoItem) => {
    setEditingId(item.id);
    setForm({
      slot_key: item.slot_key,
      title: item.title,
      image_url: item.image_url ?? "",
      link_url: item.link_url,
      link_target: item.link_target,
      alt_text: item.alt_text ?? "",
      notes: item.notes ?? "",
      sort_order: String(item.sort_order),
      is_active: item.is_active,
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.title.trim()) {
      alert("請填寫標題（後台辨識用，不會顯示在圖片上）");
      return;
    }
    if (!form.link_url.trim()) {
      alert("請填寫連結網址");
      return;
    }
    if (!form.image_url.trim()) {
      alert("請上傳滿版圖片");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        slot_key: form.slot_key.trim() || `slot-${Date.now()}`,
        title: form.title.trim(),
        image_url: form.image_url.trim(),
        link_url: form.link_url.trim(),
        link_target: form.link_target,
        alt_text: form.alt_text.trim() || null,
        notes: form.notes.trim() || null,
        sort_order: Number(form.sort_order) || 0,
        is_active: form.is_active,
      };

      const res = await fetch("/api/admin/home-feature-duo", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { ...payload, id: editingId } : payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "儲存失敗");
      setShowForm(false);
      setEditingId(null);
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (item: HomeFeatureDuoItem) => {
    await fetch("/api/admin/home-feature-duo", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, is_active: !item.is_active }),
    });
    load();
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="首頁雙卡（AI／直播）"
        description="快捷選單下方兩張滿版圖片卡。前台不顯示文字與箭頭；標題僅供後台辨識。"
      />

      <div className="rounded-xl border border-border bg-white p-4 shadow-card">
        <p className="text-sm font-semibold text-coffee">上傳圖片尺寸</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>
            建議尺寸：{FEATURE_DUO_IMAGE_SPEC.width}×{FEATURE_DUO_IMAGE_SPEC.height} px（比例約{" "}
            {FEATURE_DUO_IMAGE_SPEC.ratioLabel}）
          </li>
          <li>格式：{FEATURE_DUO_IMAGE_SPEC.formats}</li>
          <li>{FEATURE_DUO_IMAGE_SPEC.maxSizeLabel}</li>
          <li>圖片會滿版裁切顯示，請勿在圖上加文字說明</li>
        </ul>
      </div>

      <div className="rounded-xl border border-border bg-surface-soft p-4">
        <p className="mb-3 text-xs font-medium text-muted-foreground">前台預覽</p>
        <div className="mx-auto max-w-[390px]">
          <FeatureDuoCards />
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">載入中…</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-white p-4 shadow-card"
            >
              <div className="relative h-20 w-[136px] shrink-0 overflow-hidden rounded-xl bg-surface-soft">
                {item.image_url ? (
                  <Image
                    src={item.image_url}
                    alt=""
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-coffee">{item.title}</p>
                  <StatusBadge
                    label={item.is_active ? "顯示中" : "已隱藏"}
                    variant={item.is_active ? "default" : "secondary"}
                  />
                </div>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  slot: {item.slot_key} · 連結 {item.link_url}
                  {item.link_target === "_blank" ? "（新分頁）" : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(item)}>
                  <Pencil className="mr-1 h-3.5 w-3.5" />
                  編輯
                </Button>
                <Button size="sm" variant="secondary" onClick={() => toggle(item)}>
                  {item.is_active ? "停用" : "啟用"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-lift">
            <h2 className="text-lg font-bold text-coffee">編輯雙卡</h2>
            <p className="mt-1 text-xs text-muted-foreground">{FEATURE_DUO_IMAGE_SPEC.hint}</p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  後台標題（不會顯示在圖片上）
                </label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="例如：AI 助手"
                />
              </div>

              <AdminImageUpload
                images={form.image_url ? [form.image_url] : []}
                onChange={(imgs) => setForm({ ...form, image_url: imgs[0] ?? "" })}
                multiple={false}
                maxImages={1}
                aspectRatio="video"
                label="滿版圖片"
                hint={FEATURE_DUO_IMAGE_SPEC.hint}
                uploadFolder="feature-duo"
              />

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  連結網址
                </label>
                <Input
                  value={form.link_url}
                  onChange={(e) => setForm({ ...form, link_url: e.target.value })}
                  placeholder="/ai-tools 或 https://…"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  開啟方式
                </label>
                <select
                  className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm"
                  value={form.link_target}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      link_target: e.target.value as FeatureDuoLinkTarget,
                    })
                  }
                >
                  <option value="_self">同頁開啟</option>
                  <option value="_blank">新分頁開啟</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  無障礙替代文字（alt，不顯示在畫面）
                </label>
                <Input
                  value={form.alt_text}
                  onChange={(e) => setForm({ ...form, alt_text: e.target.value })}
                  placeholder="例如：AI 助手"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  備註（僅後台）
                </label>
                <Input
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="選填"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-coffee">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                />
                啟用顯示
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
              >
                取消
              </Button>
              <Button onClick={save} disabled={saving}>
                {saving ? "儲存中…" : "儲存"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
