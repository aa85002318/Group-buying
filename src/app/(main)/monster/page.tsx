"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MonsterIllustration } from "@/components/monster/MonsterIllustration";
import { MonsterProgressBar } from "@/components/monster/MonsterProgressBar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/client";
import {
  MONSTER_STAGE_LABELS,
  checkDailyLimit,
  type MonsterStage,
} from "@/lib/services/monsterService";
import type { MonsterProfile, MonsterReward } from "@/lib/types/database";

const REWARD_STATUS_LABELS: Record<string, string> = {
  pending_review: "待審核",
  issued: "已發放",
  used: "已使用",
  expired: "已過期",
};

export default function MonsterPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<MonsterProfile | null>(null);
  const [rewards, setRewards] = useState<MonsterReward[]>([]);
  const [nextThreshold, setNextThreshold] = useState<number | null>(5);
  const [dailyRemaining, setDailyRemaining] = useState(3);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) router.push("/auth/login");
      });
    }

    Promise.all([
      fetch("/api/monster/profile").then((r) => r.json()),
      fetch("/api/monster/rewards").then((r) => r.json()),
      fetch("/api/monster/products").then((r) => r.json()),
    ])
      .then(([profileRes, rewardsRes, productsRes]) => {
        if (profileRes.profile) setProfile(profileRes.profile);
        if (rewardsRes.rewards) setRewards(rewardsRes.rewards);
        if (rewardsRes.nextThreshold !== undefined) setNextThreshold(rewardsRes.nextThreshold);

        const shareRecords = (productsRes.products ?? [])
          .filter((p: { share_status: string }) => p.share_status !== "available")
          .map(() => ({ created_at: new Date().toISOString(), status: "pending_review" }));
        const daily = checkDailyLimit(shareRecords);
        setDailyRemaining(daily.remaining);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return <p className="text-center text-muted-foreground py-8">載入中…</p>;
  }

  const breadKg = Number(profile?.bread_kg ?? 0);
  const stage = (profile?.current_stage ?? "hungry") as MonsterStage;
  const progressMax = nextThreshold ?? Math.max(breadKg + 5, 5);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-xl font-bold text-[#333333]">我的麵包小怪獸</h1>
        <p className="text-sm text-[#8A8A8A]">{profile?.monster_name ?? "麵包小怪獸"}</p>
      </div>

      <div className="flex justify-center py-2">
        <MonsterIllustration stage={stage} />
      </div>

      <Card className="border-[#F7DADA]">
        <CardContent className="space-y-4 p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-[#C94C4C]">{breadKg.toFixed(1)} kg</p>
            <p className="text-sm text-[#8A8A8A]">累積麵包重量</p>
          </div>

          <MonsterProgressBar
            current={breadKg}
            max={progressMax}
            label={nextThreshold ? `距離下一個獎勵（${nextThreshold} kg）` : "已達最高門檻"}
          />

          <div className="flex justify-between text-sm">
            <span className="text-[#8A8A8A]">狀態</span>
            <span className="font-medium text-[#333333]">{MONSTER_STAGE_LABELS[stage]}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#8A8A8A]">今日可分享</span>
            <span className="font-medium text-[#C94C4C]">剩餘 {dailyRemaining} 次</span>
          </div>
        </CardContent>
      </Card>

      <Link
        href="/monster/products"
        className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-primary px-6 text-base font-medium text-primary-foreground hover:bg-primary-dark"
      >
        去餵小怪獸 →
      </Link>

      <section className="space-y-3">
        <h2 className="font-medium text-[#333333]">我的獎勵</h2>
        {rewards.length === 0 ? (
          <p className="text-sm text-[#8A8A8A]">繼續餵食小怪獸，解鎖專屬好禮！</p>
        ) : (
          rewards.map((r) => (
            <Card key={r.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{r.reward_name}</p>
                  <p className="text-xs text-[#8A8A8A]">{r.threshold_kg} kg 門檻</p>
                </div>
                <Badge variant={r.status === "issued" ? "default" : "secondary"}>
                  {REWARD_STATUS_LABELS[r.status] ?? r.status}
                </Badge>
              </CardContent>
            </Card>
          ))
        )}
      </section>
    </div>
  );
}
