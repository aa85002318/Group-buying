"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatCurrency, formatDate, ORDER_STATUS_LABELS } from "@/lib/utils";

type MemberDetail = {
  id: string;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  member_number?: string | null;
  member_code?: string;
  role?: string;
  is_active?: boolean;
  admin_notes?: string | null;
  created_at?: string;
  email_verified?: boolean;
  last_sign_in_at?: string | null;
  store_credit_balance?: number;
};

type AppOrder = {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  channel?: string | null;
  group_buy_event_id?: string | null;
  created_at: string;
};

export default function AdminMemberDetailPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const [member, setMember] = useState<MemberDetail | null>(null);
  const [orders, setOrders] = useState<AppOrder[]>([]);
  const [orderCount, setOrderCount] = useState(0);
  const [addressCount, setAddressCount] = useState(0);
  const [carrierCount, setCarrierCount] = useState(0);
  const [carriersMasked, setCarriersMasked] = useState<
    Array<{ id: string; carrier_name: string | null; carrier_code_masked: string }>
  >([]);
  const [favorites, setFavorites] = useState<Array<{ id: string; products?: { name?: string } | null }>>([]);
  const [storeMatches, setStoreMatches] = useState<
    Array<{ id: string; phone: string; store_member_no: string | null; source: string }>
  >([]);
  const [audits, setAudits] = useState<Array<{ id: string; action: string; created_at: string }>>([]);
  const [adminNotes, setAdminNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/members/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "載入失敗");
      setMember(data.member);
      setAdminNotes(data.member?.admin_notes ?? "");
      setOrders(data.app_orders ?? []);
      setOrderCount(data.app_order_count ?? data.app_orders?.length ?? 0);
      setAddressCount(data.address_count ?? 0);
      setCarrierCount(data.carrier_count ?? 0);
      setCarriersMasked(data.carriers_masked ?? []);
      setFavorites(data.favorites ?? []);
      setStoreMatches(data.store_member_matches ?? []);
      setAudits(data.audit_logs ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "載入失敗");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) load();
  }, [id, load]);

  const patch = async (body: Record<string, unknown>) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/members/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "更新失敗");
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "更新失敗");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async () => {
    if (!member) return;
    const next = !(member.is_active !== false);
    const ok = confirm(
      next
        ? "確定要恢復此 App 帳號嗎？"
        : "確定要停用此 App 帳號嗎？停用後會員將無法正常使用 App。"
    );
    if (!ok) return;
    await patch({ is_active: next });
  };

  const saveNotes = async () => {
    await patch({ admin_notes: adminNotes });
  };

  const resendVerification = async () => {
    const res = await fetch(`/api/admin/members/${id}/confirm-email`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? "操作失敗");
      return;
    }
    alert(data.message ?? "已處理 Email 驗證");
    await load();
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-40 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">{error ?? "找不到會員"}</p>
        <Button variant="outline" onClick={load}>
          重新載入
        </Button>
        <Link href="/admin/members" className="ml-2 text-sm text-primary hover:underline">
          返回 App 會員
        </Link>
      </div>
    );
  }

  const active = member.is_active !== false;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={member.full_name ?? member.email ?? "App 會員"}
        description="僅顯示 App 會員與 App 訂單資料。不含門市 POS 消費或發票交易。"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant={active ? "outline" : "default"} disabled={saving} onClick={toggleActive}>
              {active ? "停用 App 帳號" : "恢復 App 帳號"}
            </Button>
            <Link href="/admin/members">
              <Button variant="secondary">返回列表</Button>
            </Link>
          </div>
        }
      />

      {storeMatches.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-medium">發現相同電話的門市會員資料，請人工確認。</p>
          <p className="mt-1 text-xs">
            系統不會自動合併線上與門市會員，也不會同步門市消費紀錄。本頁不提供自動合併按鈕。
          </p>
          <ul className="mt-2 list-disc pl-5 text-xs">
            {storeMatches.map((m) => (
              <li key={m.id}>
                {m.phone}
                {m.store_member_no ? ` · ${m.store_member_no}` : ""} · 來源 {m.source}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-white p-4 shadow-card">
          <h2 className="font-medium text-coffee">基本資料</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">App 會員編號</dt>
              <dd className="font-mono">{member.member_number ?? member.member_code ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Email</dt>
              <dd>{member.email ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">電話</dt>
              <dd>{member.phone ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Email 驗證</dt>
              <dd>
                {member.email_verified ? (
                  <StatusBadge label="已驗證" variant="success" />
                ) : (
                  <StatusBadge label="未驗證" variant="warning" />
                )}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">帳號狀態</dt>
              <dd>
                {active ? (
                  <StatusBadge label="啟用" variant="success" />
                ) : (
                  <StatusBadge label="已停用" variant="warning" />
                )}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">註冊日期</dt>
              <dd>{member.created_at ? formatDate(member.created_at) : "—"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">最後登入</dt>
              <dd>{member.last_sign_in_at ? formatDate(member.last_sign_in_at) : "—"}</dd>
            </div>
          </dl>
          {!member.email_verified && (
            <Button className="mt-3" size="sm" variant="promo" onClick={resendVerification}>
              手動驗證 Email
            </Button>
          )}
        </section>

        <section className="rounded-xl border border-border bg-white p-4 shadow-card">
          <h2 className="font-medium text-coffee">App 統計</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">App 訂單數</p>
              <p className="text-xl font-bold">{orderCount}</p>
            </div>
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">收藏數</p>
              <p className="text-xl font-bold">{favorites.length}</p>
            </div>
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">地址數</p>
              <p className="text-xl font-bold">{addressCount}</p>
            </div>
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">載具數</p>
              <p className="text-xl font-bold">{carrierCount}</p>
              <p className="text-[10px] text-muted-foreground">完整號碼不顯示</p>
            </div>
          </div>
          {carriersMasked.length > 0 && (
            <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
              {carriersMasked.map((c) => (
                <li key={c.id}>
                  {c.carrier_name || "載具"}：{c.carrier_code_masked}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-xl border border-border bg-white p-4 shadow-card">
        <h2 className="mb-3 font-medium text-coffee">App 訂單</h2>
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">尚無 App 訂單</p>
        ) : (
          <ul className="divide-y divide-border">
            {orders.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <Link href={`/admin/orders/${o.id}`} className="font-mono text-primary hover:underline">
                  {o.order_number}
                </Link>
                <span>
                  {o.group_buy_event_id || o.channel === "group_buy" ? "團購" : "商城"}
                </span>
                <span>{ORDER_STATUS_LABELS[o.status as keyof typeof ORDER_STATUS_LABELS] ?? o.status}</span>
                <span>{formatCurrency(o.total_amount)}</span>
                <span className="text-xs text-muted-foreground">{formatDate(o.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-border bg-white p-4 shadow-card">
        <h2 className="font-medium text-coffee">管理備註</h2>
        <textarea
          className="mt-2 min-h-[100px] w-full rounded-lg border border-border p-3 text-sm"
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          placeholder="內部備註（不含 POS／門市消費）…"
        />
        <Button className="mt-2" onClick={saveNotes} disabled={saving}>
          {saving ? "儲存中…" : "儲存備註"}
        </Button>
      </section>

      <section className="rounded-xl border border-border bg-white p-4 shadow-card">
        <h2 className="mb-2 font-medium text-coffee">操作紀錄</h2>
        {audits.length === 0 ? (
          <p className="text-sm text-muted-foreground">尚無操作紀錄</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {audits.map((a) => (
              <li key={a.id} className="rounded-lg bg-muted/40 px-3 py-2">
                <span className="font-medium">{a.action}</span>
                <span className="ml-2 text-xs text-muted-foreground">{formatDate(a.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
