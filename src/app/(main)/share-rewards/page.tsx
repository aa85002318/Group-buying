"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { RewardRecord } from "@/lib/types/database";

export default function ShareRewardsPage() {
  const [rewards, setRewards] = useState<RewardRecord[]>([]);
  const [shareStats, setShareStats] = useState<Array<{ ref_code: string; click_count: number; signup_count: number }>>([]);

  useEffect(() => {
    fetch("/api/rewards/my").then((r) => r.json()).then((d) => setRewards(d.rewards ?? [])).catch(() => {});
    fetch("/api/share/my").then((r) => r.json()).then((d) => setShareStats(d.shareStats ?? [])).catch(() => {});
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-coffee">分享獎勵</h1>
      <Card>
        <CardContent className="p-4">
          <h2 className="font-medium mb-2">我的分享統計</h2>
          {shareStats.length === 0 ? (
            <p className="text-sm text-muted-foreground">分享商品給朋友，即可獲得獎勵！</p>
          ) : (
            shareStats.map((s) => (
              <div key={s.ref_code} className="flex justify-between text-sm py-1">
                <span>{s.ref_code}</span>
                <span>點擊 {s.click_count} / 註冊 {s.signup_count}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
      <h2 className="font-medium">獎勵紀錄</h2>
      {rewards.length === 0 ? (
        <p className="text-sm text-muted-foreground">尚無獎勵紀錄</p>
      ) : (
        rewards.map((r) => (
          <Card key={r.id}>
            <CardContent className="flex justify-between p-4">
              <div>
                <p className="font-medium">{r.reward_type}</p>
                <p className="text-promo">{formatCurrency(r.amount)}</p>
              </div>
              <Badge>{r.status}</Badge>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
