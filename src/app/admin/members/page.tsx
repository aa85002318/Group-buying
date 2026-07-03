"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { MemberBarcode } from "@/components/profile/MemberBarcode";
import { useAdminList } from "@/hooks/useAdminList";
import { formatCurrency, formatDate, ROLE_LABELS } from "@/lib/utils";
import { formatBirthdayDisplay } from "@/lib/validation/customer";
import type { Profile, UserRole } from "@/lib/types/database";

type Member = Profile & { store_credit_balance?: number };

const ROLES: UserRole[] = ["member", "admin", "store_staff", "group_leader", "promoter", "livestream_host"];

export default function AdminMembersPage() {
  const { paginated, search, setSearch, page, setPage, totalPages, refresh, loading } = useAdminList<Member>(
    "/api/admin/members",
    "members",
    ["email", "full_name", "member_code", "phone"]
  );
  const [editing, setEditing] = useState<Member | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    birthday: "",
    email: "",
    role: "member" as UserRole,
    credit: "0",
  });

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

  return (
    <div className="space-y-4">
      <AdminPageHeader title="會員管理" description="會員資料、條碼（手機號碼）、角色與購物金" />

      {editing && (
        <div className="rounded-xl bg-white p-4 shadow-card">
          <h2 className="font-medium text-coffee">編輯會員：{editing.full_name ?? editing.email}</h2>
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
            <select className="input-field" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}>
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
            <Button variant="secondary" onClick={() => setEditing(null)}>
              取消
            </Button>
          </div>
        </div>
      )}

      <AdminTable
        columns={[
          { key: "name", header: "姓名", render: (m) => m.full_name ?? "—" },
          { key: "phone", header: "手機", render: (m) => m.phone ?? "—" },
          { key: "birthday", header: "生日", render: (m) => formatBirthdayDisplay(m.birthday) },
          { key: "email", header: "Email", render: (m) => m.email ?? "—" },
          { key: "code", header: "會員條碼", render: (m) => <span className="font-mono">{m.member_code}</span> },
          {
            key: "role",
            header: "角色",
            render: (m) => <StatusBadge label={ROLE_LABELS[m.role] ?? m.role} variant="primary" />,
          },
          {
            key: "credit",
            header: "購物金",
            render: (m) => formatCurrency(m.store_credit_balance ?? 0),
          },
          { key: "joined", header: "加入時間", render: (m) => <span className="text-xs">{formatDate(m.created_at)}</span> },
          {
            key: "actions",
            header: "操作",
            render: (m) => (
              <Button size="sm" variant="secondary" onClick={() => openEdit(m)}>
                編輯
              </Button>
            ),
          },
        ]}
        rows={paginated}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="搜尋姓名、手機、Email…"
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
