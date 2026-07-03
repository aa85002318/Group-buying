"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { formatDate } from "@/lib/utils";

type ShareRow = {
  id: string;
  share_type: string;
  ref_code: string;
  click_count: number;
  signup_count: number;
  created_at: string;
  profiles?: { full_name?: string; email?: string; member_code?: string };
};

type Summary = {
  totalClicks: number;
  totalSignups: number;
  totalLinks: number;
};

export default function AdminShareTrackingPage() {
  const [tracking, setTracking] = useState<ShareRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/share-tracking")
      .then((r) => r.json())
      .then((d) => {
        setTracking(d.tracking ?? []);
        setSummary(d.summary ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <AdminPageHeader title="分享追蹤" description="分享連結點擊與註冊轉換分析" />

      {summary && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">分享連結數</p>
              <p className="text-2xl font-bold text-primary">{summary.totalLinks}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">總點擊數</p>
              <p className="text-2xl font-bold text-primary">{summary.totalClicks}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">總註冊數</p>
              <p className="text-2xl font-bold text-primary">{summary.totalSignups}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <AdminTable
        columns={[
          {
            key: "sharer",
            header: "分享者",
            render: (t) => t.profiles?.full_name ?? t.profiles?.email ?? "—",
          },
          { key: "type", header: "類型", render: (t) => t.share_type },
          { key: "ref", header: "推薦碼", render: (t) => <span className="font-mono">{t.ref_code}</span> },
          { key: "clicks", header: "點擊", render: (t) => t.click_count },
          { key: "signups", header: "註冊", render: (t) => t.signup_count },
          { key: "time", header: "建立時間", render: (t) => <span className="text-xs">{formatDate(t.created_at)}</span> },
        ]}
        rows={tracking}
        loading={loading}
      />
    </div>
  );
}
