"use client";

import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useAdminList } from "@/hooks/useAdminList";
import { rewardStatusVariant } from "@/lib/admin/status";
import { formatCurrency, REWARD_STATUS_LABELS } from "@/lib/utils";
import type { RewardRecord } from "@/lib/types/database";

export default function AdminRewardsPage() {
  const { paginated, page, setPage, totalPages, refresh, loading } = useAdminList<RewardRecord>(
    "/api/admin/rewards",
    "rewards",
    ["reward_type"]
  );

  const approve = async (id: string) => {
    await fetch(`/api/admin/rewards/${id}/approve`, { method: "PATCH" });
    refresh();
  };

  const reject = async (id: string) => {
    await fetch(`/api/admin/rewards/${id}/reject`, { method: "PATCH" });
    refresh();
  };

  const issue = async (id: string) => {
    await fetch(`/api/admin/rewards/${id}/issue`, { method: "PATCH" });
    refresh();
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader title="獎勵管理" description="分享獎勵審核、拒絕與發放" />

      <AdminTable
        columns={[
          { key: "type", header: "類型", render: (r) => r.reward_type },
          { key: "amount", header: "金額", render: (r) => formatCurrency(r.amount) },
          {
            key: "status",
            header: "狀態",
            render: (r) => (
              <StatusBadge
                label={REWARD_STATUS_LABELS[r.status] ?? r.status}
                variant={rewardStatusVariant(r.status)}
              />
            ),
          },
          {
            key: "actions",
            header: "操作",
            render: (r) => (
              <div className="flex flex-wrap gap-1">
                {r.status === "pending" && (
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
      />
    </div>
  );
}
