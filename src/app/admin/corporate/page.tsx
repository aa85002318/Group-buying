"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { formatDate } from "@/lib/utils";

type Inquiry = {
  id: string;
  company_name: string;
  contact_name: string;
  contact_phone: string | null;
  inquiry_type: string;
  status: string;
  message: string;
  created_at: string;
};

export default function AdminCorporatePage() {
  const [rows, setRows] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/corporate-inquiries")
      .then((r) => r.json())
      .then((d) => setRows(d.inquiries ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/admin/corporate-inquiries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader title="企業詢價" description="福委／企業合作詢價管理" />
      <AdminTable
        columns={[
          { key: "company", header: "公司", render: (r) => r.company_name },
          { key: "contact", header: "聯絡人", render: (r) => `${r.contact_name}${r.contact_phone ? ` · ${r.contact_phone}` : ""}` },
          { key: "type", header: "類型", render: (r) => r.inquiry_type },
          { key: "status", header: "狀態", render: (r) => r.status },
          { key: "created", header: "建立", render: (r) => <span className="text-xs">{formatDate(r.created_at)}</span> },
          {
            key: "actions",
            header: "操作",
            render: (r) => (
              <div className="flex flex-wrap gap-1">
                {r.status === "open" && (
                  <Button size="sm" variant="secondary" onClick={() => updateStatus(r.id, "contacted")}>
                    已聯繫
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, "quoted")}>
                  已報價
                </Button>
                <Button size="sm" onClick={() => updateStatus(r.id, "closed")}>
                  結案
                </Button>
              </div>
            ),
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
