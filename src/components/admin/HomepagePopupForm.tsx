"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminImageUpload } from "@/components/admin/AdminImageUpload";
import {
  LINK_TYPE_OPTIONS,
  PRIORITY_LABELS,
  STATUS_LABELS,
  type HomepagePopup,
  type HomepagePopupLinkType,
  type HomepagePopupPriority,
  type HomepagePopupStatus,
} from "@/lib/popups/types";

export type PopupFormState = {
  internal_name: string;
  title: string;
  description: string;
  desktop_image_url: string;
  mobile_image_url: string;
  button_text: string;
  link_type: HomepagePopupLinkType;
  link_url: string;
  linked_resource_id: string;
  display_scope: "home_only" | "site_first_open";
  audience_type: "all" | "guest" | "member";
  priority: HomepagePopupPriority;
  allow_close: boolean;
  allow_close_on_backdrop: boolean;
  allow_dismiss_today: boolean;
  dismiss_after_click: boolean;
  starts_at: string;
  ends_at: string;
  status: HomepagePopupStatus;
};

export const emptyPopupForm = (): PopupFormState => ({
  internal_name: "",
  title: "",
  description: "",
  desktop_image_url: "",
  mobile_image_url: "",
  button_text: "立即查看",
  link_type: "internal",
  link_url: "",
  linked_resource_id: "",
  display_scope: "home_only",
  audience_type: "all",
  priority: "normal",
  allow_close: true,
  allow_close_on_backdrop: true,
  allow_dismiss_today: true,
  dismiss_after_click: true,
  starts_at: "",
  ends_at: "",
  status: "draft",
});

export function popupToForm(p: HomepagePopup): PopupFormState {
  const toLocal = (iso: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  return {
    internal_name: p.internal_name,
    title: p.title ?? "",
    description: p.description ?? "",
    desktop_image_url: p.desktop_image_url ?? "",
    mobile_image_url: p.mobile_image_url ?? "",
    button_text: p.button_text || "立即查看",
    link_type: p.link_type,
    link_url: p.link_url ?? "",
    linked_resource_id: p.linked_resource_id ?? "",
    display_scope: p.display_scope,
    audience_type: p.audience_type,
    priority: p.priority,
    allow_close: p.allow_close,
    allow_close_on_backdrop: p.allow_close_on_backdrop,
    allow_dismiss_today: p.allow_dismiss_today,
    dismiss_after_click: p.dismiss_after_click,
    starts_at: toLocal(p.starts_at),
    ends_at: toLocal(p.ends_at),
    status: p.status,
  };
}

function toPayload(form: PopupFormState) {
  return {
    ...form,
    description: form.description || null,
    desktop_image_url: form.desktop_image_url || null,
    mobile_image_url: form.mobile_image_url || null,
    linked_resource_id: form.linked_resource_id || null,
    starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
    ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
  };
}

function PreviewCard({
  form,
  mode,
}: {
  form: PopupFormState;
  mode: "mobile" | "desktop";
}) {
  const img =
    mode === "mobile"
      ? form.mobile_image_url || form.desktop_image_url
      : form.desktop_image_url || form.mobile_image_url;

  return (
    <div className="mx-auto w-full max-w-[320px] overflow-hidden rounded-[18px] border border-border bg-white shadow-card">
      <div className="relative aspect-square bg-surface-soft">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            尚未上傳圖片
          </div>
        )}
      </div>
      <div className="space-y-2 p-4 text-center">
        <p className="text-lg font-bold text-caramel">{form.title || "主標題"}</p>
        {form.description && (
          <p className="text-sm text-foreground-secondary">{form.description}</p>
        )}
        <div className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white">
          {form.button_text || "立即查看"}
        </div>
        {form.allow_dismiss_today && (
          <p className="text-xs text-foreground-secondary">□ 今天不再顯示</p>
        )}
      </div>
    </div>
  );
}

