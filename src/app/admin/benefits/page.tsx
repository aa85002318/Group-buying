"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useAdminList } from "@/hooks/useAdminList";
import type { MemberBenefit } from "@/lib/types/database";

type BenefitRow = MemberBenefit & { assignment_count?: number };

const STATUS_LABEL: Record<string, string> = {
  draft: "草稿",
  active: "啟用",
  disabled: "停用",
};

export default function AdminBenefitsPage() {
  const router = useRouter();
  const { paginated, search, setSearch, page, setPage, totalPages, loading, refresh } =
    useAdminList<BenefitRow>("/api/admin/benefits", "benefits", ["title", "summary"]);

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="會員福利"
        description="僅管理 App 發放福利，不含 POS／門市消費累計。可手動、指定會員或依團購參與者發放。"
        actions={<Button onClick={() => router.push("/admin/benefits/new")}>新增福利</Button>}
      />

      <AdminTable
        columns={[
          { key: "title", header: "名稱", render: (b) => b.title },
          {
            key: "status",
            header: "狀態",
            render: (b) => (
              <StatusBadge
                label={STATUS_LABEL[b.status] ?? b.status}
                variant={b.status === "active" ? "success" : b.status === "draft" ? "warning" : "secondary"}
              />
            ),
          },
          { key: "count", header: "已發放", render: (b) => b.assignment_count ?? 0 },
          {
            key: "actions",
            header: "操作",
            render: (b) => (
              <Button size="sm" variant="outline" onClick={() => router.push(`/admin/benefits/${b.id}`)}>
                編輯／發放
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
        emptyText="尚無福利"
        toolbar={
          <Button size="sm" variant="secondary" onClick={refresh}>
            重新整理
          </Button>
        }
      />
    </div>
  );
}
