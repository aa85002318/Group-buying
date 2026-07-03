"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { mockVideos } from "@/lib/mock-data";
import type { Video } from "@/lib/types/database";

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>(mockVideos);

  useEffect(() => {
    fetch("/api/videos").then((r) => r.json()).then((d) => d.videos?.length && setVideos(d.videos)).catch(() => {});
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-coffee">影音專區</h1>
      <div className="grid gap-3">
        {videos.map((v) => (
          <Link key={v.id} href={`/videos/${v.id}`}>
            <Card className="overflow-hidden">
              <div className="relative aspect-video bg-muted">
                {v.thumbnail_url && <Image src={v.thumbnail_url} alt={v.title} fill className="object-cover" unoptimized />}
              </div>
              <CardContent className="p-3">
                <p className="font-medium">{v.title}</p>
                <p className="text-xs text-muted-foreground">{v.view_count} 次觀看</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
