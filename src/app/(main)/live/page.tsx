"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Play, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Chip } from "@/components/ui/chip";
import { Skeleton } from "@/components/ui/skeleton";
import { mockLivestreams } from "@/lib/mock-data";
import type { Livestream } from "@/lib/types/database";

type Filter = "all" | "live" | "scheduled" | "ended";

function countdownLabel(scheduledAt: string | null) {
  if (!scheduledAt) return "即將開始";
  const diff = new Date(scheduledAt).getTime() - Date.now();
  if (diff <= 0) return "即將開始";
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hours >= 24) return `${Math.floor(hours / 24)} 天後開播`;
  if (hours > 0) return `${hours} 時 ${mins} 分後`;
  return `${mins} 分鐘後`;
}

export default function LivePage() {
  const [livestreams, setLivestreams] = useState<Livestream[]>(mockLivestreams);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    fetch("/api/livestreams")
      .then((r) => r.json())
      .then((d) => {
        if (d.livestreams?.length) setLivestreams(d.livestreams);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return livestreams;
    return livestreams.filter((l) => l.status === filter);
  }, [filter, livestreams]);

  return (
    <div className="page-enter space-y-5">
      <div>
        <h1 className="text-xl font-black text-coffee">直播中心</h1>
        <p className="mt-1 text-sm text-muted-foreground">直播中 · 倒數開播 · 精彩回放</p>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-none">
        {(
          [
            ["all", "全部"],
            ["live", "直播中"],
            ["scheduled", "即將開始"],
            ["ended", "回放"],
          ] as const
        ).map(([value, label]) => (
          <Chip key={value} active={filter === value} onClick={() => setFilter(value)} tone="primary">
            {label}
          </Chip>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="aspect-video w-full rounded-[20px]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">目前沒有直播</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((l) => (
            <Link key={l.id} href={`/live/${l.id}`} className="card-lift overflow-hidden">
              <div className="relative aspect-video bg-muted">
                {l.thumbnail_url && (
                  <Image src={l.thumbnail_url} alt={l.title} fill className="object-cover" unoptimized />
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/15">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-primary shadow-brand">
                    {l.status === "live" ? (
                      <Radio className="h-5 w-5" />
                    ) : (
                      <Play className="ml-0.5 h-5 w-5 fill-current" />
                    )}
                  </span>
                </div>
                {l.status === "live" && (
                  <Badge variant="live" className="absolute left-3 top-3 normal-case">
                    直播中
                  </Badge>
                )}
                {l.status === "scheduled" && (
                  <Badge variant="preorder" className="absolute left-3 top-3 normal-case">
                    倒數 {countdownLabel(l.scheduled_at)}
                  </Badge>
                )}
                {l.status === "ended" && (
                  <Badge variant="secondary" className="absolute left-3 top-3 normal-case">
                    回放
                  </Badge>
                )}
              </div>
              <div className="p-4">
                <p className="font-bold text-coffee">{l.title}</p>
                {l.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{l.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
