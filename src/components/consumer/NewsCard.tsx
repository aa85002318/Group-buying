import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import type { NewsItem } from "@/lib/consumer-hub";

const CATEGORY_LABEL: Record<string, string> = {
  new: "新品",
  campaign: "活動",
  store: "門市公告",
  course: "課程",
  live: "直播",
  closure: "停班停課",
  system: "系統公告",
  all: "全部",
};

export function NewsCard({ item }: { item: NewsItem }) {
  return (
    <Link
      href={item.href}
      className="card-lift block overflow-hidden p-4"
      aria-label={item.title}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-surface-soft px-2.5 py-0.5 text-[11px] font-bold text-primary">
          {CATEGORY_LABEL[item.category] ?? item.category}
        </span>
        {item.pinned && <StatusBadge tone="info" label="置頂" />}
        {item.important && <StatusBadge tone="error" label="重要" />}
      </div>
      <h3 className="mt-2 text-base font-black text-foreground">{item.title}</h3>
      <p className="mt-1 line-clamp-2 text-sm text-foreground-secondary">{item.summary}</p>
      <p className="mt-3 text-xs text-foreground-secondary">{item.publishedAt}</p>
    </Link>
  );
}
