"use client";

import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { useAdminList } from "@/hooks/useAdminList";
import { formatCurrency, formatDate } from "@/lib/utils";

type PickupRow = {
  id: string;
  order_number: string;
  total_amount: number;
  created_at: string;
  profiles?: { full_name?: string; phone?: string };
};

export default function AdminPickupPage() {
  const { paginated, search, setSearch, page, setPage, totalPages, refresh, loading } = useAdminList<PickupRow>(
    "/api/admin/pickup",
    "pickups",
    ["order_number"]
  );

  const markPickedUp = async (orderId: string) => {
    await fetch("/api/admin/pickup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });
    refresh();
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader title="取貨管理" description="待取貨訂單清單與取貨確認" />

      <AdminTable
        columns={[
          { key: "order_number", header: "訂單編號", render: (o) => <span className="font-mono">{o.order_number}</span> },
          { key: "member", header: "會員", render: (o) => o.profiles?.full_name ?? "—" },
          { key: "phone", header: "電話", render: (o) => o.profiles?.phone ?? "—" },
          { key: "amount", header: "金額", render: (o) => formatCurrency(o.total_amount) },
          { key: "time", header: "建立時間", render: (o) => <span className="text-xs">{formatDate(o.created_at)}</span> },
          {
            key: "actions",
            header: "操作",
            render: (o) => (
              <Button size="sm" onClick={() => markPickedUp(o.id)}>
                確認取貨
              </Button>
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
