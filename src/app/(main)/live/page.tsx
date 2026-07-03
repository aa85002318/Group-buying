"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockLivestreams } from "@/lib/mock-data";
import type { Livestream } from "@/lib/types/database";

const statusLabel: Record<string, string> = {
  live: "直播中",
  scheduled: "即將開始",
  ended: "已結束",
};

export default function LivePage() {
  const [livestreams, setLivestreams] = useState<Livestream[]>(mockLivestreams);

  useEffect(() => {
    fetch("/api/livestreams").then((r) => r.json()).then((d) => d.livestreams?.length && setLivestreams(d.livestreams)).catch(() => {});
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-coffee">直播專區</h1>
      {livestreams.map((l) => (
        <Link key={l.id} href={`/live/${l.id}`}>
          <Card className="overflow-hidden">
            <div className="relative aspect-video bg-muted">
              {l.thumbnail_url && <Image src={l.thumbnail_url} alt={l.title} fill className="object-cover" unoptimized />}
              {l.status === "live" && (
                <Badge className="absolute left-2 top-2" variant="danger">LIVE</Badge>
              )}
            </div>
            <CardContent className="p-3">
              <p className="font-medium">{l.title}</p>
              <p className="text-xs text-muted-foreground">{statusLabel[l.status] ?? l.status}</p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
