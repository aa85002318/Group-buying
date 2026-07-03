"use client";

import { useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type StaffRow = {
  id: string;
  user_id: string;
  store_id: string;
  title: string | null;
  is_active: boolean;
  profiles?: { full_name?: string; email?: string };
  stores?: { name?: string };
};

export default function AdminStaffPage() {
  const [rows, setRows] = useState<StaffRow[]>([]);
  const [stores, setStores] = useState<Array<{ id: string; name: string }>>([]);
  const [form, setForm] = useState({ email: "", store_id: "", title: "" });
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/admin/staff").then((r) => r.json()),
      fetch("/api/stores").then((r) => r.json()),
    ])
      .then(([staffRes, storesRes]) => {
        setRows(staffRes.staff ?? []);
        setStores(storesRes.stores ?? []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
  }, []);

  const addStaff = async () => {
    await fetch("/api/admin/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ email: "", store_id: "", title: "" });
    refresh();
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader title="門市人員管理" description="指派門市人員與取貨掃碼權限" />

      <div className="grid gap-2 rounded-xl border bg-card p-4 md:grid-cols-4">
        <Input
          placeholder="會員 Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <select
          className="input-field"
          value={form.store_id}
          onChange={(e) => setForm({ ...form, store_id: e.target.value })}
        >
          <option value="">選擇門市</option>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <Input
          placeholder="職稱（選填）"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <Button onClick={addStaff} disabled={!form.email || !form.store_id}>
          新增人員
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        門市人員請使用 <a href="/staff/pickup-scan" className="text-primary underline">/staff/pickup-scan</a> 掃碼銷帳。
      </p>

      <AdminTable
        columns={[
          { key: "name", header: "姓名", render: (r) => r.profiles?.full_name ?? "—" },
          { key: "email", header: "Email", render: (r) => r.profiles?.email ?? "—" },
          { key: "store", header: "門市", render: (r) => r.stores?.name ?? "—" },
          { key: "title", header: "職稱", render: (r) => r.title ?? "—" },
          {
            key: "status",
            header: "狀態",
            render: (r) => (r.is_active ? "啟用" : "停用"),
          },
        ]}
        rows={rows}
        loading={loading}
        page={1}
        totalPages={1}
        onPageChange={() => {}}
      />
    </div>
  );
}
