"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useAdminList } from "@/hooks/useAdminList";
import { commissionStatusVariant } from "@/lib/admin/status";
import { formatCurrency, COMMISSION_STATUS_LABELS } from "@/lib/utils";
import type { CommissionRecord } from "@/lib/types/database";

export default function AdminCommissionRecordsPage() {
  const { paginated, page, setPage, totalPages, refresh, loading, items } = useAdminList<CommissionRecord>(
    "/api/admin/commission-records",
    "records",
    ["reason"]
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const approve = async (id: string) => {
    await fetch(`/api/admin/commission-records/${id}/approve`, { method: "PATCH" });
    refresh();
  };

  const reject = async (id: string) => {
    await fetch(`/api/admin/commission-records/${id}/reject`, { method: "PATCH" });
    refresh();
  };

  const issue = async (id: string) => {
    await fetch(`/api/admin/commission-records/${id}/issue`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payoutMethod: "cash" }),
    });
    refresh();
  };

  const batchApprove = async () => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    await fetch("/api/admin/commission-records/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, action: "approve" }),
    });
    setSelected(new Set());
    refresh();
  };

  const pendingReview = items.filter((r) => r.status === "pending_review");

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="分潤紀錄"
        description="分潤審核、發放與批次處理"
        actions={
          <>
            {selected.size > 0 && (
              <Button variant="secondary" onClick={batchApprove}>
                批次核准 ({selected.size})
              </Button>
            )}
            <a
              href="/api/admin/commission-records/export?format=xlsx"
              className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-dark"
            >
              匯出 Excel
            </a>
          </>
        }
      />

      <AdminTable
        columns={[
          {
            key: "select",
            header: "",
            render: (r) =>
              r.status === "pending_review" ? (
                <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} />
              ) : null,
          },
          { key: "amount", header: "金額", render: (r) => <span className="font-medium text-promo">{formatCurrency(r.commission_amount)}</span> },
          { key: "reason", header: "說明", render: (r) => <span className="text-xs">{r.reason ?? "—"}</span> },
          {
            key: "status",
            header: "狀態",
            render: (r) => (
              <StatusBadge
                label={COMMISSION_STATUS_LABELS[r.status] ?? r.status}
                variant={commissionStatusVariant(r.status)}
              />
            ),
          },
          {
            key: "actions",
            header: "操作",
            render: (r) => (
              <div className="flex flex-wrap gap-1">
                {r.status === "pending_review" && (
                  <>
                    <Button size="sm" onClick={() => approve(r.id)}>
                      核准
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => reject(r.id)}>
                      拒絕
                    </Button>
                  </>
                )}
                {r.status === "approved" && (
                  <Button size="sm" onClick={() => issue(r.id)}>
                    發放
                  </Button>
                )}
              </div>
            ),
          },
        ]}
        rows={paginated}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        toolbar={
          pendingReview.length > 0 ? (
            <span className="text-sm text-muted-foreground">待審核：{pendingReview.length} 筆</span>
          ) : null
        }
      />
    </div>
  );
}
