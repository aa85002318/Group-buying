"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { AdminImageUpload } from "@/components/admin/AdminImageUpload";
import type { CmsBanner } from "@/lib/types/database";

const PLACEMENTS = [
  { value: "shop_hero", label: "商城 Hero Banner" },
  { value: "shop_promo", label: "商城 5:2 活動 Banner" },
  { value: "home_weekly_promo", label: "首頁本週優惠" },
  { value: "home_secondary", label: "首頁次要 Banner" },
  { value: "shop", label: "商城（舊）" },
  { value: "group_buy", label: "團購" },
  { value: "recipes", label: "食譜" },
  { value: "news", label: "最新資訊" },
  { value: "member", label: "會員中心" },
];

function formatPlacementLabel(value: string | null | undefined) {
  if (!value || value === "home_hero") return "（舊）首頁 Hero";
  return PLACEMENTS.find((p) => p.value === value)?.label ?? value;
}

const emptyForm = {
  title: "",
  subtitle: "",
  image_url: "",
  mobile_image_url: "",
  button_text: "了解更多",
  link_url: "",
  placement: "shop_hero",
  sort_order: "0",
  status: "active",
  starts_at: "",
  ends_at: "",
  background_color: "",
  text_color: "",
  text_align: "center",
  audience: "all",
};

