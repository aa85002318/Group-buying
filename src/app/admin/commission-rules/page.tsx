"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useAdminList } from "@/hooks/useAdminList";
import type { CommissionRule } from "@/lib/types/database";

export default function AdminCommissionRulesPage() {
  const { paginated, page, setPage, totalPages, refresh, loading } = useAdminList<CommissionRule>(
    "/api/admin/commission-rules",
    "rules",
    ["name"]
  );
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    rule_type: "percentage",
    target_role: "member",
    calculation_base: "after_discount",
    percentage_rate: "5",
    priority: "100",
    status: "active",
  });

  const save = async () => {
    await fetch("/api/admin/commission-rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        percentage_rate: Number(form.percentage_rate),
        priority: Number(form.priority),
        settlement_wait_days: 7,
        is_multilevel_enabled: false,
      }),
    });
    setShowForm(false);
    refresh();
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="分潤規則"
        description="分潤計算規則設定"
        actions={<Button onClick={() => setShowForm(true)}>新增規則</Button>}
      />

      {showForm && (
        <div className="rounded-xl bg-white p-4 shadow-card space-y-3">
          <Input placeholder="規則名稱" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              placeholder="比例 %"
              type="number"
              value={form.percentage_rate}
              onChange={(e) => setForm({ ...form, percentage_rate: e.target.value })}
            />
            <Input
              placeholder="優先序"
              type="number"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={save}>儲存</Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              取消
            </Button>
          </div>
        </div>
      )}

      <AdminTable
        columns={[
          { key: "name", header: "名稱", render: (r) => r.name },
          { key: "type", header: "類型", render: (r) => r.rule_type },
          {
            key: "rate",
            header: "比例",
            render: (r) => (r.percentage_rate ? `${r.percentage_rate}%` : "—"),
          },
          { key: "priority", header: "優先序", render: (r) => r.priority },
          {
            key: "status",
            header: "狀態",
            render: (r) => (
              <StatusBadge label={r.status === "active" ? "啟用" : "停用"} variant={r.status === "active" ? "success" : "secondary"} />
            ),
          },
        ]}
        rows={paginated}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
