import Link from "next/link";
import Image from "next/image";
import { Play, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Livestream } from "@/lib/types/database";

function countdownLabel(scheduledAt: string | null) {
  if (!scheduledAt) return null;
  const diff = new Date(scheduledAt).getTime() - Date.now();
  if (diff <= 0) return "即將開始";
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hours >= 24) return `${Math.floor(hours / 24)} 天後`;
  if (hours > 0) return `${hours} 時 ${mins} 分後`;
  return `${mins} 分後`;
}

export function LiveHomeSection({ livestreams }: { livestreams: Livestream[] }) {
  const items = livestreams.slice(0, 4);
  if (items.length === 0) return null;

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-7 w-1.5 rounded-full bg-error" />
          <h2 className="section-title">直播專區</h2>
          <Badge variant="live">LIVE</Badge>
        </div>
        <Link href="/live" className="text-sm font-bold text-primary">
          查看更多
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
        {items.map((l) => (
          <Link
            key={l.id}
            href={`/live/${l.id}`}
            className="card-lift w-[78%] shrink-0 overflow-hidden sm:w-[46%]"
          >
            <div className="relative aspect-video bg-muted">
              {l.thumbnail_url && (
                <Image src={l.thumbnail_url} alt={l.title} fill className="object-cover" unoptimized />
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-primary shadow-brand">
                  {l.status === "live" ? <Radio className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5 fill-current" />}
                </span>
              </div>
              {l.status === "live" && (
                <Badge variant="live" className="absolute left-2 top-2 normal-case">
                  直播中
                </Badge>
              )}
              {l.status === "scheduled" && (
                <Badge variant="preorder" className="absolute left-2 top-2 normal-case">
                  倒數 {countdownLabel(l.scheduled_at)}
                </Badge>
              )}
              {l.status === "ended" && (
                <Badge variant="secondary" className="absolute left-2 top-2 normal-case">
                  回放
                </Badge>
              )}
            </div>
            <div className="p-3">
              <p className="line-clamp-2 text-sm font-bold text-foreground">{l.title}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
