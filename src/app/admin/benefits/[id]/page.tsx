"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminImageUpload } from "@/components/admin/AdminImageUpload";
import { StatusBadge } from "@/components/admin/StatusBadge";
import type { MemberBenefit, MemberBenefitAssignment } from "@/lib/types/database";
import { formatDate } from "@/lib/utils";

export default function AdminBenefitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [benefit, setBenefit] = useState<MemberBenefit | null>(null);
  const [assignments, setAssignments] = useState<MemberBenefitAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    summary: "",
    description: "",
    image_url: "",
    usage_instructions: "",
    usage_location: "",
    status: "draft",
    starts_at: "",
    ends_at: "",
  });

  const [audience, setAudience] = useState<"all" | "users" | "group_buy">("users");
  const [userIdsText, setUserIdsText] = useState("");
  const [groupBuyEventId, setGroupBuyEventId] = useState("");
  const [events, setEvents] = useState<Array<{ id: string; title: string }>>([]);
  const [estimate, setEstimate] = useState<{ estimate: number; will_assign: number; already_assigned: number } | null>(null);
  const [assigning, setAssigning] = useState(false);

  const load = () => {
    setLoading(true);
    fetch(`/api/admin/benefits/${id}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "載入失敗");
        setBenefit(d.benefit);
        setAssignments(d.assignments ?? []);
        const b = d.benefit as MemberBenefit;
        setForm({
          title: b.title,
          summary: b.summary ?? "",
          description: b.description ?? "",
          image_url: b.image_url ?? "",
          usage_instructions: b.usage_instructions ?? "",
          usage_location: b.usage_location ?? "",
          status: b.status,
          starts_at: b.starts_at ? b.starts_at.slice(0, 16) : "",
          ends_at: b.ends_at ? b.ends_at.slice(0, 16) : "",
        });
      })
      .catch((e) => alert(e instanceof Error ? e.message : "載入失敗"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    fetch("/api/group-buy-events")
      .then((r) => r.json())
      .then((d) => setEvents((d.events ?? []).map((e: { id: string; title: string }) => ({ id: e.id, title: e.title }))))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/benefits/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
          ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "儲存失敗");
      setBenefit(data.benefit);
      alert("已儲存");
    } catch (e) {
      alert(e instanceof Error ? e.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  const previewAssign = async () => {
    const params = new URLSearchParams({ audience });
    if (audience === "users") params.set("user_ids", userIdsText);
    if (audience === "group_buy") params.set("group_buy_event_id", groupBuyEventId);
    const res = await fetch(`/api/admin/benefits/${id}/assign?${params}`);
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? "預估失敗");
      return;
    }
    setEstimate(data);
  };

  const doAssign = async () => {
    if (!estimate) {
      alert("請先預估人數");
      return;
    }
    if (!confirm(`確定發放？預計新增 ${estimate.will_assign} 人（總對象 ${estimate.estimate}，已有 ${estimate.already_assigned}）`)) {
      return;
    }
    setAssigning(true);
    try {
      const res = await fetch(`/api/admin/benefits/${id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audience,
          confirm: true,
          user_ids_text: userIdsText,
          group_buy_event_id: groupBuyEventId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "發放失敗");
      alert(`發放完成：新增 ${data.assigned}、略過 ${data.skipped}、恢復 ${data.restored}`);
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "發放失敗");
    } finally {
      setAssigning(false);
    }
  };

  const patchAssignment = async (assignmentId: string, action: "mark_used" | "revoke") => {
    const label = action === "mark_used" ? "標記已使用" : "撤銷";
    if (!confirm(`確定${label}？`)) return;
    const res = await fetch(`/api/admin/benefits/${id}/assignments/${assignmentId}`, {
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

  if (loading) return <p className="text-sm text-muted-foreground">載入中…</p>;
  if (!benefit) return <p>找不到福利</p>;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={benefit.title}
        description="編輯福利內容、發放與紀錄（不含 POS 消費）"
        actions={
          <Button variant="secondary" onClick={() => router.push("/admin/benefits")}>
            返回列表
          </Button>
        }
      />

      <div className="space-y-3 rounded-xl bg-white p-4 shadow-card">
        <h2 className="font-medium text-coffee">福利內容</h2>
        <AdminImageUpload
          label="封面圖"
          images={form.image_url ? [form.image_url] : []}
          onChange={(images) => setForm({ ...form, image_url: images[0] ?? "" })}
          uploadFolder="benefits"
          maxImages={1}
          multiple={false}
        />
        <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="名稱" />
        <Input value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} placeholder="摘要" />
        <textarea
          className="input-field min-h-[100px]"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="說明"
        />
        <Input
          value={form.usage_instructions}
          onChange={(e) => setForm({ ...form, usage_instructions: e.target.value })}
          placeholder="使用方式"
        />
        <Input
          value={form.usage_location}
          onChange={(e) => setForm({ ...form, usage_location: e.target.value })}
          placeholder="使用地點"
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="draft">草稿</option>
            <option value="active">啟用</option>
            <option value="disabled">停用</option>
          </select>
          <Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
          <Input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} />
        </div>
        <Button onClick={save} disabled={saving}>{saving ? "儲存中…" : "儲存變更"}</Button>
      </div>

      <div className="space-y-3 rounded-xl bg-white p-4 shadow-card">
        <h2 className="font-medium text-coffee">發放福利</h2>
        <p className="text-xs text-muted-foreground">需先將狀態設為「啟用」。批次發放會略過已持有者並寫入操作紀錄。</p>
        <select className="input-field" value={audience} onChange={(e) => setAudience(e.target.value as typeof audience)}>
          <option value="users">指定會員 ID</option>
          <option value="all">全部 App 會員</option>
          <option value="group_buy">團購參加者</option>
        </select>
        {audience === "users" && (
          <textarea
            className="input-field min-h-[80px]"
            placeholder="會員 UUID，以逗號或換行分隔"
            value={userIdsText}
            onChange={(e) => setUserIdsText(e.target.value)}
          />
        )}
        {audience === "group_buy" && (
          <select
            className="input-field"
            value={groupBuyEventId}
            onChange={(e) => setGroupBuyEventId(e.target.value)}
          >
            <option value="">選擇團購活動</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>{e.title}</option>
            ))}
          </select>
        )}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={previewAssign}>預估人數</Button>
          <Button onClick={doAssign} disabled={assigning || benefit.status !== "active"}>
            {assigning ? "發放中…" : "確認發放"}
          </Button>
        </div>
        {estimate && (
          <p className="text-sm text-muted-foreground">
            總對象 {estimate.estimate} · 已發放 {estimate.already_assigned} · 將新增 {estimate.will_assign}
          </p>
        )}
      </div>

      <div className="space-y-3 rounded-xl bg-white p-4 shadow-card">
        <h2 className="font-medium text-coffee">發放紀錄</h2>
        {assignments.length === 0 ? (
          <p className="text-sm text-muted-foreground">尚無發放紀錄</p>
        ) : (
          <ul className="divide-y divide-border">
            {assignments.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <div>
                  <p className="font-medium">
                    {a.profiles?.full_name || a.profiles?.email || a.user_id.slice(0, 8)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(a.assigned_at)} · {a.source}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge
                    label={a.status}
                    variant={a.status === "available" ? "success" : a.status === "used" ? "secondary" : "warning"}
                  />
                  {a.status === "available" && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => patchAssignment(a.id, "mark_used")}>
                        標記已使用
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => patchAssignment(a.id, "revoke")}>
                        撤銷
                      </Button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
