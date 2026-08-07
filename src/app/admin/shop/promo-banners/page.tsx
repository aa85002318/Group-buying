"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ShopCmsLiveSaveNotice } from "@/components/admin/shop/ShopCmsLiveSaveNotice";
import { AdminTable } from "@/components/admin/AdminTable";
import { AdminImageUpload } from "@/components/admin/AdminImageUpload";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  CmsLinkPicker,
  type CmsLinkValue,
} from "@/components/admin/home/CmsLinkPicker";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CmsBanner } from "@/lib/types/database";
import {
  SHOP_PROMO_LINK_TYPES,
  SHOP_PROMO_PLACEMENT,
  inferShopPromoLinkType,
  type ShopPromoLinkType,
} from "@/lib/shop/promo-banners";
import { cn } from "@/lib/utils";

type FormState = {
  title: string;
  subtitle: string;
  image_url: string;
  mobile_image_url: string;
  link_url: string;
  link_type: ShopPromoLinkType;
  button_text: string;
  sort_order: string;
  status: "active" | "inactive";
  starts_at: string;
  ends_at: string;
};

const emptyForm: FormState = {
  title: "",
  subtitle: "",
  image_url: "",
  mobile_image_url: "",
  link_url: "",
  link_type: "page",
  button_text: "立即逛逛",
  sort_order: "10",
  status: "active",
  starts_at: "",
  ends_at: "",
};

