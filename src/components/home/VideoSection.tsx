import Link from "next/link";
import Image from "next/image";
import { Play } from "lucide-react";
import type { Video } from "@/lib/types/database";

interface VideoSectionProps {
  videos: Video[];
}

export function VideoSection({ videos }: VideoSectionProps) {
  const displayVideos = videos.slice(0, 4);

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-7 w-1.5 rounded-full bg-groupBuy" />
          <h2 className="section-title">影音專區</h2>
        </div>
        <Link href="/videos" className="text-sm font-bold text-primary">
          查看更多
        </Link>
      </div>

      {displayVideos.length === 0 ? (
        <p className="py-4 text-center text-sm text-foreground-secondary">暫無影片</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {displayVideos.map((v) => (
            <Link key={v.id} href={`/videos/${v.id}`} className="card-lift overflow-hidden">
              <div className="relative aspect-video bg-muted">
                {v.thumbnail_url ? (
                  <Image
                    src={v.thumbnail_url}
                    alt={v.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 512px) 50vw, 256px"
                    unoptimized
                  />
                ) : null}
                <div className="absolute inset-0 flex items-center justify-center bg-coffee/20">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-gradient text-white shadow-brand">
                    <Play className="ml-0.5 h-4 w-4 fill-current" />
                  </span>
                </div>
              </div>
              <div className="p-2.5">
                <p className="line-clamp-2 text-sm font-bold text-foreground">{v.title}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
