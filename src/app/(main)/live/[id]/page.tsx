"use client";

import { useEffect, useState } from "react";
import { mockLivestreams } from "@/lib/mock-data";
import type { Livestream } from "@/lib/types/database";

export default function LiveDetailPage({ params }: { params: { id: string } }) {
  const [livestream, setLivestream] = useState<Livestream | null>(
    mockLivestreams.find((l) => l.id === params.id) ?? null
  );

  useEffect(() => {
    fetch(`/api/livestreams/${params.id}`).then((r) => r.json()).then((d) => d.livestream && setLivestream(d.livestream)).catch(() => {});
  }, [params.id]);

  if (!livestream) return <p>載入中...</p>;

  return (
    <div className="space-y-4">
      <div className="aspect-video overflow-hidden rounded-xl bg-black">
        {livestream.stream_url ? (
          <iframe src={livestream.stream_url} className="h-full w-full" allowFullScreen title={livestream.title} />
        ) : (
          <div className="flex h-full items-center justify-center text-white">直播尚未開始</div>
        )}
      </div>
      <h1 className="text-xl font-bold">{livestream.title}</h1>
      <p className="text-sm text-muted-foreground">{livestream.description}</p>
    </div>
  );
}