function toLocalInput(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminShopPromoBannersPage() {
  const [banners, setBanners] = useState<CmsBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/cms?type=banners")
      .then((r) => r.json())
      .then((d) => {
        const list = ((d.banners ?? []) as CmsBanner[])
          .filter((b) => (b.placement ?? "") === SHOP_PROMO_PLACEMENT)
          .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
        setBanners(list);
      })
      .catch(() => setBanners([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const previewSrc = useMemo(
    () => form.mobile_image_url || form.image_url || "",
    [form.image_url, form.mobile_image_url]
  );

  const openCreate = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      sort_order: String((banners.at(-1)?.sort_order ?? 0) + 10),
    });
    setShowForm(true);
  };

  const openEdit = (b: CmsBanner) => {
    setEditingId(b.id);
    setForm({
      title: b.title ?? "",
      subtitle: b.subtitle ?? "",
      image_url: b.image_url ?? "",
      mobile_image_url: b.mobile_image_url ?? "",
      link_url: b.link_url ?? "",
      link_type:
        (b.link_type as ShopPromoLinkType) ||
        inferShopPromoLinkType(b.link_url),
      button_text: b.button_text ?? "立即逛逛",
      sort_order: String(b.sort_order ?? 0),
      status: b.is_active === false || b.status === "inactive" ? "inactive" : "active",
      starts_at: toLocalInput(b.starts_at),
      ends_at: toLocalInput(b.ends_at),
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.title.trim()) {
      alert("請填寫 Banner 名稱");
      return;
    }
    if (!form.image_url.trim()) {
      alert("請上傳桌面圖片（建議 1500×600 px，比例 5:2）");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        kind: "banner" as const,
        title: form.title.trim(),
        subtitle: form.subtitle.trim() || null,
        image_url: form.image_url || null,
        mobile_image_url: form.mobile_image_url || null,
        link_url: form.link_url.trim() || null,
        link_type: form.link_type,
        button_text: form.button_text.trim() || null,
        placement: SHOP_PROMO_PLACEMENT,
        banner_type: SHOP_PROMO_PLACEMENT,
        sort_order: Number(form.sort_order) || 0,
        status: form.status,
        is_active: form.status === "active",
        starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
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
        sort_order: (b.sort_order ?? 0) + dir * 10,
      }),
    });
    load();
  };

  const remove = async (b: CmsBanner) => {
    if (!confirm(`確定刪除「${b.title}」？`)) return;
    const res = await fetch(`/api/admin/banners/${b.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert((data as { error?: string }).error ?? "刪除失敗");
      return;
    }
    load();
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="商城 5:2 活動 Banner"
        description="可新增多張、刪除或停用。顯示於商品分類下方，建議桌面 1500×600、手機 1080×432（皆 5:2）。"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/shop?section=promo" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              返回商城 CMS
            </Link>
            <Button size="sm" onClick={openCreate}>
              新增 Banner
            </Button>
          </div>
        }
      />

      <ShopCmsLiveSaveNotice section="promo" />

      {showForm ? (
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-3 rounded-xl bg-white p-4 shadow-card">
            <p className="text-sm font-medium text-coffee">
              {editingId ? "編輯 Banner" : "新增 Banner"}
            </p>
            <AdminImageUpload
              label="桌面圖片（建議 1500 × 600 px，比例 5:2）"
              images={form.image_url ? [form.image_url] : []}
              onChange={(images) => setForm({ ...form, image_url: images[0] ?? "" })}
              uploadFolder="banners/shop/promo/desktop"
              maxImages={1}
              multiple={false}
            />
            <AdminImageUpload
              label="手機圖片（建議 1080 × 432 px，比例 5:2；未設定則用桌面圖）"
              images={form.mobile_image_url ? [form.mobile_image_url] : []}
              onChange={(images) =>
                setForm({ ...form, mobile_image_url: images[0] ?? "" })
              }
              uploadFolder="banners/shop/promo/mobile"
              maxImages={1}
              multiple={false}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                placeholder="Banner 名稱"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              <Input
                placeholder="副標（選填）"
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              />
              <Input
                placeholder="按鈕文字"
                value={form.button_text}
                onChange={(e) => setForm({ ...form, button_text: e.target.value })}
              />
              <div className="sm:col-span-2 space-y-1">
                <p className="text-xs text-muted-foreground">連結（文章或站內頁）</p>
                <CmsLinkPicker
                  value={
                    {
                      type: form.link_url
                        ? form.link_url.startsWith("/articles")
                          ? "article"
                          : form.link_url.startsWith("/products/")
                            ? "product"
                            : "internal"
                        : "none",
                      href: form.link_url,
                      refId: null,
                      label: null,
                      openInNewTab: false,
                    } satisfies CmsLinkValue
                  }
                  onChange={(next) => {
                    const link_url = next.href || "";
                    setForm({
                      ...form,
                      link_url,
                      link_type: inferShopPromoLinkType(link_url),
                    });
                  }}
                />
              </div>
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">連結類型</span>
                <select
                  className="input-field h-10 w-full"
                  value={form.link_type}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      link_type: e.target.value as ShopPromoLinkType,
                    })
                  }
                >
                  {SHOP_PROMO_LINK_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
              <Input
                placeholder="排序"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
              />
              <Input
                type="datetime-local"
                value={form.starts_at}
                onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                aria-label="上架時間"
              />
              <Input
                type="datetime-local"
                value={form.ends_at}
                onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                aria-label="下架時間"
              />
              <label className="space-y-1 text-sm sm:col-span-2">
                <span className="text-muted-foreground">狀態</span>
                <select
                  className="input-field h-10 w-full"
                  value={form.status}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status: e.target.value as "active" | "inactive",
                    })
                  }
                >
                  <option value="active">啟用</option>
                  <option value="inactive">停用</option>
                </select>
              </label>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => void save()} disabled={saving}>
                {saving ? "儲存中…" : "儲存"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
              >
                取消
              </Button>
            </div>
          </div>

          <div className="rounded-xl bg-white p-4 shadow-card">
            <p className="mb-2 text-sm font-medium text-coffee">即時預覽（5:2）</p>
            <div className="relative aspect-[5/2] overflow-hidden rounded-2xl bg-[#F7F8FB]">
              {previewSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewSrc}
                  alt={form.title || "preview"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full flex-col justify-center px-4">
                  <p className="text-xs font-semibold text-[#F0645A]">商城活動</p>
                  <p className="mt-1 font-bold text-[#153E73]">
                    {form.title || "Banner 名稱"}
                  </p>
                  <p className="mt-1 text-sm text-[#687386]">
                    {form.subtitle || "上傳圖片後可預覽"}
                  </p>
                </div>
              )}
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              支援 JPG／PNG／WebP，建議單檔不超過 3MB。
            </p>
          </div>
        </div>
      ) : null}

      <AdminTable
        loading={loading}
        emptyText="尚無活動 Banner"
        columns={[
          {
            key: "title",
            header: "名稱",
            render: (b) => (
              <div className="flex items-center gap-2">
                {b.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={b.image_url}
                    alt=""
                    className="h-10 w-[50px] rounded object-cover"
                  />
                ) : (
                  <span className="inline-flex h-10 w-[50px] items-center justify-center rounded bg-surface-soft text-[10px] text-muted-foreground">
                    無圖
                  </span>
                )}
                <div>
                  <p className="font-medium text-coffee">{b.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {b.link_type || inferShopPromoLinkType(b.link_url)}
                  </p>
                </div>
              </div>
            ),
          },
          {
            key: "link",
            header: "連結",
            render: (b) => (
              <span className="line-clamp-1 max-w-[220px] text-xs text-muted-foreground">
                {b.link_url || "—"}
              </span>
            ),
          },
          {
            key: "sort",
            header: "排序",
            render: (b) => b.sort_order,
          },
          {
            key: "status",
            header: "狀態",
            render: (b) => (
              <StatusBadge
                label={b.is_active ? "啟用" : "停用"}
                variant={b.is_active ? "success" : "secondary"}
              />
            ),
          },
          {
            key: "actions",
            header: "操作",
            render: (b) => (
              <div className="flex flex-wrap gap-1">
                <Button size="sm" variant="outline" onClick={() => openEdit(b)}>
                  編輯
                </Button>
                <Button size="sm" variant="outline" onClick={() => void toggle(b)}>
                  {b.is_active ? "停用" : "啟用"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => void move(b, -1)}>
                  上移
                </Button>
                <Button size="sm" variant="outline" onClick={() => void move(b, 1)}>
                  下移
                </Button>
                <Button size="sm" variant="outline" onClick={() => void remove(b)}>
                  刪除
                </Button>
              </div>
            ),
          },
        ]}
        rows={banners}
      />
    </div>
  );
}
