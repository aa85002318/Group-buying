"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MonsterIllustration } from "@/components/monster/MonsterIllustration";
import { MonsterProgressBar } from "@/components/monster/MonsterProgressBar";
import { Card, CardContent } from "@/components/ui/card";
import { getNextRewardThreshold } from "@/lib/services/monsterService";
import type { MonsterProfile } from "@/lib/types/database";

export default function MonsterSuccessClient() {
  const searchParams = useSearchParams();
  const breadKgEarned = Number(searchParams.get("breadKg") ?? 0);
  const isPending = searchParams.get("pending") === "1";

  const [profile, setProfile] = useState<MonsterProfile | null>(null);
  const [nextThreshold, setNextThreshold] = useState<number | null>(null);
  const [giftUnlocked, setGiftUnlocked] = useState(false);

  useEffect(() => {
    fetch("/api/monster/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.profile) {
          setProfile(d.profile);
          const bread = Number(d.profile.bread_kg);
          fetch("/api/monster/rewards")
            .then((r) => r.json())
            .then((rd) => {
              const next = rd.nextThreshold ?? getNextRewardThreshold(bread, []);
              setNextThreshold(next);
              const prev = bread - breadKgEarned;
              const threshold = rd.nextThreshold;
              if (threshold && prev < threshold && bread >= threshold) {
                setGiftUnlocked(true);
              }
            });
        }
      })
      .catch(() => {});
  }, [breadKgEarned]);

  const breadKg = Number(profile?.bread_kg ?? 0);
  const progressMax = nextThreshold ?? Math.max(breadKg + 5, 5);

  return (
    <div className="space-y-6 text-center py-4">
      <div className="text-5xl">🎉</div>
      <h1 className="text-xl font-bold text-[#333333]">分享成功！</h1>

      {isPending ? (
        <p className="text-sm text-[#8A8A8A]">
          你的分享已提交，待管理員審核後麵包才會入帳
        </p>
      ) : (
        <p className="text-sm text-[#8A8A8A]">麵包已入帳小怪獸帳戶</p>
      )}

      <Card className="border-[#F7DADA]">
        <CardContent className="space-y-4 p-6">
          <p className="text-lg">
            本次可獲得{" "}
            <span className="font-bold text-[#C94C4C]">{breadKgEarned.toFixed(1)} kg</span>{" "}
            麵包
            {isPending && <span className="text-[#8A8A8A]">（審核後入帳）</span>}
          </p>

          <div className="flex justify-center">
            <MonsterIllustration stage={profile?.current_stage ?? "eating"} />
          </div>

          <MonsterProgressBar
            current={breadKg}
            max={progressMax}
            label="累積進度"
          />

          {giftUnlocked && (
            <div className="rounded-xl bg-[#F7DADA] p-4 animate-pulse">
              <p className="font-bold text-[#9F2F2F]">🎁 恭喜解鎖新獎勵門檻！</p>
              <p className="text-sm text-[#8A8A8A] mt-1">管理員審核後將為你發放獎勵</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        <Link
          href="/monster"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-dark"
        >
          查看我的小怪獸
        </Link>
        <Link
          href="/monster/products"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-card px-4 text-sm font-medium hover:bg-muted"
        >
          繼續餵食
        </Link>
      </div>
    </div>
  );
}
