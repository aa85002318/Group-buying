"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { AdminBarChart, AdminDonutChart } from "@/components/admin/v2/AdminCharts";
import { MemberBarcode } from "@/components/profile/MemberBarcode";
import { useAdminList } from "@/hooks/useAdminList";
import { formatCurrency, formatDate, ROLE_LABELS } from "@/lib/utils";
import type { Profile, UserRole } from "@/lib/types/database";

type Member = Profile & {
  store_credit_balance?: number;
  email_verified?: boolean;
  member_number?: string | null;
  is_active?: boolean;
  app_order_count?: number;
  favorite_count?: number;
  benefit_count?: number;
  last_sign_in_at?: string | null;
};

const ROLES: UserRole[] = ["member", "admin", "store_staff", "group_leader", "promoter", "livestream_host"];

const GENDER_LABELS: Record<string, string> = { male: "男性", female: "女性", unknown: "未知" };

type SegmentFilters = { gender: string; ageGroup: string; city: string; memberLevel: string };

type SegmentData = {
  summary: { totalMembers: number; filteredCount: number; totalSpent: number; avgOrderValue: number };
  filters: { genders: string[]; ageGroups: string[]; cities: string[]; memberLevels: string[] };
  breakdowns: {
    gender: Array<{ label: string; value: number; color: string }>;
    ageGroup: Array<{ label: string; value: number }>;
    city: Array<{ label: string; value: number }>;
  };
  members: Array<{ user_id: string }>;
};

