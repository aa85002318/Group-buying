"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bell } from "lucide-react";
import type { GroupBuyCampaignCardData } from "@/components/group-buy/GroupBuyCampaignCard";
import { GroupBuySectionHeader } from "@/components/group-buy/GroupBuySectionHeader";

function formatOpenAt(iso: string) {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return null;
  return d.toLocaleString("zh-TW", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function UpcomingGroupBuySection({
  campaigns,
  onViewMore,
}: {
  campaigns: GroupBuyCampaignCardData[];
  onViewMore: () => void;
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);

  const onNotify = useCallback(async (id: string) => {
    if (pendingId) return;
    setPendingId(id);
    try {
      const me = await fetch("/api/auth/me", { cache: "no-store" }).then((r) =>
        r.json()
      );
      if (!me?.user && !me?.profile) {
        window.location.href = `/auth/login?next=${encodeURIComponent("/group-buy")}`;
        return;
      }
      // TODO: wire per-campaign open reminder API when available — do not fake success
      const res = await fetch("/api/member/notification-preferences", {
        method: "GET",
        cache: "no-store",
      });
      if (!res.ok) {
        window.alert("通知設定暫不可用，請稍後再試。");
        return;
      }
      window.alert("開團提醒功能即將開放，目前已確認您已登入。");
    } catch {
      window.alert("無法設定通知，請稍後再試。");
    } finally {
      setPendingId(null);
    }
  }, [pendingId]);

  if (!campaigns.length) return null;

  return (
    <section aria-label="即將開團">
      <GroupBuySectionHeader
        title="即將開團"
        subtitle="搶先看，下次開團別錯過！"
        actionLabel="查看更多"
        onAction={onViewMore}
      />
      <ul className="mt-4 space-y-3">
        {campaigns.map((c) => {
          const name = c.productName || c.short_title || c.title;
          const image = c.productImage || c.banner_url;
          const openAt = formatOpenAt(c.start_at);
          return (
            <li
              key={`up-${c.id}`}
              className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-[0_6px_20px_rgba(21,62,115,0.08)]"
            >
              <Link
                href={`/group-buy/${c.id}`}
                className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl bg-[#EEF8FC]"
                aria-label={name}
              >
                {image ? (
                  <Image
                    src={image}
                    alt={name}
                    fill
                    className="object-cover"
                    sizes="72px"
                    unoptimized
                  />
                ) : null}
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/group-buy/${c.id}`}>
                  <h3 className="line-clamp-2 text-sm font-semibold text-[#153E73]">
                    {name}
                  </h3>
                </Link>
                {openAt ? (
                  <p className="mt-1 text-xs text-[#687386]">開團 {openAt}</p>
                ) : null}
              </div>
              <button
                type="button"
                disabled={pendingId === c.id}
                onClick={() => void onNotify(c.id)}
                aria-label="開團通知我"
                className="inline-flex h-11 shrink-0 items-center gap-1 rounded-full border border-[#79C7E8] bg-white px-3 text-xs font-semibold text-[#153E73] transition disabled:opacity-60"
              >
                <Bell className="h-4 w-4" aria-hidden />
                <span className="hidden min-[360px]:inline">開團通知我</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
