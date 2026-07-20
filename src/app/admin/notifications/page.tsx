"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatDate } from "@/lib/utils";
import { MEMBER_NOTIFICATION_CATEGORIES } from "@/lib/services/notificationCampaignService";
import type { NotificationCampaign } from "@/lib/types/database";

const STATUS_LABEL: Record<string, string> = {
  draft: "草稿",
  scheduled: "預約中",
  sending: "發送中",
  sent: "已發送",
  cancelled: "已取消",
};

export default function AdminNotificationsPage() {
  const [campaigns, setCampaigns] = useState<NotificationCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: "",
    summary: "",
    body: "",
    category: "system",
    link_url: "",
    audience_type: "all",
    user_ids_text: "",
    order_status: "awaiting_payment",
    scheduled_at: "",
  });
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/notification-campaigns")
      .then((r) => r.json())
      .then((d) => setCampaigns(d.campaigns ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (action: "draft" | "schedule" | "send_now") => {
    if (!form.title.trim() || !form.body.trim()) {
      alert("請填寫標題與內容");
      return;
    }
    if (action === "send_now" && !confirm("確定立即發送 App 內通知？（不會發送手機推播）")) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/notification-campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          action,
          audience_filter:
            form.audience_type === "users"
              ? { user_ids: form.user_ids_text.split(/[\s,]+/).filter(Boolean) }
              : form.audience_type === "order_status"
                ? { order_status: form.order_status }
                : {},
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "失敗");
      alert(
        action === "send_now"
          ? `已發送 ${data.sent ?? 0} 則`
          : action === "schedule"
            ? "已預約"
            : "已存草稿"
      );
      setForm({
        title: "",
        summary: "",
        body: "",
        category: "system",
        link_url: "",
        audience_type: "all",
        user_ids_text: "",
        order_status: "awaiting_payment",
        scheduled_at: "",
      });
      setPreview(false);
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "失敗");
    } finally {
      setSaving(false);
    }
  };

  const patch = async (id: string, action: "cancel" | "send_now") => {
    if (action === "cancel" && !confirm("確定取消此預約／草稿？")) return;
    if (action === "send_now" && !confirm("確定立即發送？")) return;
    const res = await fetch(`/api/admin/notification-campaigns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? "操作失敗");
      return;
    }
    load();
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="通知管理"
        description="App 內通知（訂單／團購／活動／福利／門市／系統）。不含 POS 消費通知；正式推播可預留但不串接付費服務。"
      />

      <section className="max-w-2xl space-y-3 rounded-xl bg-white p-4 shadow-card">
        <h2 className="font-medium text-coffee">建立通知</h2>
        <Input placeholder="標題 *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <Input placeholder="摘要（選填）" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
        <textarea
          className="input-field min-h-[100px] w-full"
          placeholder="內容 *（純文字，不信任 HTML）"
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <select className="input-field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {MEMBER_NOTIFICATION_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <Input placeholder="導向連結（/orders/... 或 https）" value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} />
        </div>
        <select
          className="input-field w-full"
          value={form.audience_type}
          onChange={(e) => setForm({ ...form, audience_type: e.target.value })}
        >
          <option value="all">全部 App 會員</option>
          <option value="users">指定會員 ID</option>
          <option value="order_status">依 App 訂單狀態</option>
        </select>
        {form.audience_type === "users" && (
          <textarea
            className="input-field min-h-[72px] w-full"
            placeholder="會員 UUID，逗號或換行分隔"
            value={form.user_ids_text}
            onChange={(e) => setForm({ ...form, user_ids_text: e.target.value })}
          />
        )}
        {form.audience_type === "order_status" && (
          <select
            className="input-field w-full"
            value={form.order_status}
            onChange={(e) => setForm({ ...form, order_status: e.target.value })}
          >
            <option value="awaiting_payment">待付款</option>
            <option value="payment_confirmed">已確認付款</option>
            <option value="ready_for_pickup">待取貨</option>
            <option value="completed">已完成</option>
          </select>
        )}
        <Input
          type="datetime-local"
          value={form.scheduled_at}
          onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
        />

        {preview && (
          <div className="rounded-xl border border-border bg-surface-soft p-4 text-sm">
            <p className="font-bold">{form.title || "（無標題）"}</p>
            {form.summary && <p className="mt-1 text-foreground-secondary">{form.summary}</p>}
            <p className="mt-2 whitespace-pre-wrap">{form.body || "（無內容）"}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setPreview((p) => !p)}>
            {preview ? "關閉預覽" : "預覽"}
          </Button>
          <Button variant="secondary" disabled={saving} onClick={() => submit("draft")}>存草稿</Button>
          <Button variant="outline" disabled={saving || !form.scheduled_at} onClick={() => submit("schedule")}>
            預約發送
          </Button>
          <Button disabled={saving} onClick={() => submit("send_now")}>
            {saving ? "處理中…" : "立即發送"}
          </Button>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-medium text-coffee">發送紀錄</h2>
        <AdminTable
          columns={[
            { key: "title", header: "標題", render: (c) => c.title },
            {
              key: "category",
              header: "分類",
              render: (c) => MEMBER_NOTIFICATION_CATEGORIES.find((x) => x.value === c.category)?.label ?? c.category,
            },
            {
              key: "status",
              header: "狀態",
              render: (c) => (
                <StatusBadge
                  label={STATUS_LABEL[c.status] ?? c.status}
                  variant={c.status === "sent" ? "success" : c.status === "scheduled" ? "warning" : "secondary"}
                />
              ),
            },
            { key: "sent", header: "人數", render: (c) => c.sent_count },
            {
              key: "time",
              header: "時間",
              render: (c) => (
                <span className="text-xs">
                  {c.sent_at ? formatDate(c.sent_at) : c.scheduled_at ? `預約 ${formatDate(c.scheduled_at)}` : formatDate(c.created_at)}
                </span>
              ),
            },
            {
              key: "actions",
              header: "操作",
              render: (c) => (
                <div className="flex flex-wrap gap-1">
                  {(c.status === "draft" || c.status === "scheduled") && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => patch(c.id, "send_now")}>立即發送</Button>
                      <Button size="sm" variant="outline" onClick={() => patch(c.id, "cancel")}>取消</Button>
                    </>
                  )}
                </div>
              ),
            },
          ]}
          rows={campaigns}
          loading={loading}
          emptyText="尚無通知活動"
        />
      </section>
    </div>
  );
}
