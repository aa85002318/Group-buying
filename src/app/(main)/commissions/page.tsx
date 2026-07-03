"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, COMMISSION_STATUS_LABELS } from "@/lib/utils";
import type { CommissionRecord } from "@/lib/types/database";

export default function CommissionsPage() {
  const [commissions, setCommissions] = useState<CommissionRecord[]>([]);
  const [summary, setSummary] = useState({ total: 0, pending: 0, approved: 0, issued: 0, count: 0 });

  useEffect(() => {
    fetch("/api/commissions/my").then((r) => r.json()).then((d) => setCommissions(d.commissions ?? [])).catch(() => {});
    fetch("/api/commissions/my/summary").then((r) => r.json()).then((d) => setSummary((s) => d.summary ?? s)).catch(() => {});
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-coffee">我的分潤</h1>
      <div className="grid grid-cols-2 gap-3">
        <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">累計</p><p className="text-lg font-bold text-promo">{formatCurrency(summary.total)}</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">待審核</p><p className="text-lg font-bold text-promo">{formatCurrency(summary.pending)}</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">已核准</p><p className="text-lg font-bold text-promo">{formatCurrency(summary.approved)}</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">已發放</p><p className="text-lg font-bold text-green-700">{formatCurrency(summary.issued)}</p></CardContent></Card>
      </div>
      <h2 className="font-medium">分潤明細</h2>
      {commissions.length === 0 ? (
        <p className="text-sm text-muted-foreground">尚無分潤紀錄，分享商品給朋友開始賺取分潤！</p>
      ) : (
        commissions.map((c) => (
          <Card key={c.id}>
            <CardContent className="flex justify-between p-4">
              <div>
                <p className="font-medium text-promo">{formatCurrency(c.commission_amount)}</p>
                <p className="text-xs text-muted-foreground">{c.reason}</p>
              </div>
              <Badge>{COMMISSION_STATUS_LABELS[c.status] ?? c.status}</Badge>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
