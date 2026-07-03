"use client";

import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useAdminList } from "@/hooks/useAdminList";
import { ticketStatusVariant } from "@/lib/admin/status";
import { TICKET_STATUS_LABELS } from "@/lib/utils";
import type { SupportTicket } from "@/lib/types/database";

export default function AdminSupportPage() {
  const { paginated, page, setPage, totalPages, refresh, loading } = useAdminList<SupportTicket>(
    "/api/admin/support-tickets",
    "tickets",
    ["subject"]
  );

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/admin/support-tickets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    refresh();
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader title="客服工單" description="會員客服問題處理" />

      <AdminTable
        columns={[
          { key: "subject", header: "主旨", render: (t) => t.subject },
          { key: "priority", header: "優先級", render: (t) => t.priority },
          {
            key: "status",
            header: "狀態",
            render: (t) => (
              <StatusBadge
                label={TICKET_STATUS_LABELS[t.status] ?? t.status}
                variant={ticketStatusVariant(t.status)}
              />
            ),
          },
          {
            key: "actions",
            header: "操作",
            render: (t) => (
              <div className="flex flex-wrap gap-1">
                {t.status === "open" && (
                  <Button size="sm" variant="secondary" onClick={() => updateStatus(t.id, "in_progress")}>
                    接手
                  </Button>
                )}
                {["open", "in_progress"].includes(t.status) && (
                  <Button size="sm" onClick={() => updateStatus(t.id, "resolved")}>
                    結案
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
      />
    </div>
  );
}
