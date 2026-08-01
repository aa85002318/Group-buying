"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { AdminImageUpload } from "@/components/admin/AdminImageUpload";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CmsBanner } from "@/lib/types/database";
import { cn } from "@/lib/utils";

type FormState = {
  title: string;
  alt_text: string;
  image_url: string;
  mobile_image_url: string;
  link_url: string;
  link_target: "_self" | "_blank";
  sort_order: string;
  status: "active" | "inactive";
  starts_at: string;
  ends_at: string;
};

const emptyForm: FormState = {
  title: "",
  alt_text: "",
  image_url: "",
  mobile_image_url: "",
  link_url: "",
  link_target: "_self",
  sort_order: "0",
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

function AspectHint({
  label,
  expected,
  src,
}: {
  label: string;
  expected: string;
  src: string;
}) {
  const [meta, setMeta] = useState<string>("");
  const [warn, setWarn] = useState(false);

  useEffect(() => {
    if (!src) {
      setMeta("");
      setWarn(false);
      return;
    }
    const img = new window.Image();
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const ratio = w / h;
      const expectedRatio = expected === "5:2" ? 2.5 : 1.2;
      const ok = Math.abs(ratio - expectedRatio) < 0.12;
      setMeta(`${w} × ${h} px（約 ${(ratio).toFixed(2)}）`);
      setWarn(!ok);
    };
    img.onerror = () => {
      setMeta("無法讀取尺寸");
      setWarn(false);
    };
    img.src = src;
  }, [src, expected]);

  return (
    <div className="space-y-1 text-xs">
      <p className="text-muted-foreground">
        {label}建議尺寸 {expected === "5:2" ? "1500 × 600 px" : "1080 × 900 px"}，比例 {expected}
      </p>
      <p className="text-muted-foreground">
        重要文字：桌面左右各保留約 80px、手機約 60px 安全區域。
      </p>
      {meta ? <p className="text-coffee">實際尺寸：{meta}</p> : null}
      {warn ? (
        <p className="rounded-md bg-amber-50 px-2 py-1 text-amber-800">
          比例與建議不符，仍可儲存，但前台 object-cover 可能裁切邊緣內容。
        </p>
      ) : null}
    </div>
  );
}

export default function AdminShopHeroBannersPage() {
  const [banners, setBanners] = useState<CmsBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/shop/hero-banners")
      .then((r) => r.json())
      .then((d) => {
        const raw = (d.raw ?? d.banners ?? []) as CmsBanner[];
        setBanners(
          [...raw].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        );
      })
      .catch(() => setBanners([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const previewDesktop = useMemo(() => form.image_url, [form.image_url]);
  const previewMobile = useMemo(
    () => form.mobile_image_url || form.image_url,
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
      alt_text: (b as CmsBanner & { alt_text?: string }).alt_text ?? b.subtitle ?? "",
      image_url: b.image_url ?? "",
      mobile_image_url: b.mobile_image_url ?? "",
      link_url: b.link_url ?? "",
      link_target:
        ((b as CmsBanner & { link_target?: string }).link_target as "_self" | "_blank") ||
        "_self",
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
        title: form.title.trim(),
        alt_text: form.alt_text.trim() || form.title.trim(),
        desktop_image_url: form.image_url,
        mobile_image_url: form.mobile_image_url || null,
        link_url: form.link_url.trim() || null,
        link_target: form.link_target,
        sort_order: Number(form.sort_order) || 0,
        is_active: form.status === "active",
        starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      };
      const res = await fetch(
        editingId
          ? `/api/admin/shop/hero-banners/${editingId}`
          : "/api/admin/shop/hero-banners",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
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
    await fetch(`/api/admin/shop/hero-banners/${b.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !b.is_active }),
    });
    load();
  };

  const move = async (b: CmsBanner, dir: -1 | 1) => {
    await fetch(`/api/admin/shop/hero-banners/${b.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sort_order: (b.sort_order ?? 0) + dir * 10 }),
    });
    load();
  };

  const remove = async (b: CmsBanner) => {
    if (!confirm(`確定刪除「${b.title}」？`)) return;
    const res = await fetch(`/api/admin/shop/hero-banners/${b.id}`, { method: "DELETE" });
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
        title="商城 Hero Banner"
        description="滿版主視覺。桌面建議 1500×600（5:2）、手機 1080×900（6:5）。Header 與 Hero 分開，不疊圖。"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/shop" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              返回商城 CMS
            </Link>
            <Button size="sm" onClick={openCreate}>
              新增 Banner
            </Button>
          </div>
        }
      />

      {showForm ? (
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-3 rounded-xl bg-white p-4 shadow-card">
            <p className="text-sm font-medium text-coffee">
              {editingId ? "編輯 Banner" : "新增 Banner"}
            </p>
            <AdminImageUpload
              label="桌面圖片"
              hint="建議 1500 × 600 px，比例 5:2；JPG／PNG／WebP，最大約 3MB"
              images={form.image_url ? [form.image_url] : []}
              onChange={(images) => setForm({ ...form, image_url: images[0] ?? "" })}
              uploadFolder="hero/desktop"
              maxImages={1}
              multiple={false}
            />
            <AspectHint label="桌面" expected="5:2" src={form.image_url} />
            <AdminImageUpload
              label="手機圖片"
              hint="建議 1080 × 900 px，比例 6:5；未設定則用桌面圖"
              images={form.mobile_image_url ? [form.mobile_image_url] : []}
              onChange={(images) =>
                setForm({ ...form, mobile_image_url: images[0] ?? "" })
              }
              uploadFolder="hero/mobile"
              maxImages={1}
              multiple={false}
            />
            <AspectHint label="手機" expected="6:5" src={form.mobile_image_url} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                placeholder="標題（後台辨識）"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              <Input
                placeholder="替代文字 alt"
                value={form.alt_text}
                onChange={(e) => setForm({ ...form, alt_text: e.target.value })}
              />
              <Input
                placeholder="連結（/shop/categories 或 https://…）"
                value={form.link_url}
                onChange={(e) => setForm({ ...form, link_url: e.target.value })}
                className="sm:col-span-2"
              />
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">開啟方式</span>
                <select
                  className="input-field h-10 w-full"
                  value={form.link_target}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      link_target: e.target.value as "_self" | "_blank",
                    })
                  }
                >
                  <option value="_self">同頁開啟</option>
                  <option value="_blank">新分頁</option>
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
                aria-label="開始時間"
              />
              <Input
                type="datetime-local"
                value={form.ends_at}
                onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                aria-label="結束時間"
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

          <div className="space-y-4 rounded-xl bg-white p-4 shadow-card">
            <div>
              <p className="mb-2 text-sm font-medium text-coffee">桌面預覽（5:2）</p>
              <div className="relative aspect-[5/2] overflow-hidden bg-[#FEDB49]">
                {previewDesktop ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewDesktop}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-[#153E73]/60">
                    上傳桌面圖後預覽
                  </div>
                )}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-coffee">手機預覽（6:5）</p>
              <div className="relative mx-auto aspect-[6/5] max-w-xs overflow-hidden bg-[#FEDB49]">
                {previewMobile ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewMobile}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-[#153E73]/60">
                    上傳手機圖後預覽
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <AdminTable
        loading={loading}
        emptyText="尚無 Hero Banner"
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
                    {(b as CmsBanner & { alt_text?: string }).alt_text || "—"}
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