function toLocalInput(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function AdminBannersClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const placementFilter = searchParams.get("placement") ?? "";
  const [banners, setBanners] = useState<CmsBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/cms?type=banners")
      .then((r) => r.json())
      .then((d) => setBanners(d.banners ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (placementFilter === "home_hero") {
      router.replace("/admin/brand-system/heroes");
    }
  }, [placementFilter, router]);

  useEffect(() => {
    if (!placementFilter || placementFilter === "home_hero") return;
    setForm((f) => ({ ...f, placement: placementFilter }));
  }, [placementFilter]);

  const visibleBanners = useMemo(() => {
    const list = banners.filter((b) => (b.placement ?? "") !== "home_hero");
    if (!placementFilter || placementFilter === "home_hero") return list;
    return list.filter((b) => (b.placement ?? "") === placementFilter);
  }, [banners, placementFilter]);

  const placementLabel =
    PLACEMENTS.find((p) => p.value === placementFilter)?.label ?? null;

  const openCreate = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      placement: placementFilter && placementFilter !== "home_hero" ? placementFilter : "shop_hero",
    });
    setShowForm(true);
  };

  const openEdit = (b: CmsBanner) => {
    if ((b.placement ?? "") === "home_hero") {
      router.push("/admin/brand-system/heroes");
      return;
    }
    setEditingId(b.id);
    setForm({
      title: b.title,
      subtitle: b.subtitle ?? "",
      image_url: b.image_url ?? "",
      mobile_image_url: b.mobile_image_url ?? "",
      button_text: b.button_text ?? "了解更多",
      link_url: b.link_url ?? "",
      placement: b.placement ?? "home_weekly_promo",
      sort_order: String(b.sort_order ?? 0),
      status: b.status ?? (b.is_active ? "active" : "inactive"),
      starts_at: toLocalInput(b.starts_at),
      ends_at: toLocalInput(b.ends_at),
      background_color: b.background_color ?? "",
      text_color: b.text_color ?? "",
      text_align: b.text_align ?? "center",
      audience: b.audience ?? "all",
    });
    setShowForm(true);
  };

  const save = async () => {
    const isWeekly = form.placement === "home_weekly_promo";
    const isShopHero = form.placement === "shop_hero";
    if (!form.title.trim()) {
      alert(isWeekly ? "請填寫管理用名稱（僅後台辨識，不顯示於前台）" : "請填寫標題");
      return;
    }
    if (isWeekly && !form.image_url.trim()) {
      alert("請上傳本週優惠圖片（建議 720×360 px）");
      return;
    }
    if (isShopHero && !form.image_url.trim()) {
      alert("請上傳商城 Hero 桌面圖片（滿寬完整顯示、兩側不裁切）");
      return;
    }
    const isShopPromo = form.placement === "shop_promo";
    if (isShopPromo && !form.image_url.trim()) {
      alert("請上傳桌面圖片（建議 1500×600 px，比例 5:2）");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        kind: "banner" as const,
        title: form.title,
        subtitle: form.subtitle || null,
        image_url: form.image_url || null,
        mobile_image_url: form.mobile_image_url || null,
        button_text: form.button_text || null,
        link_url: form.link_url || null,
        placement: form.placement,
        banner_type: form.placement === "shop_hero" ? "shop_hero" : form.placement,
        sort_order: Number(form.sort_order),
        status: form.status,
        is_active: form.status === "active",
        starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
        background_color: form.background_color || null,
        text_color: form.text_color || null,
        text_align: form.text_align || "center",
        audience: form.audience || "all",
      };

      const res = await fetch("/api/admin/cms", {
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

  const toggle = async (b: CmsBanner) => {
    const nextActive = !b.is_active;
    await fetch("/api/admin/cms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "banner",
        id: b.id,
        is_active: nextActive,
        status: nextActive ? "active" : "inactive",
      }),
    });
    load();
  };

  const move = async (b: CmsBanner, dir: -1 | 1) => {
    await fetch("/api/admin/cms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "banner",
        id: b.id,
        sort_order: b.sort_order + dir * 10,
      }),
    });
    load();
  };

  const remove = async (b: CmsBanner) => {
    if (!confirm(`確定刪除「${b.title}」？`)) return;
    const res = await fetch(`/api/admin/banners/${b.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data.error ?? "刪除失敗");
      return;
    }
    load();
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title={placementLabel ? `Banner｜${placementLabel}` : "Banner 管理"}
        description="管理本週優惠、次要 Banner 等版位。首頁 Hero 已改由「品牌體驗系統 → Brand Hero」管理。"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button onClick={openCreate}>新增 Banner</Button>
            <Link
              href="/admin/brand-system/heroes"
              className="inline-flex h-10 items-center rounded-xl border border-border bg-white px-4 text-sm font-semibold text-caramel"
            >
              首頁 Hero
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

      {showForm && (
        <div className="space-y-3 rounded-xl bg-white p-4 shadow-card">
          <p className="text-sm font-medium text-coffee">
            {editingId ? "編輯 Banner" : "新增 Banner"}
          </p>
          {form.placement === "home_weekly_promo" ? (
            <p className="rounded-lg bg-surface-soft px-3 py-2 text-xs leading-relaxed text-foreground-secondary">
              本週優惠建議上傳{" "}
              <strong className="text-brand-caramel">720×360 px</strong>{" "}
              滿版圖片；有圖時前台以圖片為主。
            </p>
          ) : null}
          <AdminImageUpload
            label={
              form.placement === "home_weekly_promo"
                ? "優惠圖片（建議 720×360 px）"
                : form.placement === "shop_hero"
                  ? "桌面圖（完整顯示、兩側不裁切；建議寬 1500px）"
                  : form.placement === "shop_promo"
                    ? "桌面圖片（建議 1500 × 600 px，比例 5:2）"
                    : "桌機圖"
            }
            images={form.image_url ? [form.image_url] : []}
            onChange={(images) => setForm({ ...form, image_url: images[0] ?? "" })}
            uploadFolder={
              form.placement === "shop_hero"
                ? "banners/shop/hero/desktop"
                : form.placement === "shop_promo"
                  ? "banners/shop/promo/desktop"
                  : "banners"
            }
            maxImages={1}
            multiple={false}
          />
          <AdminImageUpload
            label={
              form.placement === "shop_hero"
                ? "手機圖（完整顯示、兩側不裁切；未設定則使用桌面圖）"
                : form.placement === "shop_promo"
                  ? "手機圖片（建議 1080 × 432 px，比例 5:2；未設定則用桌面圖）"
                  : "手機版圖片（建議 750×700 px；未設定則使用桌機圖）"
            }
            images={form.mobile_image_url ? [form.mobile_image_url] : []}
            onChange={(images) => setForm({ ...form, mobile_image_url: images[0] ?? "" })}
            uploadFolder={
              form.placement === "shop_hero"
                ? "banners/shop/hero/mobile"
                : form.placement === "shop_promo"
                  ? "banners/shop/promo/mobile"
                  : "banners"
            }
            maxImages={1}
            multiple={false}
          />
          {form.placement === "shop_hero" ? (
            <p className="text-xs text-muted-foreground">
              商城 Hero 比照首頁：滿寬、高度隨圖片比例、兩側不裁切。底色請與頁首一致（#FEDB49）。
            </p>
          ) : null}
          {form.placement === "shop_promo" ? (
            <p className="text-xs text-muted-foreground">
              商城活動 Banner 固定 5:2、object-cover；桌面／手機請分開上傳以免文字被裁切。
            </p>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              placeholder={
                form.placement === "home_weekly_promo"
                  ? "Banner 名稱（後台辨識／可作主標）"
                  : "標題"
              }
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <Input
              placeholder="主標題／副標（前台可選顯示）"
              value={form.subtitle}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
            />
            <Input
              placeholder="按鈕文字"
              value={form.button_text}
              onChange={(e) => setForm({ ...form, button_text: e.target.value })}
            />
            <Input
              placeholder="按鈕連結（/shop 或 https://…）"
              value={form.link_url}
              onChange={(e) => setForm({ ...form, link_url: e.target.value })}
            />
            <Input
              placeholder="背景色 #FFF9F5"
              value={form.background_color}
              onChange={(e) => setForm({ ...form, background_color: e.target.value })}
            />
            <Input
              placeholder="文字色 #43332B"
              value={form.text_color}
              onChange={(e) => setForm({ ...form, text_color: e.target.value })}
            />
            <select
              className="input-field"
              value={form.text_align}
              onChange={(e) => setForm({ ...form, text_align: e.target.value })}
            >
              <option value="left">文字靠左</option>
              <option value="center">文字置中</option>
              <option value="right">文字靠右</option>
            </select>
            <select
              className="input-field"
              value={form.audience}
              onChange={(e) => setForm({ ...form, audience: e.target.value })}
            >
              <option value="all">顯示對象：全部</option>
              <option value="guest">僅未登入</option>
              <option value="member">僅會員</option>
            </select>
            <div className="space-y-1">
              <select
                className="input-field w-full"
                value={
                  PLACEMENTS.some((p) => p.value === form.placement)
                    ? form.placement
                    : "__custom__"
                }
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "__custom__") {
                    setForm({
                      ...form,
                      placement: placementFilter || form.placement || "home_custom",
                    });
                    return;
                  }
                  setForm({ ...form, placement: v });
                }}
              >
                {PLACEMENTS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
                <option value="__custom__">自訂 placement…</option>
              </select>
              {!PLACEMENTS.some((p) => p.value === form.placement) ||
              form.placement === placementFilter ? (
                <Input
                  placeholder="自訂 placement（對應首頁 Banner 帶）"
                  value={form.placement}
                  onChange={(e) => setForm({ ...form, placement: e.target.value })}
                />
              ) : null}
              {placementFilter && !PLACEMENTS.some((p) => p.value === placementFilter) ? (
                <p className="text-xs text-muted-foreground">
                  目前篩選自訂版位：{placementFilter}
                </p>
              ) : null}
            </div>
            <select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">啟用</option>
              <option value="draft">草稿</option>
              <option value="inactive">停用</option>
            </select>
            <Input type="number" placeholder="排序" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
            <Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
            <Input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <Button onClick={save} disabled={saving}>{saving ? "儲存中…" : "儲存"}</Button>
            <Button variant="secondary" onClick={() => { setShowForm(false); setEditingId(null); }}>取消</Button>
          </div>
        </div>
      )}

      <AdminTable
        columns={[
          { key: "title", header: "標題", render: (b) => b.title },
          {
            key: "placement",
            header: "版位",
            render: (b) => formatPlacementLabel(b.placement),
          },
          {
            key: "status",
            header: "狀態",
            render: (b) => (
              <StatusBadge label={b.is_active ? "啟用" : "停用"} variant={b.is_active ? "success" : "secondary"} />
            ),
          },
          { key: "sort", header: "排序", render: (b) => b.sort_order },
          {
            key: "actions",
            header: "操作",
            render: (b) => (
              <div className="flex flex-wrap gap-1">
                <Button size="sm" variant="outline" onClick={() => openEdit(b)}>編輯</Button>
                <Button size="sm" variant="outline" onClick={() => move(b, -1)}>上移</Button>
                <Button size="sm" variant="outline" onClick={() => move(b, 1)}>下移</Button>
                <Button size="sm" variant="secondary" onClick={() => toggle(b)}>
                  {b.is_active ? "停用" : "啟用"}
                </Button>
                <Button size="sm" variant="destructive" onClick={() => remove(b)}>
                  刪除
                </Button>
              </div>
            ),
          },
        ]}
        rows={visibleBanners}
        loading={loading}
        emptyText="尚無 Banner"
      />
    </div>
  );
}

export default function AdminBannersPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 p-4">
          <p className="text-sm text-muted-foreground">載入 Banner 管理…</p>
        </div>
      }
    >
      <AdminBannersClient />
    </Suspense>
  );
}
