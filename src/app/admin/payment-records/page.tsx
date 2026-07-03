"use client";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { useAdminList } from "@/hooks/useAdminList";
import { formatCurrency, formatDate, ORDER_PAYMENT_STATUS_LABELS } from "@/lib/utils";

type PaymentRow = {
  id: string;
  order_id: string;
  amount: number;
  gateway: string;
  status: string;
  merchant_trade_no: string | null;
  paid_at: string | null;
  created_at: string;
};

export default function AdminPaymentRecordsPage() {
  const { paginated, search, setSearch, page, setPage, totalPages, loading } = useAdminList<PaymentRow>(
    "/api/admin/payments",
    "payments",
    ["merchant_trade_no"]
  );

  return (
    <div className="space-y-4">
      <AdminPageHeader title="金流紀錄" description="線上／門市付款交易紀錄（ECPay、藍新預留）" />

      <AdminTable
        columns={[
          { key: "trade", header: "交易編號", render: (r) => r.merchant_trade_no ?? "—" },
          { key: "gateway", header: "金流", render: (r) => r.gateway },
          {
            key: "status",
            header: "狀態",
            render: (r) => ORDER_PAYMENT_STATUS_LABELS[r.status] ?? r.status,
          },
          { key: "amount", header: "金額", render: (r) => formatCurrency(r.amount) },
          { key: "time", header: "建立時間", render: (r) => formatDate(r.created_at) },
        ]}
        rows={paginated}
        search={search}
        onSearchChange={setSearch}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        searchPlaceholder="搜尋交易編號…"
      />
    </div>
  );
}
