"use client";

import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useAdminList } from "@/hooks/useAdminList";
import { paymentStatusVariant } from "@/lib/admin/status";
import { formatCurrency, PAYMENT_STATUS_LABELS } from "@/lib/utils";
import type { PaymentReport } from "@/lib/types/database";

export default function AdminPaymentsPage() {
  const { paginated, search, setSearch, page, setPage, totalPages, refresh, loading } = useAdminList<PaymentReport>(
    "/api/payment-reports",
    "paymentReports",
    ["last_five_digits"]
  );

  const act = async (id: string, action: "confirm" | "reject") => {
    await fetch(`/api/payment-reports/${id}/confirm`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    refresh();
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader title="付款審核" description="確認或拒絕會員付款回報" />

      <AdminTable
        columns={[
          { key: "amount", header: "金額", render: (r) => formatCurrency(r.amount) },
          { key: "digits", header: "後五碼", render: (r) => r.last_five_digits ?? "—" },
          { key: "method", header: "方式", render: (r) => r.payment_method },
          {
            key: "status",
            header: "狀態",
            render: (r) => (
              <StatusBadge
                label={PAYMENT_STATUS_LABELS[r.status] ?? r.status}
                variant={paymentStatusVariant(r.status)}
              />
            ),
          },
          {
            key: "actions",
            header: "操作",
            render: (r) =>
              r.status === "pending" ? (
                <div className="flex gap-1">
                  <Button size="sm" onClick={() => act(r.id, "confirm")}>
                    確認
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => act(r.id, "reject")}>
                    拒絕
                  </Button>
                </div>
              ) : (
                "—"
              ),
          },
        ]}
        rows={paginated}
        search={search}
        onSearchChange={setSearch}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