export default function AdminMembersPage() {
  const { paginated, search, setSearch, page, setPage, totalPages, refresh, loading } = useAdminList<Member>(
    "/api/admin/members",
    "members",
    ["email", "full_name", "member_code", "phone"]
  );
  const [showSegments, setShowSegments] = useState(false);
  const [segmentFilters, setSegmentFilters] = useState<SegmentFilters>({ gender: "", ageGroup: "", city: "", memberLevel: "" });
  const [segmentData, setSegmentData] = useState<SegmentData | null>(null);
  const [segmentLoading, setSegmentLoading] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    birthday: "",
    email: "",
    role: "member" as UserRole,
    credit: "0",
  });

  useEffect(() => {
    if (!showSegments) return;
    setSegmentLoading(true);
    const params = new URLSearchParams();
    if (segmentFilters.gender) params.set("gender", segmentFilters.gender);
    if (segmentFilters.ageGroup) params.set("ageGroup", segmentFilters.ageGroup);
    if (segmentFilters.city) params.set("city", segmentFilters.city);
    if (segmentFilters.memberLevel) params.set("memberLevel", segmentFilters.memberLevel);
    fetch(`/api/admin/members/segments?${params}`)
      .then((r) => r.json())
      .then((d) => setSegmentData(d))
      .finally(() => setSegmentLoading(false));
  }, [showSegments, segmentFilters]);

  const segmentUserIds = useMemo(
    () => new Set(segmentData?.members.map((m) => m.user_id) ?? []),
    [segmentData]
  );

  const hasSegmentFilter = Boolean(segmentFilters.gender || segmentFilters.ageGroup || segmentFilters.city || segmentFilters.memberLevel);
  const displayRows = hasSegmentFilter && segmentData
    ? paginated.filter((m) => segmentUserIds.has(m.id))
    : paginated;

  const openEdit = (m: Member) => {
    setEditing(m);
    setForm({
      full_name: m.full_name ?? "",
      phone: m.phone ?? m.member_code ?? "",
      birthday: m.birthday?.slice(0, 10) ?? "",
      email: m.email ?? "",
      role: m.role,
      credit: String(m.store_credit_balance ?? 0),
    });
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/members/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: form.full_name,
          phone: form.phone,
          birthday: form.birthday || undefined,
          email: form.email,
          role: form.role,
          store_credit_balance: Number(form.credit),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "儲存失敗");
      setEditing(null);
      refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  const confirmEmail = async (member: Member) => {
    if (member.email_verified) {
      alert("此會員 Email 已驗證");
      return;
    }
    if (
      !confirm(
        `確定要手動驗證 ${member.email ?? member.full_name ?? "此會員"} 的 Email 嗎？\n驗證後即可登入與下單。`
      )
    ) {
      return;
    }
    setConfirmingId(member.id);
    try {
      const res = await fetch(`/api/admin/members/${member.id}/confirm-email`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "驗證失敗");
      alert(data.message ?? "已手動驗證 Email");
      if (editing?.id === member.id) {
        setEditing({ ...editing, email_verified: true });
      }
      refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "驗證失敗");
    } finally {
      setConfirmingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="App 會員"
        description="僅管理 CHIMEIDIY App 會員資料與 App 訂單統計。不含門市 POS 消費、門市發票或線下購買歷史。"
        actions={
          <Button variant={showSegments ? "default" : "outline"} onClick={() => setShowSegments((v) => !v)}>
            {showSegments ? "關閉分群" : "客戶分群"}
          </Button>
        }
      />

      {showSegments && (
        <div className="rounded-[20px] border border-border bg-white p-6 shadow-card space-y-4">
          <h2 className="font-semibold text-foreground">客戶分群篩選</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <select
              className="input-field"
              value={segmentFilters.gender}
              onChange={(e) => setSegmentFilters({ ...segmentFilters, gender: e.target.value })}
            >
              <option value="">全部性別</option>
              {(segmentData?.filters.genders ?? ["male", "female", "unknown"]).map((g) => (
                <option key={g} value={g}>{GENDER_LABELS[g] ?? g}</option>
              ))}
            </select>
            <select
              className="input-field"
              value={segmentFilters.ageGroup}
              onChange={(e) => setSegmentFilters({ ...segmentFilters, ageGroup: e.target.value })}
            >
              <option value="">全部年齡層</option>
              {(segmentData?.filters.ageGroups ?? []).map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            <select
              className="input-field"
              value={segmentFilters.city}
              onChange={(e) => setSegmentFilters({ ...segmentFilters, city: e.target.value })}
            >
              <option value="">全部縣市</option>
              {(segmentData?.filters.cities ?? []).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              className="input-field"
              value={segmentFilters.memberLevel}
              onChange={(e) => setSegmentFilters({ ...segmentFilters, memberLevel: e.target.value })}
            >
              <option value="">全部（App 會員）</option>
              {(segmentData?.filters.memberLevels ?? []).filter((l) => !/VIP/i.test(l)).map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          {segmentLoading ? (
            <p className="text-sm text-foreground-secondary">載入分群資料…</p>
          ) : segmentData ? (
            <>
              <div className="grid gap-4 sm:grid-cols-4">
                {[
                  { label: "符合人數", value: segmentData.summary.filteredCount },
                  { label: "App 訂單總額", value: formatCurrency(segmentData.summary.totalSpent) },
                  { label: "App 平均客單", value: formatCurrency(segmentData.summary.avgOrderValue) },
                  { label: "App 會員總數", value: segmentData.summary.totalMembers },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl bg-background p-4">
                    <p className="text-xs text-foreground-secondary">{item.label}</p>
                    <p className="mt-1 text-lg font-bold text-foreground">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="grid gap-4 lg:grid-cols-3">
                <div>
                  <p className="mb-2 text-sm font-medium text-foreground-secondary">性別分布</p>
                  <AdminDonutChart segments={segmentData.breakdowns.gender} />
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-foreground-secondary">年齡分布</p>
                  <AdminBarChart data={segmentData.breakdowns.ageGroup} />
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-foreground-secondary">縣市分布</p>
                  <AdminBarChart data={segmentData.breakdowns.city} />
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {editing && (
        <div className="rounded-xl bg-white p-4 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-medium text-coffee">編輯會員：{editing.full_name ?? editing.email}</h2>
            {editing.email_verified ? (
              <StatusBadge label="Email 已驗證" variant="success" />
            ) : (
              <StatusBadge label="Email 未驗證" variant="warning" />
            )}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Input
              placeholder="姓名"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
            <Input
              type="tel"
              placeholder="手機（會員條碼）"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <Input
              type="date"
              value={form.birthday}
              onChange={(e) => setForm({ ...form, birthday: e.target.value })}
            />
            <Input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <select
              className="input-field"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
            <Input
              type="number"
              placeholder="購物金餘額"
              value={form.credit}
              onChange={(e) => setForm({ ...form, credit: e.target.value })}
            />
          </div>
          {form.phone ? (
            <div className="mt-4">
              <MemberBarcode value={form.phone.replace(/\D/g, "")} title="會員條碼預覽" />
            </div>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={save} disabled={saving}>
              {saving ? "儲存中…" : "儲存"}
            </Button>
            {!editing.email_verified && (
              <Button
                variant="promo"
                disabled={confirmingId === editing.id}
                onClick={() => confirmEmail(editing)}
              >
                {confirmingId === editing.id ? "驗證中…" : "手動驗證 Email"}
              </Button>
            )}
            <Button variant="secondary" onClick={() => setEditing(null)}>
              取消
            </Button>
          </div>
        </div>
      )}

      <AdminTable
        columns={[
          { key: "name", header: "姓名", render: (m) => m.full_name ?? "—" },
          { key: "phone", header: "電話", render: (m) => m.phone ?? "—" },
          { key: "email", header: "Email", render: (m) => m.email ?? "—" },
          {
            key: "memberNo",
            header: "App 會員編號",
            render: (m) => (
              <span className="font-mono text-xs">{m.member_number ?? m.member_code ?? "—"}</span>
            ),
          },
          {
            key: "verified",
            header: "Email 驗證",
            render: (m) =>
              m.email_verified ? (
                <StatusBadge label="已驗證" variant="success" />
              ) : (
                <StatusBadge label="未驗證" variant="warning" />
              ),
          },
          {
            key: "active",
            header: "帳號狀態",
            render: (m) =>
              m.is_active === false ? (
                <StatusBadge label="已停用" variant="warning" />
              ) : (
                <StatusBadge label="啟用" variant="success" />
              ),
          },
          {
            key: "orders",
            header: "App 訂單",
            render: (m) => m.app_order_count ?? 0,
          },
          {
            key: "favorites",
            header: "收藏",
            render: (m) => m.favorite_count ?? 0,
          },
          {
            key: "joined",
            header: "註冊日期",
            render: (m) => <span className="text-xs">{formatDate(m.created_at)}</span>,
          },
          {
            key: "actions",
            header: "操作",
            render: (m) => (
              <div className="flex flex-wrap justify-end gap-1">
                <Link href={`/admin/members/${m.id}`}>
                  <Button size="sm" variant="secondary">
                    詳細
                  </Button>
                </Link>
                <Link href={`/admin/members/${m.id}/analysis`}>
                  <Button size="sm" variant="outline">
                    分析
                  </Button>
                </Link>
                <Button size="sm" variant="outline" onClick={() => openEdit(m)}>
                  編輯
                </Button>
                {!m.email_verified && (
                  <Button
                    size="sm"
                    variant="promo"
                    disabled={confirmingId === m.id}
                    onClick={() => confirmEmail(m)}
                  >
                    {confirmingId === m.id ? "驗證中…" : "驗證 Email"}
                  </Button>
                )}
              </div>
            ),
          },
        ]}
        rows={displayRows}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="搜尋姓名、手機、Email、會員編號…"
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        emptyText="尚無 App 會員"
      />
    </div>
  );
}