export function HomepagePopupForm({
  initial,
  popupId,
}: {
  initial?: PopupFormState;
  popupId?: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState<PopupFormState>(initial ?? emptyPopupForm());
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState<"mobile" | "desktop">("mobile");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initial) setForm(initial);
  }, [initial]);

  const linkHint = useMemo(
    () => LINK_TYPE_OPTIONS.find((o) => o.value === form.link_type)?.pathHint ?? "",
    [form.link_type]
  );

  const save = async (statusOverride?: HomepagePopupStatus) => {
    setSaving(true);
    setError(null);
    try {
      const payload = toPayload({
        ...form,
        status: statusOverride ?? form.status,
      });
      const res = await fetch(popupId ? `/api/admin/popups/${popupId}` : "/api/admin/popups", {
        method: popupId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "儲存失敗");
      const id = popupId ?? data.popup?.id;
      router.push(id ? `/admin/content/popups/${id}` : "/admin/content/popups");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  const set = <K extends keyof PopupFormState>(key: K, value: PopupFormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-4 rounded-xl border border-border bg-white p-4 shadow-card">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </div>
        )}

        <label className="block space-y-1 text-sm">
          <span className="font-medium text-coffee">公告名稱（僅後台）</span>
          <Input
            value={form.internal_name}
            onChange={(e) => set("internal_name", e.target.value)}
            placeholder="例如：中秋團購開跑"
          />
        </label>

        <label className="block space-y-1 text-sm">
          <span className="font-medium text-coffee">主標題</span>
          <Input
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="顯示給客人的標題"
          />
        </label>

        <label className="block space-y-1 text-sm">
          <span className="font-medium text-coffee">副標題／說明</span>
          <textarea
            className="min-h-[80px] w-full rounded-lg border border-border px-3 py-2 text-sm"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="精選烘焙材料限時優惠"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <AdminImageUpload
            label="手機圖片"
            hint="建議接近正方形，前台優先使用"
            images={form.mobile_image_url ? [form.mobile_image_url] : []}
            onChange={(imgs) => set("mobile_image_url", imgs[0] ?? "")}
            multiple={false}
            maxImages={1}
            aspectRatio="square"
            uploadFolder="homepage-popups"
          />
          <AdminImageUpload
            label="桌機圖片"
            hint="可與手機相同；未上傳時沿用手機圖"
            images={form.desktop_image_url ? [form.desktop_image_url] : []}
            onChange={(imgs) => set("desktop_image_url", imgs[0] ?? "")}
            multiple={false}
            maxImages={1}
            aspectRatio="square"
            uploadFolder="homepage-popups"
          />
        </div>

        <label className="block space-y-1 text-sm">
          <span className="font-medium text-coffee">按鈕文字</span>
          <Input
            value={form.button_text}
            onChange={(e) => set("button_text", e.target.value)}
            placeholder="立即查看"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-coffee">連結類型</span>
            <select
              className="input-field w-full"
              value={form.link_type}
              onChange={(e) => {
                const v = e.target.value as HomepagePopupLinkType;
                set("link_type", v);
                if (v === "ai_tools") set("link_url", "/ai-tools");
                if (v === "member") set("link_url", "/member");
                if (v === "support") set("link_url", "/support");
              }}
            >
              {LINK_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-coffee">連結網址</span>
            <Input
              value={form.link_url}
              onChange={(e) => set("link_url", e.target.value)}
              placeholder={linkHint}
            />
          </label>
        </div>

        {!["ai_tools", "member", "support", "internal", "external", "custom"].includes(
          form.link_type
        ) && (
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-coffee">指定內容 ID／Slug</span>
            <Input
              value={form.linked_resource_id}
              onChange={(e) => set("linked_resource_id", e.target.value)}
              placeholder="選填；填寫後會自動組成路徑"
            />
          </label>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-coffee">開始時間</span>
            <Input
              type="datetime-local"
              value={form.starts_at}
              onChange={(e) => set("starts_at", e.target.value)}
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-coffee">結束時間</span>
            <Input
              type="datetime-local"
              value={form.ends_at}
              onChange={(e) => set("ends_at", e.target.value)}
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-coffee">狀態</span>
            <select
              className="input-field w-full"
              value={form.status}
              onChange={(e) => set("status", e.target.value as HomepagePopupStatus)}
            >
              {(Object.keys(STATUS_LABELS) as HomepagePopupStatus[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-coffee">優先級</span>
            <select
              className="input-field w-full"
              value={form.priority}
              onChange={(e) => set("priority", e.target.value as HomepagePopupPriority)}
            >
              {(Object.keys(PRIORITY_LABELS) as HomepagePopupPriority[]).map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-coffee">顯示對象</span>
            <select
              className="input-field w-full"
              value={form.audience_type}
              onChange={(e) =>
                set("audience_type", e.target.value as PopupFormState["audience_type"])
              }
            >
              <option value="all">全部</option>
              <option value="guest">未登入</option>
              <option value="member">已登入</option>
            </select>
          </label>
        </div>

        <label className="block space-y-1 text-sm">
          <span className="font-medium text-coffee">顯示頁面</span>
          <select
            className="input-field w-full max-w-md"
            value={form.display_scope}
            onChange={(e) =>
              set("display_scope", e.target.value as PopupFormState["display_scope"])
            }
          >
            <option value="home_only">僅首頁</option>
            <option value="site_first_open">全站首次開啟（V1 仍於首頁觸發）</option>
          </select>
        </label>

        <div className="space-y-2 rounded-lg bg-muted/40 p-3 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.allow_close}
              onChange={(e) => set("allow_close", e.target.checked)}
            />
            允許右上角關閉
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.allow_close_on_backdrop}
              onChange={(e) => set("allow_close_on_backdrop", e.target.checked)}
            />
            點擊遮罩可關閉
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.allow_dismiss_today}
              onChange={(e) => set("allow_dismiss_today", e.target.checked)}
            />
            顯示「今天不再顯示」
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.dismiss_after_click}
              onChange={(e) => set("dismiss_after_click", e.target.checked)}
            />
            點擊 CTA 後，今天不再顯示
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button disabled={saving} onClick={() => save()}>
            {saving ? "儲存中…" : "儲存"}
          </Button>
          <Button
            variant="secondary"
            disabled={saving}
            onClick={() => save("active")}
          >
            儲存並啟用
          </Button>
          <Button variant="outline" disabled={saving} onClick={() => save("draft")}>
            存成草稿
          </Button>
          <Link href="/admin/content/popups">
            <Button variant="ghost" type="button">
              返回列表
            </Button>
          </Link>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={previewMode === "mobile" ? "default" : "outline"}
            onClick={() => setPreviewMode("mobile")}
          >
            手機預覽
          </Button>
          <Button
            size="sm"
            variant={previewMode === "desktop" ? "default" : "outline"}
            onClick={() => setPreviewMode("desktop")}
          >
            桌機預覽
          </Button>
        </div>
        <div className="rounded-xl bg-[#1a120c]/40 p-6">
          <PreviewCard form={form} mode={previewMode} />
        </div>
        <p className="text-xs text-muted-foreground">
          前台文案固定為「今天不再顯示」，避免客人以為永久關閉所有公告。
        </p>
      </div>
    </div>
  );
}
